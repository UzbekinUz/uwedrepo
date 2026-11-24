import { User } from './models/index.js';
import { getSettings } from './settings.js';

const DAY = 86400e3;

/** Obuna rejalari: narxlar admin panelidagi sozlamalardan. Avtomatik yangilanish yo'q — muddat tugasa obuna to'xtaydi. */
export function plans() {
  const p = getSettings().premium;
  return [
    { key: 'month', title: '1 oy', days: 30, price: p.priceMonth },
    { key: 'semester', title: 'Semestr (4 oy)', days: 120, price: p.priceSemester },
    { key: 'year', title: '1 yil', days: 365, price: p.priceYear },
  ];
}
export const PLAN_KEYS = ['month', 'semester', 'year'];
export const planOf = (key) => plans().find((p) => p.key === key);

export const isPremium = (u) => !!u?.premiumUntil && new Date(u.premiumUntil).getTime() > Date.now();

/** Premium kunlar qo'shish: muddat tugagan bo'lsa bugundan, faol bo'lsa mavjud muddat oxiridan uzaytiriladi (atomik) */
export function addPremiumDays(userId, days) {
  return User.findByIdAndUpdate(
    userId,
    [{ $set: { premiumUntil: { $add: [{ $max: [{ $ifNull: ['$premiumUntil', '$$NOW'] }, '$$NOW'] }, Math.round(days * DAY)] } } }],
    { new: true }
  );
}

/** Qaytarilgan to'lov uchun kunlarni olib tashlash */
export function removePremiumDays(userId, days) {
  return User.updateOne({ _id: userId, premiumUntil: { $type: 'date' } }, [{ $set: { premiumUntil: { $subtract: ['$premiumUntil', Math.round(days * DAY)] } } }]);
}

/** Bugungi AI izohlari limiti: premium uchun alohida */
export function aiLimitFor(user) {
  const s = getSettings();
  return isPremium(user) ? s.premium.aiDailyLimit : s.aiDailyLimit ?? 10;
}

/** Foydalanuvchiga ko'rsatiladigan holat */
export function premiumState(user) {
  const s = getSettings().premium;
  return {
    enabled: s.enabled,
    active: isPremium(user),
    until: isPremium(user) ? user.premiumUntil : null,
    trialAvailable: !!user && !user.premiumTrialUsed && !isPremium(user) && s.trialDays > 0,
    trialDays: s.trialDays,
    rewardDays: s.rewardDays,
    lessonDiscount: s.lessonDiscount,
    aiDailyLimit: s.aiDailyLimit,
    freeAiDailyLimit: getSettings().aiDailyLimit ?? 10,
    plans: plans(),
  };
}
