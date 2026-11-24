import { Router } from 'express';
import { z } from 'zod';
import { Quiz, QuizAttempt, Subject, Tutor, Exam, AiExplain, AiUsage } from '../models/index.js';
import { optionalAuth, requireAuth } from '../middleware/auth.js';
import { wrap, HttpError } from '../middleware/util.js';
import { getSettings } from '../settings.js';
import { aiAvailable, explainMistake } from '../ai.js';
import { notifyAdmins } from '../notify.js';
import { config } from '../config.js';
import { quizStats } from '../quizStats.js';
import { notifyNewQuiz } from '../reminders.js';
import { aiLimitFor, isPremium } from '../premium.js';

const r = Router();

const TZ_MS = 5 * 3600e3; // Toshkent UTC+5
const tashkentDay = (d = new Date()) => new Date(d.getTime() + TZ_MS).toISOString().slice(0, 10);

/** Talabaga ko'rsatiladigan shakl: to'g'ri javob va izohlarsiz */
const publicQuiz = (q) => ({
  _id: q._id,
  title: q.title,
  description: q.description,
  subject: q.subject,
  byTutor: q.byTutor,
  attempts: q.attempts,
  questions: q.questions.map((x) => ({ _id: x._id, text: x.text, options: x.options })),
});

const questionInput = z
  .object({
    text: z.string().trim().min(2).max(2000),
    options: z.array(z.string().trim().min(1).max(500)).min(2).max(6),
    correct: z.number().int().min(0).max(5),
    explanation: z.string().trim().max(2000).optional().default(''),
  })
  .refine((q) => q.correct < q.options.length, { message: "To'g'ri javob variantlar orasidan tanlansin", path: ['correct'] });

const quizInput = z.object({
  subject: z.string(),
  title: z.string().trim().min(3).max(140),
  description: z.string().trim().max(500).optional().default(''),
  questions: z.array(questionInput).min(1).max(60),
});

/** Test tuza oladiganlar: admin yoki tasdiqlangan repetitor (faqat o'z fanlari bo'yicha) */
async function authorRole(user, subjectId) {
  if (user.role === 'admin') return 'admin';
  const tutor = await Tutor.findOne({ user: user._id, status: 'approved' }).select('subjects').lean();
  if (!tutor) throw new HttpError(403, 'Test tuzish uchun tasdiqlangan repetitor bo\'lishingiz kerak');
  if (subjectId && !tutor.subjects.some((s) => String(s) === String(subjectId))) {
    throw new HttpError(403, 'Faqat anketangizdagi fanlar bo\'yicha test tuza olasiz');
  }
  return 'tutor';
}

async function ownQuiz(req) {
  const q = await Quiz.findById(req.params.id);
  if (!q) throw new HttpError(404, 'Test topilmadi');
  if (req.user.role !== 'admin' && String(q.author) !== String(req.user._id)) throw new HttpError(403, "Ruxsat yo'q");
  return q;
}

/* ---------- Talaba uchun ---------- */

// Fan bo'yicha (yoki hamma) tasdiqlangan testlar ro'yxati
r.get(
  '/',
  wrap(async (req, res) => {
    const f = { status: 'approved' };
    if (req.query.subject) f.subject = String(req.query.subject);
    const list = await Quiz.find(f).populate('subject', 'name').sort({ createdAt: -1 }).limit(200).lean();
    res.json(list.map((q) => ({ _id: q._id, title: q.title, description: q.description, subject: q.subject, byTutor: q.byTutor, attempts: q.attempts, count: q.questions.length })));
  })
);

// Muallifning o'z testlari (repetitor paneli uchun; tasdiqlanmaganlari ham)
r.get(
  '/mine',
  requireAuth,
  wrap(async (req, res) => {
    const list = await Quiz.find({ author: req.user._id }).populate('subject', 'name').sort({ updatedAt: -1 }).lean();
    res.json(list);
  })
);

// Talabaning o'z natijalari (eng yangisi birinchi)
r.get(
  '/attempts/mine',
  requireAuth,
  wrap(async (req, res) => {
    const list = await QuizAttempt.find({ student: req.user._id })
      .populate({ path: 'quiz', select: 'title subject', populate: { path: 'subject', select: 'name' } })
      .sort({ createdAt: -1 }).limit(200).lean();
    res.json(list.filter((a) => a.quiz).map((a) => ({ _id: a._id, quiz: a.quiz, score: a.score, total: a.total, createdAt: a.createdAt })));
  })
);

// «Mening xatolarim» (Premium): har bir testning oxirgi urinishidagi xato javoblar — to'g'ri javob va izoh bilan
r.get(
  '/mistakes',
  requireAuth,
  wrap(async (req, res) => {
    const attempts = await QuizAttempt.find({ student: req.user._id }).sort({ createdAt: -1 }).limit(100).lean();
    const latest = new Map();
    for (const a of attempts) if (!latest.has(String(a.quiz))) latest.set(String(a.quiz), a);
    const quizzes = await Quiz.find({ _id: { $in: [...latest.keys()] }, status: 'approved' }).populate('subject', 'name').lean();
    const items = [];
    for (const q of quizzes) {
      const a = latest.get(String(q._id));
      q.questions.forEach((x, i) => {
        const chosen = a.answers?.[i] ?? -1;
        if (chosen !== x.correct) items.push({ quiz: { _id: q._id, title: q.title }, subject: q.subject?.name, attemptAt: a.createdAt, question: x._id, text: x.text, options: x.options, chosen, correct: x.correct, explanation: x.explanation });
      });
    }
    items.sort((x, y) => new Date(y.attemptAt) - new Date(x.attemptAt));
    if (!isPremium(req.user)) return res.json({ locked: true, count: items.length, items: [] });
    res.json({ locked: false, count: items.length, items: items.slice(0, 300) });
  })
);

r.get(
  '/:id',
  optionalAuth,
  wrap(async (req, res) => {
    const q = await Quiz.findById(req.params.id).populate('subject', 'name').lean();
    const own = req.user && (req.user.role === 'admin' || String(q?.author) === String(req.user._id));
    if (!q || (q.status !== 'approved' && !own)) throw new HttpError(404, 'Test topilmadi');
    res.json({ ...publicQuiz(q), status: q.status, ai: aiAvailable() });
  })
);

// Muallif yoki admin tahrirlash uchun to'liq test (javoblari bilan)
r.get(
  '/:id/full',
  requireAuth,
  wrap(async (req, res) => res.json(await ownQuiz(req)))
);

// Muallif (repetitor) o'z testi statistikasini ko'radi: ismsiz, faqat umumiy raqamlar
r.get(
  '/:id/stats',
  requireAuth,
  wrap(async (req, res) => {
    const q = await ownQuiz(req);
    const attempts = (await QuizAttempt.find({ quiz: q._id }).populate('student', 'role').lean())
      .filter((a) => a.student && a.student.role !== 'admin' && String(a.student._id) !== String(q.author));
    res.json({ attempts: q.attempts, ...quizStats(q, attempts) });
  })
);

// Javoblarni tekshirish. Kirmagan talaba ham yecha oladi; kirganining natijasi saqlanadi.
r.post(
  '/:id/attempt',
  optionalAuth,
  wrap(async (req, res) => {
    const q = await Quiz.findOne({ _id: req.params.id, status: 'approved' }).lean();
    if (!q) throw new HttpError(404, 'Test topilmadi');
    const { answers } = z.object({ answers: z.array(z.number().int().min(-1).max(5).nullable()).max(60) }).parse(req.body);
    const results = q.questions.map((x, i) => {
      const chosen = answers[i] ?? -1;
      return { _id: x._id, chosen, correct: x.correct, ok: chosen === x.correct, explanation: x.explanation };
    });
    const score = results.filter((x) => x.ok).length;
    if (req.user) {
      await QuizAttempt.create({ quiz: q._id, student: req.user._id, answers: results.map((x) => x.chosen), score, total: results.length });
    }
    await Quiz.updateOne({ _id: q._id }, { $inc: { attempts: 1 } });
    res.json({ score, total: results.length, results });
  })
);

// "Nega noto'g'ri?" — AI izohi
r.post(
  '/:id/explain',
  requireAuth,
  wrap(async (req, res) => {
    if (!aiAvailable()) throw new HttpError(503, "AI izohlari hozircha o'chirilgan");
    const { questionId, chosen, lang } = z
      .object({ questionId: z.string(), chosen: z.number().int().min(0).max(5), lang: z.enum(['uz', 'ru', 'en']).default('uz') })
      .parse(req.body);
    const q = await Quiz.findOne({ _id: req.params.id, status: 'approved' }).populate('subject', 'name').lean();
    if (!q) throw new HttpError(404, 'Test topilmadi');
    const question = q.questions.find((x) => String(x._id) === questionId);
    if (!question) throw new HttpError(404, 'Savol topilmadi');
    if (chosen >= question.options.length) throw new HttpError(400, "Noto'g'ri variant");
    if (chosen === question.correct) throw new HttpError(400, "Bu javob to'g'ri — izoh kerak emas");

    // Nazorat kuni shu fan bo'yicha AI o'chadi (imtihonda ko'chirishga ishlatilmasin)
    const today = tashkentDay();
    const start = new Date(`${today}T00:00:00+05:00`);
    const end = new Date(start.getTime() + 86400e3);
    if (await Exam.exists({ subject: q.subject._id, date: { $gte: start, $lt: end } })) {
      throw new HttpError(403, "Bugun shu fandan nazorat bor: AI izohlari ertaga qayta yoqiladi");
    }

    const limit = aiLimitFor(req.user);
    const usage = await AiUsage.findOne({ user: req.user._id, day: today }).lean();
    const used = usage?.count || 0;

    // Keshdan: shu savol va shu xato javob uchun avval yozilgan izoh (limitni kamaytirmaydi)
    const cached = await AiExplain.findOne({ question: question._id, chosen, lang }).lean();
    if (cached) return res.json({ text: cached.text, cached: true, left: Math.max(0, limit - used) });

    if (used >= limit) throw new HttpError(429, `Bugungi AI izohlari limiti tugadi (${limit} ta). Ertaga yana urinib ko'ring${isPremium(req.user) ? '' : ' yoki Premium bilan limitni oshiring'}.`);
    let text;
    try {
      text = await explainMistake({ subject: q.subject.name, question, chosen, lang });
    } catch (e) {
      throw new HttpError(502, "AI hozir javob bera olmadi, birozdan keyin urinib ko'ring");
    }
    await AiUsage.updateOne({ user: req.user._id, day: today }, { $inc: { count: 1 } }, { upsert: true });
    await AiExplain.updateOne({ question: question._id, chosen, lang }, { $setOnInsert: { quiz: q._id, text } }, { upsert: true }).catch(() => {});
    res.json({ text, cached: false, left: Math.max(0, limit - used - 1) });
  })
);

/* ---------- Muallif (repetitor yoki admin) uchun ---------- */

r.post(
  '/',
  requireAuth,
  wrap(async (req, res) => {
    const data = quizInput.parse(req.body);
    if (!(await Subject.exists({ _id: data.subject }))) throw new HttpError(400, 'Fan topilmadi');
    const role = await authorRole(req.user, data.subject);
    const q = await Quiz.create({ ...data, author: req.user._id, byTutor: role === 'tutor', status: role === 'admin' ? 'approved' : 'pending' });
    if (role === 'admin') notifyNewQuiz(q._id).catch((e) => console.error('[notify quiz]', e.message));
    if (role === 'tutor') notifyAdmins(`Yangi test tekshiruvga keldi: «${q.title}» (${req.user.name}). Ko'rib chiqish: ${config.clientOrigin}/admin?tab=quizzes`);
    res.status(201).json(q);
  })
);

r.put(
  '/:id',
  requireAuth,
  wrap(async (req, res) => {
    const q = await ownQuiz(req);
    const data = quizInput.parse(req.body);
    const role = await authorRole(req.user, data.subject);
    Object.assign(q, data);
    // Repetitor tahrirlasa, test qayta tekshiruvga tushadi (talabalarga tekshirilmagan javob chiqmasin)
    if (role === 'tutor') q.status = 'pending';
    await q.save();
    await AiExplain.deleteMany({ quiz: q._id }); // savollar o'zgargan bo'lishi mumkin: eski AI izohlari endi mos emas
    res.json(q);
  })
);

r.delete(
  '/:id',
  requireAuth,
  wrap(async (req, res) => {
    const q = await ownQuiz(req);
    await Promise.all([q.deleteOne(), QuizAttempt.deleteMany({ quiz: q._id }), AiExplain.deleteMany({ quiz: q._id })]);
    res.json({ ok: true });
  })
);

export default r;
