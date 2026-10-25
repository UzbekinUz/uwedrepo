import { Router } from 'express';
import { z } from 'zod';
import { Subject, Exam, Material, Tutor } from '../../models/index.js';
import { STARTER_SUBJECTS } from '../../seed.js';
import { wrap, HttpError, escapeRegex } from '../../middleware/util.js';
import { FACULTY_KEYS, EXAM_TYPES } from '../../data/meta.js';
import { audit } from './helpers.js';

const r = Router();

/* ---------- Fanlar ---------- */
const subjectSchema = z.object({
  name: z.string().trim().min(2).max(100),
  faculty: z.enum([...FACULTY_KEYS, 'all']),
  years: z.array(z.number().int().min(1).max(4)).min(1),
  category: z.enum(['core', 'extra']).default('core'),
  description: z.string().max(500).optional(),
  telegramGroup: z.union([z.string().url().refine((u) => /^https?:\/\//i.test(u), 'Faqat http(s) havola'), z.literal('')]).optional(),
  active: z.boolean().optional(),
});

// Admin ko'radigan to'liq ro'yxat: yashirinlari ham, hamda har bir fanga bog'liq repetitor, sana va material soni
r.get('/subjects', wrap(async (_req, res) => {
  const [subjects, tut, exams, mats] = await Promise.all([
    Subject.find().sort({ category: 1, name: 1 }).lean(),
    Tutor.aggregate([{ $match: { status: 'approved' } }, { $unwind: '$subjects' }, { $group: { _id: '$subjects', n: { $sum: 1 } } }]),
    Exam.aggregate([{ $group: { _id: '$subject', n: { $sum: 1 } } }]),
    Material.aggregate([{ $match: { status: 'approved' } }, { $group: { _id: '$subject', n: { $sum: 1 } } }]),
  ]);
  const by = (arr) => new Map(arr.map((x) => [String(x._id), x.n]));
  const [t, e, m] = [by(tut), by(exams), by(mats)];
  res.json(subjects.map((s) => ({ ...s, active: s.active !== false, tutors: t.get(String(s._id)) || 0, exams: e.get(String(s._id)) || 0, materials: m.get(String(s._id)) || 0 })));
}));

// Bir necha fanni birdan qo'shish. Fakultet va nom bir xil bo'lgan mavjud fanlar o'tkazib yuboriladi.
const addMany = async (items) => {
  const have = new Set((await Subject.find().select('name faculty').lean()).map((s) => `${s.faculty}|${s.name.toLowerCase()}`));
  const fresh = [];
  const skipped = [];
  for (const it of items) {
    const key = `${it.faculty}|${it.name.toLowerCase()}`;
    if (have.has(key)) skipped.push(it.name);
    else { have.add(key); fresh.push(it); }
  }
  if (fresh.length) await Subject.insertMany(fresh);
  return { added: fresh.length, skipped };
};

r.post('/subjects/bulk', wrap(async (req, res) => {
  const { names, faculty, years, category } = z.object({
    names: z.array(z.string().trim().min(2).max(100)).min(1).max(60),
    faculty: z.enum([...FACULTY_KEYS, 'all']),
    years: z.array(z.number().int().min(1).max(4)).min(1),
    category: z.enum(['core', 'extra']).default('core'),
  }).parse(req.body);
  const out = await addMany([...new Set(names)].map((name) => ({ name, faculty, years, category })));
  audit(req, 'subject.bulk', `${out.added} ta fan`, { faculty, skipped: out.skipped.length });
  res.status(201).json(out);
}));

// Hisobotdagi 8 ta namunaviy fan (faqat yo'qlari qo'shiladi)
r.post('/subjects/starter', wrap(async (req, res) => {
  const out = await addMany(STARTER_SUBJECTS());
  audit(req, 'subject.starter', `${out.added} ta namunaviy fan`);
  res.status(201).json(out);
}));

// Fanni arxivlash (talabaga ko'rinmaydi, ma'lumot saqlanadi) yoki qaytarish
r.patch('/subjects/:id/active', wrap(async (req, res) => {
  const { active } = z.object({ active: z.boolean() }).parse(req.body);
  const s = await Subject.findByIdAndUpdate(req.params.id, { active }, { new: true });
  if (!s) throw new HttpError(404, 'Fan topilmadi');
  audit(req, active ? 'subject.show' : 'subject.hide', s.name);
  res.json(s);
}));

r.post('/subjects', wrap(async (req, res) => {
  const body = subjectSchema.parse(req.body);
  if (await Subject.exists({ name: new RegExp(`^${escapeRegex(body.name)}$`, 'i'), faculty: body.faculty })) {
    throw new HttpError(409, 'Bu fakultetda shu nomli fan allaqachon bor');
  }
  const s = await Subject.create(body);
  audit(req, 'subject.create', s.name);
  res.status(201).json(s);
}));
r.put('/subjects/:id', wrap(async (req, res) => {
  const s = await Subject.findByIdAndUpdate(req.params.id, subjectSchema.parse(req.body), { new: true });
  if (!s) throw new HttpError(404, 'Fan topilmadi');
  audit(req, 'subject.update', s.name);
  res.json(s);
}));
r.delete('/subjects/:id', wrap(async (req, res) => {
  const s = await Subject.findByIdAndDelete(req.params.id);
  await Promise.all([Exam.deleteMany({ subject: req.params.id }), Material.deleteMany({ subject: req.params.id })]);
  if (s) audit(req, 'subject.delete', s.name);
  res.json({ ok: true });
}));

/* ---------- Nazorat sanalari (o'tganlari ham) ---------- */
const examSchema = z.object({ subject: z.string(), type: z.enum(EXAM_TYPES), date: z.string().datetime(), note: z.string().max(200).optional() });
r.get('/exams', wrap(async (_req, res) => res.json(await Exam.find().populate('subject', 'name faculty').sort({ date: -1 }).limit(500).lean())));
r.post('/exams', wrap(async (req, res) => {
  const e = await Exam.create(examSchema.parse(req.body));
  audit(req, 'exam.create', e._id);
  res.status(201).json(e);
}));
r.put('/exams/:id', wrap(async (req, res) => {
  const e = await Exam.findByIdAndUpdate(req.params.id, examSchema.parse(req.body), { new: true });
  if (!e) throw new HttpError(404, 'Sana topilmadi');
  audit(req, 'exam.update', e._id);
  res.json(e);
}));
r.delete('/exams/:id', wrap(async (req, res) => {
  await Exam.findByIdAndDelete(req.params.id);
  audit(req, 'exam.delete', req.params.id);
  res.json({ ok: true });
}));

/* ---------- Materiallar ---------- */
r.get('/materials', wrap(async (req, res) => {
  const f = req.query.status ? { status: String(req.query.status) } : {};
  res.json(await Material.find(f).populate('subject', 'name').populate('author', 'name telegram').sort({ createdAt: -1 }).limit(300).lean());
}));
r.patch('/materials/:id', wrap(async (req, res) => {
  const { status } = z.object({ status: z.enum(['approved', 'pending']) }).parse(req.body ?? { status: 'approved' });
  const m = await Material.findByIdAndUpdate(req.params.id, { status }, { new: true });
  if (!m) throw new HttpError(404, 'Material topilmadi');
  audit(req, `material.${status}`, m.title);
  res.json(m);
}));
r.delete('/materials/:id', wrap(async (req, res) => {
  const m = await Material.findByIdAndDelete(req.params.id);
  if (m) audit(req, 'material.delete', m.title);
  res.json({ ok: true });
}));

export default r;
