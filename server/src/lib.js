import { Booking, Tutor } from './models/index.js';
import { getSettings } from './settings.js';

const TZ_OFFSET_H = 5; // Toshkent UTC+5, yozgi vaqt yo'q
const ymd = (d) => d.toISOString().slice(0, 10);

/** Repetitorning keyingi 14 kundagi bo'sh soatlik slotlari (ISO satrlar) */
export async function freeSlots(tutor, days = 14) {
  const now = Date.now();
  const earliest = now + 2 * 3600e3;
  const local = new Date(now + TZ_OFFSET_H * 3600e3);
  const booked = await Booking.find({
    tutor: tutor._id,
    status: { $ne: 'cancelled' },
    startsAt: { $gte: new Date(now) },
  }).select('startsAt');
  const taken = new Set(booked.map((b) => b.startsAt.getTime()));
  const out = [];
  for (let i = 0; i < days; i++) {
    const day = new Date(local.getTime() + i * 86400e3);
    const dow = day.getUTCDay();
    for (const a of tutor.availability.filter((x) => x.day === dow)) {
      const from = parseInt(a.from, 10);
      const to = parseInt(a.to, 10);
      for (let h = from; h < to; h++) {
        const t = new Date(`${ymd(day)}T${String(h).padStart(2, '0')}:00:00+05:00`).getTime();
        if (t >= earliest && !taken.has(t)) out.push(new Date(t).toISOString());
      }
    }
  }
  return out.sort();
}

/**
 * Narx hisobi. Birinchi dars chegirmasi narxdan (repetitor va platforma birga beradi);
 * premium chegirmasi esa faqat platforma komissiyasidan beriladi — repetitor ulushi o'zgarmaydi.
 * Ikki chegirma qo'shilmaydi: birinchi darsda faqat birinchi dars chegirmasi.
 */
export function priceBreakdown(price, firstLesson, premium = false) {
  const s = getSettings();
  const first = firstLesson ? Math.round((price * s.firstLessonDiscount) / 100) : 0;
  const base = price - first;
  const fullCommission = Math.round((base * s.commission) / 100);
  const premiumDiscount = premium && !firstLesson ? Math.min(Math.round((price * (s.premium?.lessonDiscount || 0)) / 100), fullCommission) : 0;
  const total = base - premiumDiscount;
  return { price, discount: first + premiumDiscount, premiumDiscount, total, commission: fullCommission - premiumDiscount, payout: base - fullCommission };
}

export async function refreshTutorRating(tutorId, Review) {
  const [agg] = await Review.aggregate([
    { $match: { tutor: tutorId, hidden: { $ne: true } } },
    { $group: { _id: null, avg: { $avg: '$rating' }, n: { $sum: 1 } } },
  ]);
  await Tutor.findByIdAndUpdate(tutorId, {
    ratingAvg: agg ? Math.round(agg.avg * 10) / 10 : 0,
    ratingCount: agg ? agg.n : 0,
  });
}
