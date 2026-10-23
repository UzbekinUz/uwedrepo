import { Router } from 'express';
import { z } from 'zod';
import { Subject, Exam, Material } from '../../models/index.js';
import { wrap, HttpError } from '../../middleware/util.js';
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
});
r.post('/subjects', wrap(async (req, res) => {
  const s = await Subject.create(subjectSchema.parse(req.body));
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
