import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { User, Subject, Exam, Tutor, Material, Booking, Review, Survey, Visit } from '../../models/index.js';
import { wrap } from '../../middleware/util.js';
import { config } from '../../config.js';
import { bot } from '../../telegram.js';
import { FACULTIES } from '../../data/meta.js';
import { toCsv, sendCsv } from './helpers.js';

const r = Router();
const TZ = 'Asia/Tashkent';

export async function computeStats() {
  const weekAgo = new Date(Date.now() - 7 * 86400e3);
  const [visitors, visitors7, students, tutorsApproved, tutorsPending, byStatus, perStudent, rating, money] = await Promise.all([
    Visit.distinct('sid').then((a) => a.length),
    Visit.distinct('sid', { createdAt: { $gte: weekAgo } }).then((a) => a.length),
    User.countDocuments({ role: { $ne: 'admin' } }),
    Tutor.countDocuments({ status: 'approved' }),
    Tutor.countDocuments({ status: 'pending' }),
    Booking.aggregate([{ $group: { _id: '$status', n: { $sum: 1 } } }]),
    Booking.aggregate([{ $match: { status: { $in: ['paid', 'completed'] } } }, { $group: { _id: '$student', n: { $sum: 1 } } }]),
    Review.aggregate([{ $match: { hidden: { $ne: true } } }, { $group: { _id: null, avg: { $avg: '$rating' }, n: { $sum: 1 } } }]),
    Booking.aggregate([{ $match: { status: { $in: ['paid', 'completed'] } } }, { $group: { _id: null, gross: { $sum: '$total' }, commission: { $sum: '$commission' } } }]),
  ]);
  const bookings = Object.fromEntries(byStatus.map((s) => [s._id, s.n]));
  const paidStudents = perStudent.length;
  const repeat = perStudent.filter((s) => s.n >= 2).length;
  return {
    visitors, visitors7, students, tutorsApproved, tutorsPending, bookings,
    bookedTotal: Object.values(bookings).reduce((a, b) => a + b, 0),
    paidStudents,
    conversionPct: visitors ? Math.round((paidStudents / visitors) * 1000) / 10 : 0,
    repeatPct: paidStudents ? Math.round((repeat / paidStudents) * 1000) / 10 : 0,
    avgRating: rating[0] ? Math.round(rating[0].avg * 100) / 100 : null,
    reviews: rating[0]?.n || 0,
    gross: money[0]?.gross || 0,
    commission: money[0]?.commission || 0,
  };
}

// Oxirgi N kun bo'yicha kunlik qator (bo'sh kunlar 0 bilan to'ldiriladi)
function fillDays(rows, days) {
  const map = new Map(rows.map((x) => [x._id, x.n]));
  const out = [];
  for (let i = days - 1; i >= 0; i--) {
    const key = new Date(Date.now() + 5 * 3600e3 - i * 86400e3).toISOString().slice(0, 10);
    out.push({ label: key.slice(5), value: map.get(key) || 0 });
  }
  return out;
}
const dayFmt = { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: TZ } };

async function checklist() {
  const [admins, subjectsByFaculty, exams, demoExams, tutorsApproved, materials, noGroup, surveyN] = await Promise.all([
    User.find({ role: 'admin' }).select('+password').lean(),
    Subject.aggregate([{ $group: { _id: '$faculty', n: { $sum: 1 } } }]),
    Exam.countDocuments(),
    Exam.countDocuments({ note: /demo/i }),
    Tutor.countDocuments({ status: 'approved' }),
    Material.countDocuments({ status: 'approved' }),
    Subject.countDocuments({ $or: [{ telegramGroup: '' }, { telegramGroup: { $exists: false } }] }),
    Survey.countDocuments(),
  ]);
  const defaultPw = (await Promise.all(admins.filter((a) => a.password).map((a) => bcrypt.compare(config.adminPassword, a.password)))).some(Boolean);
  const have = new Set(subjectsByFaculty.map((x) => x._id));
  const missingFaculties = FACULTIES.filter((f) => !have.has(f.key)).map((f) => f.name);
  const items = [
    { key: 'password', done: !defaultPw, label: "Admin parolini o'zgartiring", hint: "Standart parol (Admin12345) hamma ochiq hujjatda yozilgan. Sozlamalar bo'limidagi «Parolni almashtirish» orqali o'zgartiring.", tab: 'settings' },
    { key: 'bot', done: !!bot.username, label: 'Telegram bot ulangan', hint: "server/.env ga TELEGRAM_BOT_TOKEN qo'shing va serverni qayta ishga tushiring: shundan keyin kirish, bildirishnomalar va e'lonlar ishlaydi.", tab: 'settings' },
    { key: 'subjects', done: missingFaculties.length === 0, label: 'Barcha fakultetlar uchun fanlar kiritilgan', hint: missingFaculties.length ? `Fani yo'q fakultetlar: ${missingFaculties.join(', ')}.` : 'Hammasi kiritilgan.', tab: 'content' },
    { key: 'exams', done: exams > 0 && demoExams === 0, label: 'Nazorat sanalari rasmiy', hint: exams === 0 ? "Hali sana kiritilmagan." : demoExams ? `${demoExams} ta sana hali «Demo sana» deb belgilangan: rasmiy sanaga almashtiring yoki belgini o'chiring.` : 'Hamma sana rasmiy.', tab: 'content' },
    { key: 'groups', done: noGroup === 0, label: 'Har bir fan uchun Telegram guruh havolasi', hint: noGroup ? `${noGroup} ta fanda guruh havolasi yo'q.` : 'Hammasida bor.', tab: 'content' },
    { key: 'tutors', done: tutorsApproved >= 8, label: 'Kamida 8 ta tasdiqlangan repetitor', hint: `Hozir: ${tutorsApproved}. Hisobotdagi pilot maqsadi — 8–10 ta.`, tab: 'tutors' },
    { key: 'materials', done: materials >= 10, label: 'Kamida 10 ta material', hint: `Hozir: ${materials}.`, tab: 'content' },
    { key: 'survey', done: surveyN >= 30, label: 'Kamida 30 ta so’rovnoma javobi', hint: `Hozir: ${surveyN}. /survey havolasini guruh chatlariga tarqating.`, tab: 'research' },
    { key: 'payment', done: (process.env.PAYMENT_PROVIDER || 'mock') !== 'mock', label: "Haqiqiy to'lov tizimi ulangan", hint: "Hozir mock: pul yechilmaydi. Pilot uchun «Bronlar» bo'limida «Qo'lda to'langan» belgisidan foydalaning.", tab: 'bookings', optional: true },
  ];
  return items;
}

r.get('/stats', wrap(async (_req, res) => res.json(await computeStats())));

r.get(
  '/overview',
  wrap(async (_req, res) => {
    const from = new Date(Date.now() - 30 * 86400e3);
    const [stats, vis, newUsers, newBookings, funnelBooked, topSubjects, noTutorSubjects, topTutors, sources, checks] = await Promise.all([
      computeStats(),
      Visit.aggregate([{ $match: { createdAt: { $gte: from } } }, { $group: { _id: { d: dayFmt, sid: '$sid' } } }, { $group: { _id: '$_id.d', n: { $sum: 1 } } }]),
      User.aggregate([{ $match: { createdAt: { $gte: from }, role: { $ne: 'admin' } } }, { $group: { _id: dayFmt, n: { $sum: 1 } } }]),
      Booking.aggregate([{ $match: { createdAt: { $gte: from } } }, { $group: { _id: dayFmt, n: { $sum: 1 } } }]),
      Booking.distinct('student', { status: { $ne: 'cancelled' } }),
      Booking.aggregate([
        { $match: { status: { $ne: 'cancelled' } } },
        { $group: { _id: '$subject', n: { $sum: 1 } } }, { $sort: { n: -1 } }, { $limit: 5 },
        { $lookup: { from: 'subjects', localField: '_id', foreignField: '_id', as: 's' } }, { $project: { n: 1, name: { $first: '$s.name' } } },
      ]),
      Tutor.aggregate([{ $match: { status: 'approved' } }, { $unwind: '$subjects' }, { $group: { _id: '$subjects' } }]).then(async (cov) => {
        const covered = cov.map((c) => c._id);
        return Subject.find({ _id: { $nin: covered }, active: { $ne: false } }).select('name').limit(10).lean();
      }),
      Booking.aggregate([
        { $match: { status: { $in: ['paid', 'completed'] } } },
        { $group: { _id: '$tutor', revenue: { $sum: '$total' }, n: { $sum: 1 } } }, { $sort: { revenue: -1 } }, { $limit: 5 },
        { $lookup: { from: 'tutors', localField: '_id', foreignField: '_id', as: 't' } },
        { $lookup: { from: 'users', localField: 't.user', foreignField: '_id', as: 'u' } },
        { $project: { revenue: 1, n: 1, name: { $first: '$u.name' } } },
      ]),
      Visit.aggregate([{ $match: { ref: { $exists: true, $ne: '' } } }, { $group: { _id: { r: '$ref', sid: '$sid' } } }, { $group: { _id: '$_id.r', n: { $sum: 1 } } }, { $sort: { n: -1 } }, { $limit: 6 }]),
      checklist(),
    ]);
    res.json({
      stats,
      series: { visits: fillDays(vis, 30), users: fillDays(newUsers, 30), bookings: fillDays(newBookings, 30) },
      funnel: [
        { label: 'Saytga kirganlar', value: stats.visitors },
        { label: "Ro'yxatdan o'tganlar", value: stats.students },
        { label: 'Bron qilganlar', value: funnelBooked.length },
        { label: "To'lagan (yoki dars olgan)", value: stats.paidStudents },
        { label: 'Qayta dars olganlar', value: Math.round((stats.repeatPct / 100) * stats.paidStudents) },
      ],
      topSubjects, noTutorSubjects, topTutors, sources, checklist: checks,
      pending: { materials: await Material.countDocuments({ status: 'pending' }) },
    });
  })
);

/* ---------- Customer Development: so'rovnoma ---------- */
r.get(
  '/survey',
  wrap(async (_req, res) => {
    const all = await Survey.find().lean();
    const students = all.filter((s) => s.role === 'student');
    const tutors = all.filter((s) => s.role === 'tutor');
    const pct = (arr, fn) => (arr.length ? Math.round((arr.filter(fn).length / arr.length) * 100) : null);
    const avg = (arr) => (arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : null);
    const needs = {};
    students.forEach((s) => s.needs?.forEach((n) => (needs[n] = (needs[n] || 0) + 1)));
    const payers = students.filter((s) => s.willingToPay && s.monthlyBudget > 0);
    res.json({
      respondents: all.length, students: students.length, tutors: tutors.length,
      searchHoursAvg: students.length ? Math.round((students.reduce((a, s) => a + (s.searchHoursPerWeek || 0), 0) / students.length) * 10) / 10 : null,
      searchLongPct: pct(students, (s) => s.searchHoursPerWeek >= 2),
      trustReviewsPct: pct(students, (s) => s.trustReviews >= 4),
      willingToPayPct: pct(students, (s) => s.willingToPay),
      avgMonthlyBudget: avg(payers.map((s) => s.monthlyBudget)),
      tutorInterested: tutors.filter((s) => s.tutorInterest).length, tutorTotal: tutors.length,
      topNeeds: Object.entries(needs).sort((a, b) => b[1] - a[1]).slice(0, 6),
      comments: all.filter((s) => s.comment).slice(-20).reverse().map((s) => ({ role: s.role, text: s.comment, at: s.createdAt })),
    });
  })
);

r.get(
  '/export/survey.csv',
  wrap(async (_req, res) => {
    const rows = await Survey.find().sort({ createdAt: -1 }).lean();
    sendCsv(res, 'sorovnoma.csv', toCsv([
      { label: 'Sana', get: (x) => x.createdAt }, { label: 'Rol', get: (x) => x.role }, { label: 'Fakultet', get: (x) => x.faculty }, { label: 'Kurs', get: (x) => x.year },
      { label: 'Qidiruv soati/hafta', get: (x) => x.searchHoursPerWeek }, { label: 'Sharhga ishonch (1-5)', get: (x) => x.trustReviews },
      { label: "To'lashga tayyor", get: (x) => (x.willingToPay == null ? '' : x.willingToPay ? 'ha' : "yo'q") }, { label: "Oylik byudjet", get: (x) => x.monthlyBudget },
      { label: 'Repetitor bo‘lishga qiziqadi', get: (x) => (x.tutorInterest == null ? '' : x.tutorInterest ? 'ha' : "yo'q") },
      { label: 'Ehtiyojlar', get: (x) => (x.needs || []).join('; ') }, { label: 'Izoh', get: (x) => x.comment },
    ], rows));
  })
);

export default r;
