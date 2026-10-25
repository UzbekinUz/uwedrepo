import { Router } from 'express';
import { z } from 'zod';
import { Tutor, User, Subject, Review } from '../models/index.js';
import { requireAuth } from '../middleware/auth.js';
import { wrap, escapeRegex, HttpError } from '../middleware/util.js';
import { freeSlots } from '../lib.js';
import { notifyAdmins } from '../notify.js';
import { config } from '../config.js';
import { FORMATS, LANGUAGES } from '../data/meta.js';

const r = Router();

const hhmm = z.string().regex(/^([01]\d|2[0-3]):00$/, 'Soat "HH:00" ko\'rinishida');
const tutorSchema = z.object({
  headline: z.string().trim().min(5).max(120),
  bio: z.string().trim().max(1500).optional(),
  experience: z.string().trim().max(300).optional(),
  pricePerHour: z.number().int().min(10000).max(2000000),
  subjects: z.array(z.string()).min(1).max(8),
  formats: z.array(z.enum(FORMATS)).min(1),
  languages: z.array(z.enum(LANGUAGES)).min(1),
  telegram: z.string().trim().max(64).optional(),
  availability: z
    .array(z.object({ day: z.number().int().min(0).max(6), from: hhmm, to: hhmm }).refine((a) => parseInt(a.from) < parseInt(a.to), 'Boshlanish tugashdan oldin bo\'lsin'))
    .max(21),
});

// Telegram faqat tasdiqlangan bronda ochiladi, ommaviy ro'yxatda yashiriladi
const card = ({ telegram, ...t }) => t;

r.get(
  '/',
  wrap(async (req, res) => {
    const { subject, minPrice, maxPrice, format, language, sort = 'rating', q, faculty, year } = req.query;
    const f = { status: 'approved' };
    if (subject) f.subjects = subject;
    else if (faculty || year) {
      const sf = { active: { $ne: false } };
      if (faculty) sf.faculty = { $in: [faculty, 'all'] };
      if (year) sf.years = Number(year);
      f.subjects = { $in: (await Subject.find(sf).select('_id')).map((s) => s._id) };
    }
    if (format) f.formats = format;
    if (language) f.languages = language;
    if (minPrice || maxPrice) f.pricePerHour = { ...(minPrice && { $gte: Number(minPrice) }), ...(maxPrice && { $lte: Number(maxPrice) }) };
    if (q) {
      const rx = new RegExp(escapeRegex(String(q)), 'i');
      const users = await User.find({ name: rx }).select('_id');
      f.$or = [{ user: { $in: users.map((u) => u._id) } }, { headline: rx }, { bio: rx }];
    }
    const order = {
      rating: { featured: -1, ratingAvg: -1, ratingCount: -1 },
      priceAsc: { featured: -1, pricePerHour: 1 },
      priceDesc: { featured: -1, pricePerHour: -1 },
      lessons: { featured: -1, lessonsCount: -1 },
    }[sort] || { featured: -1, ratingAvg: -1 };
    const tutors = await Tutor.find(f)
      .populate('user', 'name faculty year')
      .populate('subjects', 'name')
      .sort(order)
      .limit(100)
      .lean();
    res.json(tutors.map(card));
  })
);

r.get(
  '/me',
  requireAuth,
  wrap(async (req, res) => {
    const t = await Tutor.findOne({ user: req.user._id }).populate('subjects', 'name').lean();
    res.json(t); // null bo'lishi mumkin
  })
);

r.post(
  '/',
  requireAuth,
  wrap(async (req, res) => {
    if (req.user.role === 'admin') throw new HttpError(400, 'Admin repetitor bo\'la olmaydi');
    if (await Tutor.exists({ user: req.user._id })) throw new HttpError(409, 'Anketa allaqachon yuborilgan');
    const data = tutorSchema.parse(req.body);
    const tutor = await Tutor.create({ ...data, user: req.user._id, status: 'pending' });
    notifyAdmins(`Yangi repetitor anketasi: ${req.user.name}. Ko'rib chiqish: ${config.clientOrigin}/admin?tab=tutors`);
    res.status(201).json(tutor);
  })
);

r.put(
  '/me',
  requireAuth,
  wrap(async (req, res) => {
    const tutor = await Tutor.findOne({ user: req.user._id });
    if (!tutor) throw new HttpError(404, 'Anketa topilmadi');
    Object.assign(tutor, tutorSchema.parse(req.body)); // status/featured/rating o'zgarmaydi
    await tutor.save();
    res.json(tutor);
  })
);

r.get(
  '/:id',
  wrap(async (req, res) => {
    const tutor = await Tutor.findOne({ _id: req.params.id, status: 'approved' })
      .populate('user', 'name faculty year')
      .populate('subjects', 'name')
      .lean();
    if (!tutor) throw new HttpError(404, 'Repetitor topilmadi');
    const reviews = await Review.find({ tutor: tutor._id, hidden: { $ne: true } }).populate('student', 'name').sort({ createdAt: -1 }).limit(50).lean();
    res.json({ tutor: card(tutor), reviews: reviews.map((x) => ({ ...x, student: { name: x.student?.name?.split(' ')[0] } })) });
  })
);

r.get(
  '/:id/slots',
  wrap(async (req, res) => {
    const tutor = await Tutor.findOne({ _id: req.params.id, status: 'approved' });
    if (!tutor) throw new HttpError(404, 'Repetitor topilmadi');
    res.json(await freeSlots(tutor));
  })
);

export default r;
