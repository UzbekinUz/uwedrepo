import { Router } from 'express';
import { z } from 'zod';
import { Survey, Visit, Subject, Tutor, Material, Exam } from '../models/index.js';
import { wrap } from '../middleware/util.js';
import { FACULTY_KEYS } from '../data/meta.js';

const r = Router();

// Bosh sahifadagi haqiqiy raqamlar (to'qilgan emas): faqat ommaviy ko'rinadigan narsalar sanaladi
r.get(
  '/stats',
  wrap(async (_req, res) => {
    const [subjects, tutors, materials, exams] = await Promise.all([
      Subject.countDocuments(),
      Tutor.countDocuments({ status: 'approved' }),
      Material.countDocuments({ status: 'approved' }),
      Exam.countDocuments({ date: { $gte: new Date() } }),
    ]);
    res.json({ subjects, tutors, materials, exams });
  })
);

// Pilot ko'rsatkichi "saytga kirganlar": anonim sessiya identifikatori bo'yicha
r.post(
  '/track',
  wrap(async (req, res) => {
    const { sid, path, ref } = z.object({ sid: z.string().min(8).max(64), path: z.string().max(200), ref: z.string().max(40).regex(/^[\w.-]*$/).optional() }).parse(req.body);
    await Visit.create({ sid, path, ref: ref || undefined });
    res.status(204).end();
  })
);

const NEEDS = ['IELTS', 'Matematika', 'Iqtisodiyot fanlari', 'Rus tili', 'Dasturlash', 'Imtihonga tayyorgarlik', 'Grantlar'];

r.post(
  '/survey',
  wrap(async (req, res) => {
    const d = z
      .object({
        role: z.enum(['student', 'tutor']),
        faculty: z.enum(FACULTY_KEYS).optional(),
        year: z.number().int().min(1).max(4).optional(),
        searchHoursPerWeek: z.number().min(0).max(80).optional(),
        trustReviews: z.number().int().min(1).max(5).optional(),
        willingToPay: z.boolean().optional(),
        monthlyBudget: z.number().min(0).max(10_000_000).optional(),
        tutorInterest: z.boolean().optional(),
        needs: z.array(z.string().max(60)).max(10).optional(),
        comment: z.string().max(800).optional(),
      })
      .parse(req.body);
    await Survey.create(d);
    res.status(201).json({ ok: true });
  })
);

r.get('/survey/options', (_req, res) => res.json({ needs: NEEDS }));

export default r;
