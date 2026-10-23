import { dict } from './dict.js';

export const LANGS = [['uz', "O'zbekcha"], ['ru', 'Русский'], ['en', 'English']];

const read = () => { try { return localStorage.getItem('lang'); } catch { return null; } };
let lang = LANGS.some(([k]) => k === read()) ? read() : 'uz';
if (typeof document !== 'undefined') document.documentElement.lang = lang;

export const getLang = () => lang;
export function setLang(l) {
  lang = l;
  try { localStorage.setItem('lang', l); } catch { /* private mode */ }
  document.documentElement.lang = l;
}

/** Kalit — o'zbekcha matn. `{n}` kabi o'rinbosarlar vars orqali to'ldiriladi. */
export function t(s, vars) {
  let out = s;
  if (lang !== 'uz') {
    const hit = dict[s];
    if (hit) out = hit[lang === 'ru' ? 0 : 1];
  }
  return vars ? out.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '') : out;
}
