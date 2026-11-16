import { Exam, Quiz, User } from './models/index.js';
import { bot, sendText } from './telegram.js';
import { config } from './config.js';
import { getSettings } from './settings.js';

const origin = () => config.clientOrigin.replace(/\/$/, '');
const EXAM_NAME = { oraliq: 'oraliq nazorat', yakuniy: 'yakuniy nazorat' };
const dayMonth = (d) => {
  const x = new Date(new Date(d).getTime() + 5 * 3600e3);
  return `${String(x.getUTCDate()).padStart(2, '0')}.${String(x.getUTCMonth() + 1).padStart(2, '0')}`;
};
const enabled = () => !!bot.username && getSettings().telegramReminders !== false;

/** Fan kimga tegishli: shu fakultet (yoki hamma) va shu kurs talabalari, Telegram ulangan */
export function audienceFilter(subject) {
  const f = { telegramId: { $exists: true, $ne: null }, blocked: { $ne: true }, role: { $ne: 'admin' } };
  if (subject.faculty && subject.faculty !== 'all') f.faculty = subject.faculty;
  if (subject.years?.length && subject.years.length < 4) f.year = { $in: subject.years };
  return f;
}

/** Orqa fonda, Telegram chegarasidan sekinroq yuboradi */
async function broadcast(filter, text) {
  const users = await User.find(filter).select('telegramId').lean();
  let sent = 0;
  for (const u of users) {
    if (await sendText(u.telegramId, text)) sent++;
    await new Promise((ok) => setTimeout(ok, 60));
  }
  return { total: users.length, sent };
}

/** Test birinchi marta talabalarga ochilganda: shu fan talabalariga xabar (bir marta) */
export async function notifyNewQuiz(quizId) {
  if (!enabled()) return null;
  // notified ni atomar belgilaymiz: ikki marta tasdiqlansa ham xabar bir marta ketadi
  const quiz = await Quiz.findOneAndUpdate({ _id: quizId, status: 'approved', notified: { $ne: true } }, { notified: true }, { new: true }).populate('subject', 'name faculty years').lean();
  if (!quiz?.subject) return null;
  const text = `📝 Yangi mashq testi: ${quiz.subject.name} — «${quiz.title}» (${quiz.questions.length} ta savol).\nYechish: ${origin()}/quizzes/${quiz._id}`;
  return broadcast(audienceFilter(quiz.subject), text);
}

/** Ertangi nazoratlar uchun eslatma (har bir sana uchun bir marta) */
export async function runExamReminders(now = new Date()) {
  if (!enabled()) return [];
  const from = new Date(now.getTime() + 12 * 3600e3);
  const to = new Date(now.getTime() + 36 * 3600e3);
  const exams = await Exam.find({ date: { $gte: from, $lt: to }, reminded: { $ne: true } }).populate('subject', 'name faculty years active').lean();
  const out = [];
  for (const e of exams) {
    const claimed = await Exam.updateOne({ _id: e._id, reminded: { $ne: true } }, { reminded: true });
    if (!claimed.modifiedCount || !e.subject || e.subject.active === false) continue;
    const text = `⏰ Eslatma: ${dayMonth(e.date)} kuni ${e.subject.name} fanidan ${EXAM_NAME[e.type] || 'nazorat'}.${e.note ? `\n${e.note}` : ''}\nTayyorlanish: mashq testlari va repetitorlar — ${origin()}/subjects/${e.subject._id}`;
    out.push(await broadcast(audienceFilter(e.subject), text));
  }
  return out;
}

/** Server ishlayotganda har soatda tekshiradi (Render bepul tarifida server uxlasa, uyg'onganda tekshiradi) */
export function startReminders() {
  const tick = () => runExamReminders().catch((e) => console.error('[reminders]', e.message));
  setTimeout(tick, 60e3).unref?.();
  setInterval(tick, 3600e3).unref?.();
}
