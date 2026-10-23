import { Router } from 'express';
import { z } from 'zod';
import { Booking, Tutor, Review } from '../models/index.js';
import { requireAuth } from '../middleware/auth.js';
import { wrap, HttpError } from '../middleware/util.js';
import { freeSlots, priceBreakdown, refreshTutorRating } from '../lib.js';
import { pay } from '../payments.js';
import { getSettings } from '../settings.js';
import { notifyBooking } from '../notify.js';

const r = Router();
r.use(requireAuth);

const populate = (q) =>
  q
    .populate({ path: 'tutor', select: 'user pricePerHour telegram', populate: { path: 'user', select: 'name telegram phone' } })
    .populate('subject', 'name')
    .populate('student', 'name telegram phone');

// Aloqa ma'lumoti (telegram) faqat tasdiqlangan bronda ko'rinadi
function present(b, viewerId) {
  const o = b.toObject();
  const confirmed = ['confirmed', 'paid', 'completed'].includes(o.status);
  if (!confirmed) {
    if (o.tutor) delete o.tutor.telegram;
    if (o.tutor?.user) { delete o.tutor.user.telegram; delete o.tutor.user.phone; }
    if (o.student) { delete o.student.telegram; delete o.student.phone; }
  }
  o.viewerIsStudent = String(b.student._id ?? b.student) === String(viewerId);
  return o;
}

r.post(
  '/',
  wrap(async (req, res) => {
    const { tutor: tutorId, subject, startsAt, note } = z
      .object({ tutor: z.string(), subject: z.string(), startsAt: z.string().datetime(), note: z.string().max(500).optional() })
      .parse(req.body);
    const tutor = await Tutor.findOne({ _id: tutorId, status: 'approved' });
    if (!tutor) throw new HttpError(404, 'Repetitor topilmadi');
    if (String(tutor.user) === String(req.user._id)) throw new HttpError(400, "O'zingizdan dars olib bo'lmaydi");
    if (!tutor.subjects.some((s) => String(s) === subject)) throw new HttpError(400, 'Repetitor bu fandan dars bermaydi');

    const slots = await freeSlots(tutor);
    const iso = new Date(startsAt).toISOString();
    if (!slots.includes(iso)) throw new HttpError(409, 'Bu vaqt band yoki mavjud emas — boshqa vaqt tanlang');

    const prior = await Booking.exists({ student: req.user._id, status: { $in: ['paid', 'completed'] } });
    const money = priceBreakdown(tutor.pricePerHour, !prior);
    let booking;
    try {
      booking = await Booking.create({ student: req.user._id, tutor: tutor._id, subject, startsAt: iso, note, ...money });
    } catch (e) {
      // bir vaqtda kelgan ikkinchi so'rov noyob indeksga urildi
      if (e.code === 11000) throw new HttpError(409, 'Bu vaqt band yoki mavjud emas — boshqa vaqt tanlang');
      throw e;
    }
    notifyBooking(booking._id, 'new');
    res.status(201).json(booking);
  })
);

r.get(
  '/mine',
  wrap(async (req, res) => {
    const list = await populate(Booking.find({ student: req.user._id }).sort({ startsAt: -1 }));
    const reviewed = new Set((await Review.find({ student: req.user._id }).select('booking')).map((x) => String(x.booking)));
    res.json(list.map((b) => ({ ...present(b, req.user._id), reviewed: reviewed.has(String(b._id)) })));
  })
);

r.get(
  '/incoming',
  wrap(async (req, res) => {
    const tutor = await Tutor.findOne({ user: req.user._id });
    if (!tutor) return res.json([]);
    const list = await populate(Booking.find({ tutor: tutor._id }).sort({ startsAt: -1 }));
    res.json(list.map((b) => present(b, req.user._id)));
  })
);

const ACTIONS = {
  // action: [kim, qaysi holatlardan, yangi holat]
  confirm: ['tutor', ['pending'], 'confirmed'],
  reject: ['tutor', ['pending', 'confirmed', 'paid'], 'cancelled'],
  complete: ['tutor', ['paid'], 'completed'],
  cancel: ['student', ['pending', 'confirmed', 'paid'], 'cancelled'],
};

r.patch(
  '/:id/:action',
  wrap(async (req, res) => {
    const rule = ACTIONS[req.params.action];
    if (!rule) throw new HttpError(404, 'Noma\'lum amal');
    const booking = await Booking.findById(req.params.id);
    if (!booking) throw new HttpError(404, 'Bron topilmadi');
    const [who, from, to] = rule;

    if (who === 'tutor') {
      const tutor = await Tutor.findOne({ user: req.user._id });
      if (!tutor || String(booking.tutor) !== String(tutor._id)) throw new HttpError(403, "Ruxsat yo'q");
    } else if (String(booking.student) !== String(req.user._id)) throw new HttpError(403, "Ruxsat yo'q");

    if (!from.includes(booking.status)) throw new HttpError(409, `Bu bronni hozirgi holatda o'zgartirib bo'lmaydi (${booking.status})`);
    if (req.params.action === 'complete' && booking.startsAt > new Date()) throw new HttpError(409, 'Dars hali boshlanmadi');

    // to'langan darsni talaba faqat belgilangan muddatdan oldin bekor qila oladi; repetitor rad etsa — to'liq qaytariladi
    const hours = getSettings().cancelHours;
    let refunded = false;
    if (to === 'cancelled' && booking.status === 'paid') {
      if (who === 'student' && booking.startsAt - Date.now() < hours * 3600e3)
        throw new HttpError(409, `Darsga ${hours} soatdan kam qolgan — to'lov qaytarilmaydi`);
      refunded = true;
    }

    // atomik o'tish: boshqa so'rov holatni allaqachon o'zgartirgan bo'lsa, yangilanmaydi
    const updated = await Booking.findOneAndUpdate({ _id: booking._id, status: booking.status }, { $set: { status: to, ...(refunded && { refunded: true }) } }, { new: true });
    if (!updated) throw new HttpError(409, "Bron holati allaqachon o'zgargan, sahifani yangilang");
    if (to === 'completed') await Tutor.findByIdAndUpdate(booking.tutor, { $inc: { lessonsCount: 1 } });
    notifyBooking(updated._id, { confirm: 'confirmed', reject: 'rejected', complete: 'completed', cancel: 'cancelled' }[req.params.action]);
    res.json(updated);
  })
);

r.post(
  '/:id/pay',
  wrap(async (req, res) => {
    const { method } = z.object({ method: z.enum(['click', 'payme', 'card']) }).parse(req.body);
    // avval holatni "to'langan"ga atomik o'tkazamiz (ikki marta bosilsa, ikkinchisi rad etiladi), keyin provayderni chaqiramiz
    const booking = await Booking.findOneAndUpdate(
      { _id: req.params.id, student: req.user._id, status: 'confirmed' },
      { $set: { status: 'paid', paymentMethod: method, paidAt: new Date() } },
      { new: true }
    );
    if (!booking) throw new HttpError(409, "To'lov faqat repetitor tasdiqlagandan keyin, va faqat bir marta");
    try {
      await pay({ booking, method });
    } catch (e) {
      await Booking.updateOne({ _id: booking._id }, { $set: { status: 'confirmed' }, $unset: { paymentMethod: 1, paidAt: 1 } });
      throw e;
    }
    notifyBooking(booking._id, 'paid');
    res.json(booking);
  })
);

r.post(
  '/:id/review',
  wrap(async (req, res) => {
    const { rating, comment } = z.object({ rating: z.number().int().min(1).max(5), comment: z.string().trim().max(800).optional() }).parse(req.body);
    const booking = await Booking.findOne({ _id: req.params.id, student: req.user._id });
    if (!booking) throw new HttpError(404, 'Bron topilmadi');
    if (booking.status !== 'completed') throw new HttpError(409, "Faqat dars o'tgandan keyin baho qo'yish mumkin");
    const review = await Review.create({ booking: booking._id, student: req.user._id, tutor: booking.tutor, rating, comment });
    await refreshTutorRating(booking.tutor, Review);
    res.status(201).json(review);
  })
);

export default r;
