import { Router } from 'express';
import { z } from 'zod';
import { User, Tutor, Booking, Review } from '../../models/index.js';
import { wrap, HttpError, escapeRegex } from '../../middleware/util.js';
import { refreshTutorRating } from '../../lib.js';
import { notifyUser } from '../../telegram.js';
import { config } from '../../config.js';
import { audit, pageOf, pageMeta, toCsv, sendCsv } from './helpers.js';

const r = Router();

/* ---------- Foydalanuvchilar ---------- */
function userFilter(q) {
  const f = {};
  if (q.role) f.role = String(q.role);
  if (q.blocked === '1') f.blocked = true;
  if (q.q) {
    const rx = new RegExp(escapeRegex(String(q.q)), 'i');
    f.$or = [{ name: rx }, { email: rx }, { telegram: rx }, { phone: rx }];
  }
  return f;
}

r.get(
  '/users',
  wrap(async (req, res) => {
    const { page, limit, skip } = pageOf(req);
    const f = userFilter(req.query);
    const [items, total] = await Promise.all([User.find(f).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(), User.countDocuments(f)]);
    const counts = await Booking.aggregate([{ $match: { student: { $in: items.map((u) => u._id) } } }, { $group: { _id: '$student', n: { $sum: 1 } } }]);
    const map = new Map(counts.map((c) => [String(c._id), c.n]));
    res.json({ items: items.map((u) => ({ ...u, bookings: map.get(String(u._id)) || 0 })), ...pageMeta(total, page, limit) });
  })
);

r.get(
  '/users/:id',
  wrap(async (req, res) => {
    const user = await User.findById(req.params.id).lean();
    if (!user) throw new HttpError(404, 'Foydalanuvchi topilmadi');
    const [bookings, tutor, reviews] = await Promise.all([
      Booking.find({ student: user._id }).sort({ startsAt: -1 }).limit(10).populate({ path: 'tutor', populate: { path: 'user', select: 'name' } }).populate('subject', 'name').lean(),
      Tutor.findOne({ user: user._id }).select('status pricePerHour ratingAvg ratingCount lessonsCount').lean(),
      Review.countDocuments({ student: user._id }),
    ]);
    res.json({ user, bookings, tutor, reviews });
  })
);

r.patch(
  '/users/:id',
  wrap(async (req, res) => {
    const data = z.object({ role: z.enum(['student', 'admin']).optional(), blocked: z.boolean().optional() }).parse(req.body);
    const user = await User.findById(req.params.id);
    if (!user) throw new HttpError(404, 'Foydalanuvchi topilmadi');
    const self = String(user._id) === String(req.user._id);
    if (self && (data.blocked || (data.role && data.role !== 'admin'))) throw new HttpError(400, "O'zingizni bloklab yoki adminlikdan ola olmaysiz");
    if (data.role === 'student' && user.role === 'admin' && (await User.countDocuments({ role: 'admin', blocked: { $ne: true } })) <= 1)
      throw new HttpError(400, "Oxirgi adminni olib tashlab bo'lmaydi");
    if (data.role) {
      // repetitor roli Tutor anketasi tasdiqlanishidan kelib chiqadi: tasdiqlangan repetitorni "student" qilsak ham panel anketa orqali ishlaydi
      user.role = data.role === 'student' && (await Tutor.exists({ user: user._id, status: 'approved' })) ? 'tutor' : data.role;
    }
    if (data.blocked !== undefined) user.blocked = data.blocked;
    await user.save();
    audit(req, data.blocked !== undefined ? (data.blocked ? 'user.block' : 'user.unblock') : 'user.role', `${user.name} (${user._id})`, data);
    if (data.blocked === true) notifyUser(user, "Akkauntingiz administrator tomonidan bloklandi. Savollar bo'lsa, administratorga yozing.");
    res.json({ ok: true, user: { _id: user._id, role: user.role, blocked: user.blocked } });
  })
);

r.get(
  '/export/users.csv',
  wrap(async (req, res) => {
    const rows = await User.find(userFilter(req.query)).sort({ createdAt: -1 }).lean();
    sendCsv(res, 'foydalanuvchilar.csv', toCsv([
      { label: 'Ism', get: (u) => u.name }, { label: 'Rol', get: (u) => u.role }, { label: 'Telegram', get: (u) => u.telegram }, { label: 'Telefon', get: (u) => u.phone },
      { label: 'Email', get: (u) => u.email }, { label: 'Fakultet', get: (u) => u.faculty }, { label: 'Kurs', get: (u) => u.year },
      { label: 'Bloklangan', get: (u) => (u.blocked ? 'ha' : '') }, { label: "Ro'yxatdan o'tgan", get: (u) => u.createdAt },
    ], rows));
  })
);

/* ---------- Repetitorlar moderatsiyasi ---------- */
r.get(
  '/tutors',
  wrap(async (req, res) => {
    const f = {};
    if (req.query.status) f.status = String(req.query.status);
    if (req.query.q) {
      const rx = new RegExp(escapeRegex(String(req.query.q)), 'i');
      const users = await User.find({ $or: [{ name: rx }, { telegram: rx }, { email: rx }] }).select('_id');
      f.$or = [{ user: { $in: users.map((u) => u._id) } }, { headline: rx }];
    }
    const [items, counts] = await Promise.all([
      Tutor.find(f).populate('user', 'name email phone telegram faculty year blocked').populate('subjects', 'name').sort({ createdAt: -1 }).limit(200).lean(),
      Tutor.aggregate([{ $group: { _id: '$status', n: { $sum: 1 } } }]),
    ]);
    const earn = await Booking.aggregate([
      { $match: { tutor: { $in: items.map((t) => t._id) }, status: { $in: ['paid', 'completed'] } } },
      { $group: { _id: '$tutor', revenue: { $sum: '$total' }, payout: { $sum: '$payout' } } },
    ]);
    const em = new Map(earn.map((e) => [String(e._id), e]));
    res.json({ items: items.map((t) => ({ ...t, revenue: em.get(String(t._id))?.revenue || 0, payoutTotal: em.get(String(t._id))?.payout || 0 })), counts: Object.fromEntries(counts.map((c) => [c._id, c.n])) });
  })
);

r.patch(
  '/tutors/:id',
  wrap(async (req, res) => {
    const data = z.object({ status: z.enum(['pending', 'approved', 'rejected']).optional(), featured: z.boolean().optional(), rejectReason: z.string().trim().max(300).optional() }).parse(req.body);
    if (data.status === 'rejected' && !data.rejectReason) throw new HttpError(400, 'Rad etish sababini yozing: repetitor uni ko\'radi');
    const tutor = await Tutor.findByIdAndUpdate(req.params.id, { ...data, ...(data.status === 'approved' && { rejectReason: '' }) }, { new: true }).populate('user', 'name telegramId blocked');
    if (!tutor) throw new HttpError(404, 'Topilmadi');
    if (data.status) {
      await User.findByIdAndUpdate(tutor.user._id, { role: data.status === 'approved' ? 'tutor' : 'student' });
      notifyUser(tutor.user, data.status === 'approved'
        ? `Anketangiz tasdiqlandi! Endi katalogda ko'rinasiz: ${config.clientOrigin}/tutor`
        : data.status === 'rejected' ? `Anketangiz rad etildi. Sabab: ${data.rejectReason}\nAnketani yangilab, qayta yuborishingiz mumkin.` : "Anketangiz qayta ko'rib chiqish uchun qaytarildi.");
    }
    audit(req, data.status ? `tutor.${data.status}` : 'tutor.featured', `${tutor.user.name} (${tutor._id})`, data);
    res.json(tutor);
  })
);

/* ---------- Sharhlar moderatsiyasi ---------- */
r.get(
  '/reviews',
  wrap(async (req, res) => {
    const { page, limit, skip } = pageOf(req);
    const f = {};
    if (req.query.hidden === '1') f.hidden = true;
    if (req.query.rating) f.rating = Number(req.query.rating);
    const [items, total] = await Promise.all([
      Review.find(f).sort({ createdAt: -1 }).skip(skip).limit(limit).populate('student', 'name').populate({ path: 'tutor', populate: { path: 'user', select: 'name' } }).lean(),
      Review.countDocuments(f),
    ]);
    res.json({ items, ...pageMeta(total, page, limit) });
  })
);

r.patch(
  '/reviews/:id',
  wrap(async (req, res) => {
    const { hidden } = z.object({ hidden: z.boolean() }).parse(req.body);
    const review = await Review.findByIdAndUpdate(req.params.id, { hidden }, { new: true });
    if (!review) throw new HttpError(404, 'Sharh topilmadi');
    await refreshTutorRating(review.tutor, Review);
    audit(req, hidden ? 'review.hide' : 'review.show', review._id);
    res.json(review);
  })
);

r.delete(
  '/reviews/:id',
  wrap(async (req, res) => {
    const review = await Review.findByIdAndDelete(req.params.id);
    if (review) {
      await refreshTutorRating(review.tutor, Review);
      audit(req, 'review.delete', review._id, { rating: review.rating });
    }
    res.json({ ok: true });
  })
);

export default r;
