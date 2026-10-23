import { Router } from 'express';
import { z } from 'zod';
import { User, Tutor, Booking } from '../../models/index.js';
import { wrap, HttpError, escapeRegex } from '../../middleware/util.js';
import { notifyBooking } from '../../notify.js';
import { audit, pageOf, pageMeta, toCsv, sendCsv } from './helpers.js';

const r = Router();
const POP = (q) =>
  q.populate('student', 'name telegram phone').populate({ path: 'tutor', populate: { path: 'user', select: 'name telegram phone' } }).populate('subject', 'name');

async function bookingFilter(q) {
  const f = {};
  if (q.status) f.status = String(q.status);
  if (q.from || q.to) {
    f.startsAt = {};
    if (q.from) f.startsAt.$gte = new Date(`${q.from}T00:00:00+05:00`);
    if (q.to) f.startsAt.$lte = new Date(`${q.to}T23:59:59+05:00`);
  }
  if (q.q) {
    const rx = new RegExp(escapeRegex(String(q.q)), 'i');
    const users = await User.find({ name: rx }).select('_id');
    const ids = users.map((u) => u._id);
    const tutors = await Tutor.find({ user: { $in: ids } }).select('_id');
    f.$or = [{ student: { $in: ids } }, { tutor: { $in: tutors.map((t) => t._id) } }];
  }
  return f;
}

/* ---------- Bronlar ---------- */
r.get(
  '/bookings',
  wrap(async (req, res) => {
    const { page, limit, skip } = pageOf(req);
    const f = await bookingFilter(req.query);
    const [items, total] = await Promise.all([POP(Booking.find(f).sort({ startsAt: -1 }).skip(skip).limit(limit)).lean(), Booking.countDocuments(f)]);
    res.json({ items, ...pageMeta(total, page, limit) });
  })
);

// Admin amallari: pilotda to'lov qo'lda tasdiqlanadi, nizoli bronlar qo'lda hal qilinadi
const ACTIONS = {
  'mark-paid': { from: ['confirmed'], to: 'paid', set: { paymentMethod: 'manual', paidAt: () => new Date() }, notify: 'paid' },
  complete: { from: ['paid'], to: 'completed', notify: 'completed', lesson: true },
  cancel: { from: ['pending', 'confirmed', 'paid'], to: 'cancelled', refundIfPaid: true, notify: 'admin-cancelled' },
};

r.post(
  '/bookings/:id/:action',
  wrap(async (req, res) => {
    const rule = ACTIONS[req.params.action];
    if (!rule) throw new HttpError(404, "Noma'lum amal");
    const booking = await Booking.findById(req.params.id);
    if (!booking) throw new HttpError(404, 'Bron topilmadi');
    if (!rule.from.includes(booking.status)) throw new HttpError(409, `Bu amal "${booking.status}" holatidagi bron uchun mumkin emas`);
    const set = { status: rule.to };
    for (const [k, v] of Object.entries(rule.set || {})) set[k] = typeof v === 'function' ? v() : v;
    if (rule.refundIfPaid && booking.status === 'paid') set.refunded = true;
    const updated = await Booking.findOneAndUpdate({ _id: booking._id, status: booking.status }, { $set: set }, { new: true });
    if (!updated) throw new HttpError(409, "Bron holati allaqachon o'zgargan");
    if (rule.lesson) await Tutor.findByIdAndUpdate(booking.tutor, { $inc: { lessonsCount: 1 } });
    audit(req, `booking.${req.params.action}`, booking._id, { from: booking.status, total: booking.total });
    notifyBooking(updated._id, rule.notify);
    res.json(updated);
  })
);

r.get(
  '/export/bookings.csv',
  wrap(async (req, res) => {
    const rows = await POP(Booking.find(await bookingFilter(req.query)).sort({ startsAt: -1 }).limit(5000)).lean();
    sendCsv(res, 'bronlar.csv', toCsv([
      { label: 'Dars vaqti', get: (b) => b.startsAt }, { label: 'Talaba', get: (b) => b.student?.name }, { label: 'Repetitor', get: (b) => b.tutor?.user?.name },
      { label: 'Fan', get: (b) => b.subject?.name }, { label: 'Holat', get: (b) => b.status }, { label: 'Narx', get: (b) => b.price }, { label: 'Chegirma', get: (b) => b.discount },
      { label: 'Jami', get: (b) => b.total }, { label: 'Komissiya', get: (b) => b.commission }, { label: 'Repetitor ulushi', get: (b) => b.payout },
      { label: "To'lov usuli", get: (b) => b.paymentMethod }, { label: "To'langan", get: (b) => b.paidAt }, { label: 'Qaytarilgan', get: (b) => (b.refunded ? 'ha' : '') },
      { label: "Repetitorga o'tkazilgan", get: (b) => (b.payoutPaid ? 'ha' : '') }, { label: 'Yaratilgan', get: (b) => b.createdAt },
    ], rows));
  })
);

/* ---------- Moliya ---------- */
r.get(
  '/finance',
  wrap(async (_req, res) => {
    const since = new Date(Date.now() - 180 * 86400e3);
    const month = { $dateToString: { format: '%Y-%m', date: '$paidAt', timezone: 'Asia/Tashkent' } };
    const [months, refunds, totals] = await Promise.all([
      Booking.aggregate([
        { $match: { status: { $in: ['paid', 'completed'] }, paidAt: { $gte: since } } },
        { $group: { _id: month, gross: { $sum: '$total' }, commission: { $sum: '$commission' }, payout: { $sum: '$payout' }, n: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      Booking.aggregate([{ $match: { refunded: true } }, { $group: { _id: null, n: { $sum: 1 }, sum: { $sum: '$total' } } }]),
      Booking.aggregate([{
        $group: {
          _id: null,
          held: { $sum: { $cond: [{ $eq: ['$status', 'paid'] }, '$payout', 0] } }, // dars hali o'tmagan
          owed: { $sum: { $cond: [{ $and: [{ $eq: ['$status', 'completed'] }, { $ne: ['$payoutPaid', true] }] }, '$payout', 0] } }, // repetitorga berilishi kerak
          paidOut: { $sum: { $cond: [{ $eq: ['$payoutPaid', true] }, '$payout', 0] } },
        },
      }]),
    ]);
    res.json({ months, refunds: refunds[0] || { n: 0, sum: 0 }, totals: totals[0] || { held: 0, owed: 0, paidOut: 0 } });
  })
);

const payoutRows = () =>
  Booking.aggregate([
    { $match: { status: { $in: ['paid', 'completed'] } } },
    {
      $group: {
        _id: '$tutor',
        held: { $sum: { $cond: [{ $eq: ['$status', 'paid'] }, '$payout', 0] } },
        owed: { $sum: { $cond: [{ $and: [{ $eq: ['$status', 'completed'] }, { $ne: ['$payoutPaid', true] }] }, '$payout', 0] } },
        owedCount: { $sum: { $cond: [{ $and: [{ $eq: ['$status', 'completed'] }, { $ne: ['$payoutPaid', true] }] }, 1, 0] } },
        paidOut: { $sum: { $cond: [{ $eq: ['$payoutPaid', true] }, '$payout', 0] } },
      },
    },
    { $lookup: { from: 'tutors', localField: '_id', foreignField: '_id', as: 't' } },
    { $lookup: { from: 'users', localField: 't.user', foreignField: '_id', as: 'u' } },
    { $project: { held: 1, owed: 1, owedCount: 1, paidOut: 1, name: { $first: '$u.name' }, telegram: { $first: '$u.telegram' }, phone: { $first: '$u.phone' } } },
    { $sort: { owed: -1, held: -1 } },
  ]);

r.get('/payouts', wrap(async (_req, res) => res.json(await payoutRows())));

r.post(
  '/payouts/:tutorId/settle',
  wrap(async (req, res) => {
    const tutor = await Tutor.findById(req.params.tutorId).populate('user', 'name');
    if (!tutor) throw new HttpError(404, 'Repetitor topilmadi');
    const due = await Booking.aggregate([{ $match: { tutor: tutor._id, status: 'completed', payoutPaid: { $ne: true } } }, { $group: { _id: null, sum: { $sum: '$payout' }, n: { $sum: 1 } } }]);
    const r2 = await Booking.updateMany({ tutor: tutor._id, status: 'completed', payoutPaid: { $ne: true } }, { $set: { payoutPaid: true, payoutAt: new Date() } });
    audit(req, 'payout.settle', `${tutor.user?.name} (${tutor._id})`, { bookings: r2.modifiedCount, sum: due[0]?.sum || 0 });
    res.json({ settled: r2.modifiedCount, sum: due[0]?.sum || 0 });
  })
);

r.get(
  '/export/payouts.csv',
  wrap(async (_req, res) => {
    sendCsv(res, 'repetitor-hisob.csv', toCsv([
      { label: 'Repetitor', get: (x) => x.name }, { label: 'Telegram', get: (x) => x.telegram }, { label: 'Telefon', get: (x) => x.phone },
      { label: "O'tkazib berilishi kerak", get: (x) => x.owed }, { label: 'Darslar soni', get: (x) => x.owedCount }, { label: 'Kutilmoqda (dars o‘tmagan)', get: (x) => x.held }, { label: "Avval o'tkazilgan", get: (x) => x.paidOut },
    ], await payoutRows()));
  })
);

export default r;
