import { Router } from 'express';
import { z } from 'zod';
import { Subject, Exam, Material, Tutor, Quiz } from '../models/index.js';
import { aiAvailable } from '../ai.js';
import { requireAuth } from '../middleware/auth.js';
import { wrap, escapeRegex, HttpError } from '../middleware/util.js';
import { config } from '../config.js';
import { bot } from '../telegram.js';
import { getSettings } from '../settings.js';
import { FACULTIES, FORMATS, LANGUAGES, MATERIAL_TYPES, EXAM_TYPES, FACULTY_KEYS } from '../data/meta.js';

const r = Router();

r.get('/meta', (_req, res) =>
  res.json({
    faculties: FACULTIES,
    formats: FORMATS,
    languages: LANGUAGES,
    materialTypes: MATERIAL_TYPES,
    examTypes: EXAM_TYPES,
    telegramLogin: !!bot.username,
    commission: getSettings().commission,
    firstLessonDiscount: getSettings().firstLessonDiscount,
    cancelHours: getSettings().cancelHours,
    registrationOpen: getSettings().registrationOpen,
    banner: getSettings().banner.active && getSettings().banner.text ? getSettings().banner : null,
    paymentMode: process.env.PAYMENT_PROVIDER || 'mock',
    aiExplain: aiAvailable(),
  })
);

/** faculty+year bo'yicha filtr: faqat o'ziga tegishli fanlar (qo'shimcha fanlar — 'all' — hammaga) */
function subjectFilter({ faculty, year, q, category }) {
  const f = { active: { $ne: false } }; // admin yashirgan fanlar talabaga ko'rinmaydi
  if (faculty && FACULTY_KEYS.includes(faculty)) f.faculty = { $in: [faculty, 'all'] };
  if (year) f.years = Number(year);
  if (category) f.category = category;
  if (q) f.name = new RegExp(escapeRegex(q), 'i');
  return f;
}

r.get(
  '/subjects',
  wrap(async (req, res) => {
    const subjects = await Subject.find(subjectFilter(req.query)).sort({ category: 1, name: 1 }).lean();
    const counts = await Tutor.aggregate([
      { $match: { status: 'approved' } },
      { $unwind: '$subjects' },
      { $group: { _id: '$subjects', n: { $sum: 1 } } },
    ]);
    const map = new Map(counts.map((c) => [String(c._id), c.n]));
    res.json(subjects.map((s) => ({ ...s, tutorCount: map.get(String(s._id)) || 0 })));
  })
);

r.get(
  '/subjects/:id',
  wrap(async (req, res) => {
    const subject = await Subject.findById(req.params.id).lean();
    if (!subject || subject.active === false) throw new HttpError(404, 'Fan topilmadi');
    const [tutors, materials, exams, quizzes] = await Promise.all([
      Tutor.find({ subjects: subject._id, status: 'approved' })
        .populate('user', 'name faculty year')
        .sort({ featured: -1, ratingAvg: -1 })
        .lean(),
      Material.find({ subject: subject._id, status: 'approved' }).select('-body').sort({ order: 1, createdAt: -1 }).lean(),
      Exam.find({ subject: subject._id }).sort({ date: 1 }).lean(),
      Quiz.find({ subject: subject._id, status: 'approved' }).select('title description byTutor attempts questions._id').sort({ createdAt: -1 }).lean(),
    ]);
    const quizList = quizzes.map(({ questions, ...q }) => ({ ...q, count: questions.length }));
    res.json({ subject, tutors, materials, exams, quizzes: quizList });
  })
);

r.get(
  '/exams',
  wrap(async (req, res) => {
    const subs = await Subject.find(subjectFilter(req.query)).select('_id');
    const exams = await Exam.find({ subject: { $in: subs.map((s) => s._id) }, date: { $gte: new Date(Date.now() - 86400e3) } })
      .populate('subject', 'name faculty')
      .sort({ date: 1 })
      .lean();
    res.json(exams);
  })
);

r.get(
  '/materials',
  wrap(async (req, res) => {
    const f = { status: 'approved' };
    if (req.query.subject) f.subject = req.query.subject;
    if (req.query.type) f.type = req.query.type;
    if (req.query.faculty || req.query.year) {
      const subs = await Subject.find(subjectFilter(req.query)).select('_id');
      f.subject = req.query.subject ? req.query.subject : { $in: subs.map((s) => s._id) };
    }
    res.json(await Material.find(f).select('-body').populate('subject', 'name').populate('author', 'name').sort({ order: 1, createdAt: -1 }).limit(200).lean());
  })
);

// Bitta material (matnli konspekt saytning o'zida o'qiladi)
r.get(
  '/materials/:id',
  wrap(async (req, res) => {
    const m = await Material.findOne({ _id: req.params.id, status: 'approved' }).populate('subject', 'name topics').lean();
    if (!m) throw new HttpError(404, 'Material topilmadi');
    // Shu fanning boshqa matnli konspektlari: oldingi/keyingi mavzuga o'tish uchun
    const siblings = await Material.find({ subject: m.subject?._id, status: 'approved', url: '' }).select('title order').sort({ order: 1, createdAt: 1 }).lean();
    res.json({ ...m, siblings });
  })
);

const httpUrl = z.string().url().refine((u) => /^https?:\/\//i.test(u), 'Faqat http(s) havola');

r.post(
  '/materials',
  requireAuth,
  wrap(async (req, res) => {
    const data = z
      .object({
        subject: z.string(),
        title: z.string().trim().min(3).max(140),
        type: z.enum(MATERIAL_TYPES),
        url: httpUrl,
        description: z.string().max(500).optional(),
      })
      .parse(req.body);
    const material = await Material.create({
      ...data,
      author: req.user._id,
      status: req.user.role === 'admin' ? 'approved' : 'pending', // moderatsiya
    });
    res.status(201).json(material);
  })
);

export default r;
