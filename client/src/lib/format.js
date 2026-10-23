import { t, getLang } from './i18n.js';

export const money = (n) => `${Math.round(n || 0).toLocaleString('ru-RU')} ${t("so'm")}`;

// Qiymatlar o'zbekcha saqlanadi, o'qilganda tarjima qilinadi (til almashganda ilova qayta chiziladi)
const tr = (o) => new Proxy(o, { get: (a, k) => (typeof a[k] === 'string' ? t(a[k]) : a[k]) });

export const FORMAT_LABEL = tr({ online: 'Onlayn', offline: 'Offlayn' });
export const LANG_LABEL = tr({ uz: "O'zbek", ru: 'Rus', en: 'Ingliz' });
export const MATERIAL_LABEL = tr({ konspekt: 'Konspekt', test: 'Test', video: 'Video', savollar: 'Imtihon savollari' });
export const EXAM_LABEL = tr({ oraliq: 'Oraliq nazorat', yakuniy: 'Yakuniy nazorat' });
export const DAYS = tr(['Yakshanba', 'Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba']);
export const DAYS_SHORT = tr(['Yak', 'Dush', 'Sesh', 'Chor', 'Pay', 'Juma', 'Shan']);
export const MONTHS = tr(['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avgust', 'sentyabr', 'oktyabr', 'noyabr', 'dekabr']);

const STATUS_RAW = {
  pending: { label: 'Kutilmoqda', cls: 'bg-amber-100 text-amber-800' },
  confirmed: { label: "To'lov kutilmoqda", cls: 'bg-sky-100 text-sky-800' },
  paid: { label: "To'langan", cls: 'bg-emerald-100 text-emerald-800' },
  completed: { label: "O'tgan", cls: 'bg-slate-200 text-slate-700' },
  cancelled: { label: 'Bekor qilingan', cls: 'bg-red-100 text-red-700' },
};
export const STATUS = new Proxy(STATUS_RAW, { get: (a, k) => (a[k] ? { ...a[k], label: t(a[k].label) } : a[k]) });

// Toshkent vaqti (UTC+5) bo'yicha qismlarga ajratish
export function tz(iso) {
  const d = new Date(new Date(iso).getTime() + 5 * 3600e3);
  return { y: d.getUTCFullYear(), m: d.getUTCMonth(), d: d.getUTCDate(), h: d.getUTCHours(), dow: d.getUTCDay() };
}
const dm = (t_) => (getLang() === 'uz' ? `${t_.d}-${MONTHS[t_.m]}` : `${t_.d} ${MONTHS[t_.m]}`);
export const hhmm = (iso) => `${String(tz(iso).h).padStart(2, '0')}:00`;
export const dayKey = (iso) => { const x = tz(iso); return `${x.y}-${x.m}-${x.d}`; };
export const dayLabel = (iso) => { const x = tz(iso); return `${DAYS_SHORT[x.dow]}, ${dm(x)}`; };
export const dateTime = (iso) => `${dm(tz(iso))}, ${hhmm(iso)}`;
export const dateLong = (iso) => {
  const x = tz(iso);
  const wd = getLang() === 'en' ? DAYS[x.dow] : DAYS[x.dow].toLowerCase();
  return `${dm(x)} ${x.y}, ${wd}`;
};

export function daysLeft(iso) {
  const a = tz(Date.now()); const b = tz(iso);
  return Math.round((Date.UTC(b.y, b.m, b.d) - Date.UTC(a.y, a.m, a.d)) / 86400e3);
}

export const tgLink = (handle, text) => {
  const h = (handle || '').trim().replace(/^@/, '').replace(/^https?:\/\/t\.me\//, '');
  if (!/^[A-Za-z0-9_]{3,64}$/.test(h)) return null; // faqat to'g'ri username
  return `https://t.me/${h}${text ? `?text=${encodeURIComponent(text)}` : ''}`;
};
