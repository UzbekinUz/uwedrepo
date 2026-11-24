import { Settings } from './models/index.js';
import { config } from './config.js';

// Admin paneldan o'zgartiriladigan sozlamalar; .env qiymatlari faqat boshlang'ich
const defaults = () => ({
  commission: config.commission,
  firstLessonDiscount: config.firstLessonDiscount,
  cancelHours: 24,
  registrationOpen: true,
  banner: { text: '', kind: 'info', active: false },
  aiEnabled: true,
  aiDailyLimit: 10,
  telegramReminders: true,
  premium: { enabled: true, priceMonth: 19000, priceSemester: 59000, priceYear: 149000, lessonDiscount: 5, aiDailyLimit: 100, trialDays: 7, rewardDays: 7 },
});

let cache = null;
const merge = (doc) => {
  const d = defaults();
  const out = { ...d };
  for (const k of Object.keys(d)) if (doc && doc[k] !== undefined && doc[k] !== null) out[k] = doc[k];
  out.banner = { ...d.banner, ...(doc?.banner || {}) };
  out.premium = { ...d.premium };
  for (const [k, v] of Object.entries(doc?.premium || {})) if (v !== undefined && v !== null) out.premium[k] = v;
  return out;
};

export async function loadSettings() {
  cache = merge(await Settings.findOne({ key: 'main' }).lean());
  return cache;
}
export const getSettings = () => cache || defaults();

export async function saveSettings(patch) {
  const doc = await Settings.findOneAndUpdate({ key: 'main' }, { $set: patch }, { upsert: true, new: true, setDefaultsOnInsert: true }).lean();
  cache = merge(doc);
  return cache;
}
