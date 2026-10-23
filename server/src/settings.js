import { Settings } from './models/index.js';
import { config } from './config.js';

// Admin paneldan o'zgartiriladigan sozlamalar; .env qiymatlari faqat boshlang'ich
const defaults = () => ({
  commission: config.commission,
  firstLessonDiscount: config.firstLessonDiscount,
  cancelHours: 24,
  registrationOpen: true,
  banner: { text: '', kind: 'info', active: false },
});

let cache = null;
const merge = (doc) => {
  const d = defaults();
  const out = { ...d };
  for (const k of Object.keys(d)) if (doc && doc[k] !== undefined && doc[k] !== null) out[k] = doc[k];
  out.banner = { ...d.banner, ...(doc?.banner || {}) };
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
