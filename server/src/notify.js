import { Booking, User } from './models/index.js';
import { config } from './config.js';
import { notifyUser, fmtDt } from './telegram.js';

/** Telegram ulangan barcha adminlarga xabar */
export async function notifyAdmins(text) {
  try {
    const admins = await User.find({ role: 'admin', blocked: { $ne: true }, telegramId: { $exists: true } }).select('telegramId');
    await Promise.all(admins.map((a) => notifyUser(a, text)));
  } catch (e) {
    console.error('[notify] admins:', e.message);
  }
}

const origin = () => config.clientOrigin.replace(/\/$/, '');

/** Bron holati o'zgarganda tegishli odamga Telegram xabari (bot sozlangan bo'lsa). Xato bo'lsa jim o'tadi. */
export async function notifyBooking(bookingId, kind) {
  try {
    const b = await Booking.findById(bookingId)
      .populate('student', 'name telegramId blocked')
      .populate({ path: 'tutor', populate: { path: 'user', select: 'name telegramId blocked' } })
      .populate('subject', 'name');
    if (!b) return;
    const what = `${b.subject?.name || ''}, ${fmtDt(b.startsAt)}`;
    const o = origin();
    const tutorName = b.tutor?.user?.name || 'Repetitor';
    const studentName = b.student?.name || 'Talaba';
    const msg = {
      new: [b.tutor?.user, `Yangi bron: ${studentName} — ${what}.\nTasdiqlash yoki rad etish: ${o}/tutor`],
      confirmed: [b.student, `${tutorName} bronni tasdiqladi: ${what}.\nTo'lash uchun: ${o}/my`],
      rejected: [b.student, `${tutorName} bronni rad etdi (${what}).${b.refunded ? " To'lov qaytariladi." : ''}\nBoshqa repetitor tanlang: ${o}/tutors`],
      cancelled: [b.tutor?.user, `${studentName} bronni bekor qildi: ${what}.`],
      paid: [b.tutor?.user, `To'lov qabul qilindi: ${studentName} — ${what}.\nDars vaqtida talaba bilan bog'laning: ${o}/tutor`],
      completed: [b.student, `Dars o'tdi (${what}). Repetitorni baholang: ${o}/my`],
      'admin-cancelled': [b.student, `Administrator bronni bekor qildi (${what}).${b.refunded ? " To'lov qaytariladi." : ''}`],
    }[kind];
    if (msg) await notifyUser(msg[0], msg[1]);
  } catch (e) {
    console.error('[notify] booking:', e.message);
  }
}
