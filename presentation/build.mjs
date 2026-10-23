// UWEDRepo taqdimoti: node build.mjs  →  UWEDRepo-taqdimot.pptx
import pptxgen from 'pptxgenjs';
import sharp from 'sharp';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import * as Fi from 'react-icons/fi';
import { createRequire } from 'node:module';
import path from 'node:path';
import fs from 'node:fs';

const require = createRequire(import.meta.url);
const { applyTheme } = require('C:/Users/HP/AppData/Local/Claude-Data/claude_pzs8sxrjxfjjc/local-agent-mode-sessions/skills-plugin/94fea074-8f92-4461-a8b8-dd9022cd0cb8/294912bf-9ab4-4e13-92ae-9ddb52253bd3/skills/pptx/scripts/apply_theme.js');

const OUT = 'UWEDRepo-taqdimot.pptx';
const SH = path.resolve('shots');

const THEME = {
  name: 'UWEDRepo',
  headFontFace: 'Arial',
  bodyFontFace: 'Calibri',
  colors: {
    dk1: '0F1B1A', lt1: 'FFFFFF', dk2: '0E2627', lt2: 'F3F5F2',
    accent1: '0A7E7A', accent2: '5EE0D2', accent3: 'D97706', accent4: 'B91C1C', accent5: '556560', accent6: 'D6DED9',
    hlink: '0A7E7A', folHlink: '556560',
  },
};
const HEX = { dk: '0E2627', teal: '0A7E7A', mint: '5EE0D2', amber: 'D97706', ink: '0F1B1A', muted: '556560', bg: 'F3F5F2', line: 'D6DED9' };

const pres = new pptxgen();
pres.layout = 'LAYOUT_16x9'; // 10 x 5.625 dyuym
pres.theme = { headFontFace: THEME.headFontFace, bodyFontFace: THEME.bodyFontFace };
pres.title = 'UWEDRepo — loyiha taqdimoti';
pres.author = 'UWEDRepo';
const C = pres.SchemeColor;
const W = 10;

/* ---------- Ikonkalar va naqsh (PNG sifatida) ---------- */
const iconCache = new Map();
async function icon(name, color = 'FFFFFF') {
  const key = name + color;
  if (iconCache.has(key)) return iconCache.get(key);
  const Cmp = Fi[name];
  if (!Cmp) throw new Error(`Ikonka yo'q: ${name}`);
  const svg = renderToStaticMarkup(React.createElement(Cmp, { size: 256 })).replace(/currentColor/g, `#${color}`);
  const png = await sharp(Buffer.from(svg)).resize(256, 256).png().toBuffer();
  const data = `image/png;base64,${png.toString('base64')}`;
  iconCache.set(key, data);
  return data;
}
// Saytdagi sakkiz qirrali yulduz naqshi
async function starPng(color, opacity) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-50 -50 100 100" width="600" height="600"><g fill="none" stroke="#${color}" stroke-opacity="${opacity}" stroke-width="1.4"><rect x="-30" y="-30" width="60" height="60"/><rect x="-30" y="-30" width="60" height="60" transform="rotate(45)"/><circle r="14"/></g></svg>`;
  return `image/png;base64,${(await sharp(Buffer.from(svg)).png().toBuffer()).toString('base64')}`;
}
const STAR_DARK = await starPng('FFFFFF', 0.13);

/* ---------- Skrinshotni kerakli nisbatga qirqish ---------- */
const NO_ZOOM = new Set(['home-hero', 'mobile-home', 'mobile-tutor']);
async function shot(name, o = {}) {
  const z = NO_ZOOM.has(name) ? {} : { left: 0.1, width: 0.8 };
  const { top = 0, left = z.left ?? 0, width = z.width ?? 1, aspect = 1.6 } = o;
  const src = path.join(SH, `${name}.jpg`);
  const m = await sharp(src).metadata();
  const cw = Math.round(m.width * width);
  const ch = Math.min(Math.round(cw / aspect), m.height - Math.round(m.height * top));
  const out = path.join(SH, `c-${name}-${Math.round(aspect * 100)}-${Math.round(top * 100)}.jpg`);
  await sharp(src).extract({ left: Math.round(m.width * left), top: Math.round(m.height * top), width: cw, height: ch }).jpeg({ quality: 90 }).toFile(out);
  return { path: out, ratio: cw / ch };
}

/* ---------- Maketlar (layout) ---------- */
pres.defineSlideMaster({
  title: 'LIGHT',
  background: { color: C.background1 },
  slideNumber: { x: 9.0, y: 5.2, w: 0.5, h: 0.3, fontSize: 10, color: C.accent5, align: 'right' },
  objects: [
    { text: { text: 'UWEDRepo', options: { x: 0.5, y: 5.22, w: 3, h: 0.28, fontSize: 10, color: C.accent5, margin: 0 } } },
    { placeholder: { options: { name: 'title', type: 'title', x: 0.5, y: 0.3, w: 9, h: 0.7, fontSize: 30, bold: true, color: C.text2, align: 'left', valign: 'middle', margin: 0 }, text: '' } },
  ],
});
pres.defineSlideMaster({
  title: 'DARK',
  background: { color: C.text2 },
  objects: [
    { placeholder: { options: { name: 'title', type: 'title', x: 0.5, y: 0.3, w: 9, h: 0.7, fontSize: 30, bold: true, color: C.background1, align: 'left', valign: 'middle', margin: 0 }, text: '' } },
  ],
});

pres.defineSlideMaster({
  title: 'TITLE',
  background: { color: C.text2 },
  objects: [{ placeholder: { options: { name: 'title', type: 'title', x: 0.5, y: 1.35, w: 4.6, h: 1.0, fontSize: 52, bold: true, color: C.background1, align: 'left', valign: 'middle', margin: 0 }, text: '' } }],
});

let n = 0;
const sections = new Set();
function slide(master, section, notes) {
  if (!sections.has(section)) { pres.addSection({ title: section }); sections.add(section); }
  const s = pres.addSlide({ masterName: master, sectionTitle: section });
  n += 1;
  if (notes) s.addNotes(notes);
  return s;
}

/* ---------- Yordamchi chizuvchilar ---------- */
const txt = (s, text, o = {}) => s.addText(text, { isTextBox: true, margin: 0, color: C.text1, fontSize: 14, valign: 'top', ...o });
const bullets = (s, items, o = {}) =>
  txt(s, items.map((t, i) => ({ text: t, options: { bullet: { indent: 14 }, breakLine: i < items.length - 1, paraSpaceAfter: o.gap ?? 6 } })), { fontSize: 14, ...o });
const card = (s, x, y, w, h, fill = C.background2, name = 'karta') =>
  s.addShape(pres.ShapeType.roundRect, { x, y, w, h, rectRadius: 0.08, fill: { color: fill }, line: { color: fill, width: 0 }, objectName: name });
async function badge(s, name, x, y, d = 0.5, bg = C.accent1, fg = 'FFFFFF') {
  s.addShape(pres.ShapeType.ellipse, { x, y, w: d, h: d, fill: { color: bg }, line: { color: bg, width: 0 }, objectName: `ikonka-${name}` });
  const p = d * 0.26;
  s.addImage({ data: await icon(name, fg), x: x + p, y: y + p, w: d - 2 * p, h: d - 2 * p, altText: name });
}
function frame(s, img, x, y, w, name = 'skrinshot', alt = '') {
  const h = w / img.ratio;
  s.addShape(pres.ShapeType.roundRect, { x: x - 0.05, y: y - 0.05, w: w + 0.1, h: h + 0.1, rectRadius: 0.06, fill: { color: C.background1 }, line: { color: C.accent6, width: 0.75 }, shadow: { type: 'outer', color: '0E2627', opacity: 0.18, blur: 8, offset: 2, angle: 90 }, objectName: `${name}-ramka` });
  s.addImage({ path: img.path, x, y, w, h, altText: alt || name, objectName: name });
  return h;
}
const label = (s, text, x, y, w, color = C.accent1) => txt(s, text, { x, y, w, h: 0.25, fontSize: 12, bold: true, color });
function dark(s, { stars = true } = {}) {
  if (!stars) return;
  s.addImage({ data: STAR_DARK, x: 7.6, y: -0.9, w: 3.4, h: 3.4, altText: '', objectName: 'naqsh-1' });
  s.addImage({ data: STAR_DARK, x: -0.8, y: 3.6, w: 2.8, h: 2.8, altText: '', objectName: 'naqsh-2' });
}

/** Skrinshot + o'ng tomonda «vazifasi» va imkoniyatlar */
async function shotSlide({ title, section, img, purpose, items, notes, left = true, imgW = 5.1, gap = 6 }) {
  const s = slide('LIGHT', section, notes);
  s.addText(title, { placeholder: 'title' });
  const ix = left ? 0.55 : W - 0.55 - imgW;
  const tx = left ? 0.55 + imgW + 0.45 : 0.5;
  const tw = left ? W - tx - 0.5 : W - 0.55 - imgW - 0.45 - 0.5;
  frame(s, img, ix, 1.25, imgW, 'ekran', title);
  label(s, 'VAZIFASI', tx, 1.2, tw);
  txt(s, purpose, { x: tx, y: 1.47, w: tw, h: 1.0, fontSize: 14, bold: true, color: C.text2 });
  label(s, 'NIMALAR QILA OLADI', tx, 2.55, tw);
  bullets(s, items, { x: tx, y: 2.82, w: tw, h: 2.3, gap });
  return s;
}

/** Ikki skrinshot yonma-yon + har birining tagida izoh */
async function twoShots({ title, section, a, b, notes }) {
  const s = slide('LIGHT', section, notes);
  s.addText(title, { placeholder: 'title' });
  for (const [i, o] of [a, b].entries()) {
    const x = 0.5 + i * 4.7;
    const h = frame(s, o.img, x, 1.15, 4.3, o.name, o.head);
    txt(s, o.head, { x, y: 1.15 + h + 0.15, w: 4.3, h: 0.28, fontSize: 14, bold: true, color: C.text2 });
    txt(s, o.text, { x, y: 1.15 + h + 0.45, w: 4.3, h: 0.7, fontSize: 12, color: C.accent5 });
  }
  return s;
}

/* =====================================================================
   SLAYDLAR
   ===================================================================== */
const A = 'Muammo va yechim';
const B = 'Foydalanuvchi sayti';
const Cc = "Pul va ishonch";
const D = 'Admin panel';
const E = 'Texnologiya va sifat';
const F = 'Biznes va reja';

/* 1. Titul */
{
  const s = slide('TITLE', A, "Salom. Bugun UWEDRepo loyihasini ko'rsataman: UWED talabalari uchun repetitorlar, o'quv materiallari va nazorat sanalarini bir joyga yig'adigan ta'lim platformasi. Avval muammoni, so'ng yechimni, saytning har bir sahifasini, admin panelni va pilot rejasini ko'rib chiqamiz.");
  dark(s);
  const hero = await shot('home-hero', { aspect: 1.6 });
  frame(s, hero, 5.35, 1.55, 4.1, 'bosh-sahifa', 'Bosh sahifa');
  s.addText('UWEDRepo', { placeholder: 'title' });
  txt(s, "UWED talabalari uchun repetitorlar, o'quv materiallari va nazorat sanalari — bir joyda", { x: 0.5, y: 2.45, w: 4.5, h: 1.2, fontSize: 20, color: C.accent2 });
  txt(s, 'Startap loyiha taqdimoti · 2026', { x: 0.5, y: 3.9, w: 4.5, h: 0.3, fontSize: 14, color: C.background2 });
  txt(s, "Muallif: Sherzod · UWED Xalqaro iqtisodiyot va menejment fakulteti, 0-9a-25 guruh", { x: 0.5, y: 4.3, w: 4.5, h: 0.5, fontSize: 12, color: C.accent6 });
}

/* 2. Mundarija */
{
  const s = slide('LIGHT', A, "Taqdimot oltita qismdan iborat. Birinchi qismda muammo va g'oya, ikkinchisida talaba va repetitor ko'radigan saytning har bir sahifasi, so'ng pul va ishonch mexanizmlari, admin panel, texnologiya va oxirida biznes model bilan pilot rejasi.");
  s.addText('Taqdimot rejasi', { placeholder: 'title' });
  const items = [
    ['alertTriangle', 'Muammo va yechim', "Talabalar nimadan qiynaladi va platforma buni qanday hal qiladi", '3–9'],
    ['monitor', 'Foydalanuvchi sayti', "Har bir sahifa: vazifasi va imkoniyatlari", '10–22'],
    ['creditCard', 'Pul va ishonch', "Bron sikli, to'lov hisobi, ishonch mexanizmlari", '23–25'],
    ['settings', 'Admin panel', "12 bo'lim: boshqaruv, moliya, moderatsiya", '26–31'],
    ['server', 'Texnologiya va sifat', "Arxitektura, xavfsizlik, testlar", '32–33'],
    ['trendingUp', 'Biznes va reja', "Daromad modeli, pilot, keyingi qadamlar", '34–37'],
  ];
  for (const [i, [ic, head, sub, pg]] of items.entries()) {
    const col = i % 2; const row = Math.floor(i / 2);
    const x = 0.55 + col * 4.5; const y = 1.3 + row * 1.2;
    card(s, x, y, 4.3, 1.02, C.background2, `reja-${i + 1}`);
    await badge(s, { alertTriangle: 'FiAlertTriangle', monitor: 'FiMonitor', creditCard: 'FiCreditCard', settings: 'FiSettings', server: 'FiServer', trendingUp: 'FiTrendingUp' }[ic], x + 0.2, y + 0.26, 0.5);
    txt(s, head, { x: x + 0.9, y: y + 0.14, w: 2.7, h: 0.3, fontSize: 16, bold: true, color: C.text2 });
    txt(s, sub, { x: x + 0.9, y: y + 0.46, w: 2.85, h: 0.5, fontSize: 12, color: C.accent5 });
    txt(s, pg, { x: x + 3.55, y: y + 0.14, w: 0.65, h: 0.3, fontSize: 12, bold: true, color: C.accent1, align: 'right' });
  }
}

/* 3. Muammo */
{
  const s = slide('LIGHT', A, "Hisobotimizdagi tadqiqotga ko'ra talabalar qo'shimcha ta'lim resurslarini topishga ko'p vaqt sarflaydi, chunki ular tarqoq. To'rtta asosiy og'riq nuqtasi bor: tarqoqlik, ishonch yo'qligi, narxning yopiqligi va tilga oid cheklov.");
  s.addText("Muammo: ta'lim resurslari tarqoq", { placeholder: 'title' });
  const items = [
    ['FiLayers', 'Tarqoqlik', "Kurslar, repetitorlar va materiallar turli Telegram kanallar, saytlar va tanishlar orqali qidiriladi. Yagona joyda taqqoslab bo'lmaydi."],
    ['FiShield', 'Ishonch', "O'qituvchi yoki kurs sifatini oldindan baholash qiyin: sharhlar va reytinglar kam yoki ishonchsiz."],
    ['FiTag', 'Narx shaffofligi', "Narxlar ochiq e'lon qilinmaydi: talaba byudjetiga mos variantni topish uchun har biriga yozishga to'g'ri keladi."],
    ['FiGlobe', 'Til', "Sifatli kontentning katta qismi ingliz yoki rus tilida; o'zbek tilidagi tanlov cheklangan."],
  ];
  for (const [i, [ic, head, text]] of items.entries()) {
    const x = 0.55 + (i % 2) * 4.5; const y = 1.3 + Math.floor(i / 2) * 1.85;
    card(s, x, y, 4.3, 1.65, C.background2, `muammo-${i + 1}`);
    await badge(s, ic, x + 0.22, y + 0.22, 0.55, C.accent3);
    txt(s, head, { x: x + 0.95, y: y + 0.25, w: 3.2, h: 0.35, fontSize: 18, bold: true, color: C.text2 });
    txt(s, text, { x: x + 0.22, y: y + 0.88, w: 3.9, h: 0.72, fontSize: 12, color: C.text1 });
  }
}

/* 4. Maqsadli mijozlar */
{
  const s = slide('LIGHT', A, "Asosiy mijoz — oliy ta'lim talabalari, ayniqsa 1-2 kurs bakalavrlar: ular fanlar bo'yicha yordam va imtihonga tayyorgarlik izlaydi. Ikkinchi tomon — xizmat ko'rsatuvchilar: repetitorlar va o'quv markazlari. Platforma ikki tomonlama bozor.");
  s.addText('Kim uchun: ikki tomonlama bozor', { placeholder: 'title' });
  const rows = [
    ['Bakalavr talabalari (1–2 kurs)', "Fanlar bo'yicha yordam, imtihonga tayyorgarlik", 'Asosiy xaridor'],
    ['Yuqori kurs va magistrantlar', 'IELTS/CEFR, xalqaro grantlar, kasbiy ko\'nikmalar', 'Xaridor'],
    ['Abituriyentlar', 'Kirish imtihonlariga tayyorgarlik', "Qo'shimcha xaridor"],
    ["Repetitorlar va o'quv markazlari", "Yangi o'quvchilar oqimi va reklama", 'Sotuvchi (xizmat beruvchi)'],
  ];
  const hdr = (t) => ({ text: t, options: { bold: true, color: C.background1, fill: { color: C.accent1 }, fontSize: 13 } });
  s.addTable(
    [[hdr('Segment'), hdr('Ehtiyoji'), hdr('Platformadagi roli')], ...rows.map((r, i) => r.map((c, j) => ({ text: c, options: { bold: j === 0, fontSize: 13, color: C.text1, fill: { color: i % 2 ? C.background2 : C.background1 } } })))],
    { x: 0.55, y: 1.3, w: 8.9, colW: [2.9, 3.7, 2.3], rowH: [0.4, 0.62, 0.62, 0.62, 0.62], valign: 'middle', border: { type: 'solid', color: C.accent6, pt: 0.5 }, margin: [0.05, 0.12, 0.05, 0.12], objectName: 'segmentlar-jadvali' }
  );
  await badge(s, 'FiUsers', 0.55, 4.45, 0.45);
  txt(s, "UWEDda pilot sinovi: avval bitta universitet, so'ng boshqa Toshkent universitetlari va viloyatlar.", { x: 1.15, y: 4.47, w: 8.3, h: 0.45, fontSize: 14, color: C.text2, valign: 'middle' });
}

/* 5. Raqobat */
{
  const s = slide('LIGHT', A, "To'g'ridan-to'g'ri raqobatchi — talabalar uchun mahalliy marketplace — deyarli yo'q. Asosiy raqobat bilvosita kanallar bilan: Telegram kanallar bepul, lekin tartibsiz; offlayn markazlar ishonchli, lekin qimmat; xalqaro platformalarda mahalliy fanlar yo'q.");
  s.addText("Hozirgi yo'llar nega yetarli emas", { placeholder: 'title' });
  const rows = [
    ['Telegram kanallar va guruhlar', 'Bepul, hamma foydalanadi', "Tartibsiz, sifat nazorati yo'q"],
    ["Mahalliy o'quv markazlari (offlayn)", 'Ishonch, jonli dars', "Qimmat, taqqoslash qiyin"],
    ['Coursera, Udemy', 'Katta katalog, sertifikat', "Asosan ingliz tilida, mahalliy fanlar yo'q"],
    ['Mahalliy onlayn maktablar', "O'zbek tilida kontent", "Faqat o'z kurslari, tanlov yo'q"],
  ];
  const hdr = (t, fill) => ({ text: t, options: { bold: true, color: C.background1, fill: { color: fill }, fontSize: 13 } });
  s.addTable(
    [[hdr('Raqobatchi', C.accent5), hdr('Kuchli tomoni', C.accent5), hdr('Zaif tomoni', C.accent5)], ...rows.map((r, i) => r.map((c, j) => ({ text: c, options: { bold: j === 0, fontSize: 13, color: C.text1, fill: { color: i % 2 ? C.background2 : C.background1 } } })))],
    { x: 0.55, y: 1.3, w: 8.9, colW: [3.0, 2.7, 3.2], rowH: [0.4, 0.5, 0.5, 0.5, 0.5], valign: 'middle', border: { type: 'solid', color: C.accent6, pt: 0.5 }, margin: [0.05, 0.12, 0.05, 0.12], objectName: 'raqobatchilar-jadvali' }
  );
  card(s, 0.55, 3.95, 8.9, 1.05, C.accent1, 'ustunlik');
  txt(s, "UWEDRepo ustunligi", { x: 0.8, y: 4.07, w: 8.4, h: 0.3, fontSize: 12, bold: true, color: C.accent2 });
  txt(s, "Bir joyda ko'plab ta'lim beruvchilarni taqqoslash, faqat dars olganlarning haqiqiy sharhlari va talabaga mos ochiq narxlar.", { x: 0.8, y: 4.38, w: 8.4, h: 0.55, fontSize: 15, bold: true, color: C.background1 });
}

/* 6. Yechim g'oyasi */
{
  const s = slide('DARK', A, "Yechim — onlayn bozor. Talaba va ta'lim beruvchi bitta platformada uchrashadi. Bu beshta ustunga tayanadi: katalog, reyting va sharhlar, shaffof narx, platforma ichida bron va to'lov, o'zbek tilidagi kontent. Hisobotda EduMarket deb atalgan edi, endi nomi UWEDRepo.");
  dark(s);
  s.addText("Yechim: talabalar uchun ta'lim bozori", { placeholder: 'title' });
  txt(s, "Talaba va ta'lim beruvchini bitta platformada uchrashtiradi: fakultet va kursga moslashtirilgan, narxlari ochiq, sharhlari haqiqiy.", { x: 0.5, y: 1.3, w: 8.4, h: 0.7, fontSize: 16, color: C.accent2 });
  const pillars = [
    ['FiBookOpen', 'Katalog', "Fan, narx, til va format bo'yicha filtr"],
    ['FiStar', 'Reyting va sharhlar', 'Faqat haqiqiy o\'quvchilar baho qoldiradi'],
    ['FiTag', 'Shaffof narx', "Narx oldindan ko'rinadi, birinchi darsga chegirma"],
    ['FiCreditCard', "Bron va to'lov", "Platforma ichida yoziladi va to'lanadi"],
    ['FiGlobe', "O'zbek tilidagi kontent", "Uch tilli sayt, dars tili bo'yicha filtr"],
  ];
  for (const [i, [ic, head, sub]] of pillars.entries()) {
    const x = 0.5 + i * 1.82;
    s.addShape(pres.ShapeType.roundRect, { x, y: 2.35, w: 1.7, h: 2.5, rectRadius: 0.08, fill: { color: C.accent1, transparency: 25 }, line: { color: C.accent1, width: 0 }, objectName: `ustun-${i + 1}` });
    await badge(s, ic, x + 0.57, 2.55, 0.56, C.accent2, HEX.dk);
    txt(s, head, { x: x + 0.1, y: 3.27, w: 1.5, h: 0.5, fontSize: 14, bold: true, color: C.background1, align: 'center' });
    txt(s, sub, { x: x + 0.1, y: 3.85, w: 1.5, h: 0.9, fontSize: 11, color: C.accent6, align: 'center' });
  }
}

/* 7. Muammo → yechim */
{
  const s = slide('LIGHT', A, "Har bir muammoga aniq funksiya javob beradi. Tarqoqlikka — fakultet va kursga moslangan yagona sahifa. Ishonchsizlikka — faqat o'tgan darsdan keyingi sharhlar va admin tekshiruvi. Narxga — soatlik narx va chegirma. Tilga — dars tili filtri va uch tilli interfeys.");
  s.addText("Har bir muammoga — aniq funksiya", { placeholder: 'title' });
  const rows = [
    ['Tarqoqlik', "Fakultet va kursga moslangan fanlar, repetitorlar, materiallar, kalendar va Telegram guruhlar — bitta sayt"],
    ['Ishonch', "Sharh faqat o'tgan darsdan keyin va bitta bronga bittadan; repetitor anketasini admin tasdiqlaydi"],
    ['Narx', "Soatlik narx oldindan ko'rinadi; birinchi darsga chegirma; talaba uchun foydalanish bepul"],
    ['Til', "Dars tili (o'zbek, rus, ingliz) bo'yicha filtr; sayt interfeysi uch tilda"],
  ];
  for (const [i, [m, y_]] of rows.entries()) {
    const y = 1.25 + i * 0.97;
    card(s, 0.55, y, 2.4, 0.82, C.accent3, `muammo-${i}`);
    txt(s, m, { x: 0.55, y, w: 2.4, h: 0.82, fontSize: 18, bold: true, color: C.background1, align: 'center', valign: 'middle' });
    s.addShape(pres.ShapeType.rightArrow, { x: 3.05, y: y + 0.22, w: 0.5, h: 0.38, fill: { color: C.accent5 }, line: { color: C.accent5, width: 0 }, objectName: `strelka-${i}` });
    card(s, 3.65, y, 5.8, 0.82, C.background2, `yechim-${i}`);
    txt(s, y_, { x: 3.85, y, w: 5.4, h: 0.82, fontSize: 14, color: C.text1, valign: 'middle' });
  }
}

/* 8. Foydalanuvchi yo'li */
{
  const s = slide('LIGHT', A, "Talabaning yo'li oltita qadamdan iborat va har biri saytda bitta aniq sahifaga to'g'ri keladi. Fakultetni tanlash, Telegram orqali kirish, repetitor qidirish, bron, to'lov va oxirida baho.");
  s.addText("Talabaning yo'li: oltita qadam", { placeholder: 'title' });
  const steps = [
    ['FiBook', 'Tanlaydi', "Fakultet va kurs"],
    ['FiSend', 'Kiradi', "Telegram bot orqali kod"],
    ['FiSearch', 'Topadi', "Fan, narx, til bo'yicha"],
    ['FiCalendar', 'Bron qiladi', "Bo'sh soatni tanlaydi"],
    ['FiCreditCard', "To'laydi", "Repetitor tasdiqlagach"],
    ['FiStar', 'Baholaydi', "Dars o'tgandan keyin"],
  ];
  for (const [i, [ic, head, sub]] of steps.entries()) {
    const x = 0.55 + i * 1.5;
    await badge(s, ic, x + 0.33, 1.55, 0.7);
    if (i < steps.length - 1) s.addShape(pres.ShapeType.rightArrow, { x: x + 1.12, y: 1.77, w: 0.3, h: 0.26, fill: { color: C.accent6 }, line: { color: C.accent6, width: 0 }, objectName: `qadam-strelka-${i}` });
    txt(s, head, { x, y: 2.4, w: 1.4, h: 0.32, fontSize: 15, bold: true, color: C.text2, align: 'center' });
    txt(s, sub, { x: x + 0.05, y: 2.75, w: 1.3, h: 0.6, fontSize: 12, color: C.accent5, align: 'center' });
  }
  card(s, 0.55, 3.7, 8.9, 1.2, C.background2, 'repetitor-yoli');
  await badge(s, 'FiUserCheck', 0.8, 3.95, 0.65, C.accent5);
  txt(s, "Repetitorning yo'li", { x: 1.7, y: 3.85, w: 7.5, h: 0.3, fontSize: 14, bold: true, color: C.text2 });
  txt(s, "Anketa to'ldiradi → admin tasdiqlaydi → bronlarni qabul qiladi → dars beradi → daromad oladi (platforma komissiya olgach qolgani uniki).", { x: 1.7, y: 4.18, w: 7.5, h: 0.65, fontSize: 14 });
}

/* 9. Sayt xaritasi */
{
  const s = slide('LIGHT', A, "Saytda to'rt xil foydalanuvchi bor: mehmon, talaba, repetitor va admin. Mehmon ro'yxatdan o'tmasdan katalogni ko'radi, bron va baho uchun kirish kerak. Repetitor o'z kabinetiga ega, admin esa alohida panelga.");
  s.addText('Sayt xaritasi: kim nimani ko\'radi', { placeholder: 'title' });
  const cols = [
    ['FiEye', 'Mehmon', ["Bosh sahifa", "Fanlar va fan sahifasi", "Repetitorlar va profil", "Nazoratlar kalendari", "Materiallar", "So'rovnoma"]],
    ['FiUser', 'Talaba', ["Kirish (Telegram)", "Darslarim: to'lash, bekor qilish", "Baho va sharh", "Material ulashish"]],
    ['FiBriefcase', 'Repetitor', ["Anketa va haftalik vaqtlar", "Bronlarni tasdiqlash yoki rad etish", "«Dars o'tdi» belgisi", "Daromad ulushi"]],
    ['FiSettings', 'Admin', ["12 bo'limli panel", "Moderatsiya", "Moliya va hisob", "Sozlamalar va jurnal"]],
  ];
  for (const [i, [ic, head, list]] of cols.entries()) {
    const x = 0.55 + i * 2.27;
    card(s, x, 1.25, 2.12, 3.5, C.background2, `rol-${head}`);
    await badge(s, ic, x + 0.8, 1.42, 0.52, i === 3 ? C.accent5 : C.accent1);
    txt(s, head, { x: x + 0.1, y: 2.05, w: 1.92, h: 0.32, fontSize: 16, bold: true, color: C.text2, align: 'center' });
    bullets(s, list, { x: x + 0.15, y: 2.5, w: 1.85, h: 2.2, fontSize: 13, gap: 5 });
  }
}

/* 10. Bosh sahifa: birinchi ekran */
await shotSlide({
  title: 'Bosh sahifa: birinchi taassurot', section: B, img: await shot('home-hero', { aspect: 1.6 }),
  notes: "Bosh sahifaning birinchi ekrani. Talaba fakultet va kursini tanlaydi, tanlov eslab qolinadi. O'ng tomondagi katta raqam — tanlangan kursning eng yaqin nazoratigacha qolgan kunlar: u bazadan keladi va yuklanganda sanab chiqadi. Pastda haqiqiy raqamlar: nechta fan, repetitor, material va sana bor.",
  purpose: "Sayt nima ekanini, nima berishini va talabaga eng kerakli raqamni darhol ko'rsatadi.",
  items: ["Fakultet va kursni tanlash: tanlov eslab qolinadi, hamma sahifa shunga moslashadi", "Eng yaqin nazoratgacha «necha kun qoldi» hisoblagichi", "Haqiqiy raqamlar: fanlar, repetitorlar, materiallar, sanalar", "Uch til: o'zbek, rus, ingliz"],
});

/* 11. Bosh sahifa: bo'limlar */
{
  const s = slide('LIGHT', B, "Bosh sahifa pastga davom etadi: saytning imkoniyatlari, qanday ishlashi, afzalliklari, Telegram kanallari bilan taqqoslash, tavsiya etilgan repetitorlar va ko'p beriladigan savollar. Maqsad — yangi kelgan odam bir sahifada hamma narsani tushunib olsin.");
  s.addText("Bosh sahifa: saytni tushuntiruvchi bo'limlar", { placeholder: 'title' });
  const a = await shot('home-features', { aspect: 1.9, top: 0 });
  const b = await shot('home-how', { aspect: 1.9, top: 0.0 });
  frame(s, a, 0.55, 1.15, 4.0, 'imkoniyatlar', 'Imkoniyatlar'); frame(s, b, 5.0, 1.15, 4.0, 'qanday-ishlaydi', 'Qanday ishlaydi');
  const chips = ['Imkoniyatlar (6)', 'Yaqin nazoratlar', 'Qanday ishlaydi: talaba / repetitor', 'Afzalliklar (6)', 'Telegram kanallari bilan taqqoslash', 'Tavsiya repetitorlar', 'Savol-javob (8)', 'Repetitor bo\'lishga chaqiruv'];
  let cx = 0.55; let cy = 3.75;
  for (const c of chips) {
    const w = 0.28 + c.length * 0.083;
    if (cx + w > 9.5) { cx = 0.55; cy += 0.5; }
    s.addShape(pres.ShapeType.roundRect, { x: cx, y: cy, w, h: 0.38, rectRadius: 0.19, fill: { color: C.background2 }, line: { color: C.accent6, width: 0.5 }, objectName: 'bolim-teg' });
    txt(s, c, { x: cx, y: cy, w, h: 0.38, fontSize: 12, color: C.text2, align: 'center', valign: 'middle' });
    cx += w + 0.12;
  }
}

/* 12. Fanlar */
await shotSlide({
  title: 'Fanlar: faqat o\'zingizniki', section: B, img: await shot('subjects', { aspect: 1.6 }), left: false,
  notes: "Fanlar sahifasi. Talaba fakultet va kursini tanlagani uchun faqat o'ziga tegishli fanlar ro'yxatini ko'radi. Qo'shimcha fanlar, masalan IELTS yoki Dasturlash, hamma kurs uchun ochiq. Har bir kartada shu fandan nechta repetitor borligi ko'rinadi. Tepada izoh bloki ro'yxat qanday tuzilishini tushuntiradi.",
  purpose: "Talabaga keraksiz ma'lumotsiz, aynan o'z semestridagi fanlarni ko'rsatadi.",
  items: ["Ro'yxat fakultet va kursga qarab chiqadi", "«Qo'shimcha» belgisi: IELTS, Dasturlash kabi hamma kurs uchun fanlar", "Har bir fanda nechta repetitor borligi ko'rinadi", "Fan nomi bo'yicha qidirish"],
});

/* 13. Fan sahifasi */
await shotSlide({
  title: 'Fan sahifasi: hammasi bir joyda', section: B, img: await shot('subject', { aspect: 2.3 }),
  notes: "Bitta fanga oid hamma narsa bir sahifada: shu fandan dars beradigan repetitorlar, materiallar, nazorat sanalari va Telegram muhokama guruhiga qo'shilish tugmasi. Talaba sahifalar orasida adashmaydi.",
  purpose: "Bir fanga oid hamma narsani bitta sahifada to'playdi.",
  items: ["Repetitorlar: shu fandan dars beradiganlar, reyting bo'yicha", "Materiallar: konspekt, test, video, imtihon savollari", "Nazoratlar: sana va qolgan kun", "«Telegram guruhga qo'shilish»: kursdoshlar bilan savol-javob"],
});

/* 14. Repetitorlar katalogi */
await shotSlide({
  title: 'Repetitorlar katalogi va filtrlar', section: B, img: await shot('tutors', { aspect: 1.6 }), left: false,
  notes: "Katalogda repetitorlarni narx, til va format bo'yicha taqqoslash mumkin. Chap tomonda filtrlar, o'ngda kartalar. Har bir kartada reyting, soatlik narx, fanlar, format va til. Tepada izoh bloki narx va reytingni qanday o'qishni tushuntiradi: masalan «hali baho yo'q» degani yangi repetitor, yomon emas.",
  purpose: "Repetitorlarni yonma-yon taqqoslash va o'zingizga mosini tez tanlash.",
  items: ["Filtrlar: qidiruv, fan, narx oralig'i, format, dars tili", "Saralash: reyting, narx, ko'p dars o'tgani", "Kartada: reyting, narx, fanlar, «Tavsiya» belgisi", "Izoh: narx va reytingni qanday o'qish"],
});

/* 15. Repetitor profili va bron */
await shotSlide({
  title: 'Repetitor profili va bron', section: B, img: await shot('tutor', { aspect: 1.6 }),
  notes: "Qaror qabul qilish sahifasi. Chapda repetitor haqida hamma narsa: tajriba, fanlar, format, til, odatdagi vaqtlar va faqat dars olganlarning sharhlari. O'ngda bron paneli: keyingi 14 kunning bo'sh soatlari. Band vaqtni tanlab bo'lmaydi: bir vaqtga ikki bron tushmasligi ma'lumotlar bazasi darajasida ta'minlangan. Birinchi darsga chegirma avtomatik hisoblanadi.",
  purpose: "Qaror qabul qilish sahifasi: repetitor haqida hamma ma'lumot va to'g'ridan-to'g'ri bron.",
  items: ["Tajriba, fanlar, format, til, odatdagi vaqtlar", "Keyingi 14 kunning bo'sh soatlari; band vaqt tanlanmaydi", "Narx va birinchi dars chegirmasi (ⓘ izoh bilan)", "«Bron qanday ishlaydi» va bekor qilish qoidasi"],
  gap: 4,
});

/* 16. Kalendar */
await shotSlide({
  title: 'Nazoratlar kalendari', section: B, img: await shot('calendar', { aspect: 1.7 }), left: false,
  notes: "Nazoratlar kalendari: oraliq va yakuniy nazorat sanalari oylar bo'yicha guruhlangan. Har bir sanada necha kun qolgani ko'rinadi, rang bilan: qizil — bir haftadan kam, sariq — uch haftagacha, yashil — ko'p vaqt bor. Sanani bossa, o'sha fan sahifasiga o'tadi va repetitor topadi. Hozirgi sanalar demo, admin rasmiy sanalarni kiritadi.",
  purpose: "Talaba tayyorgarlikni o'z vaqtida boshlaydi va bir bosishda tayyorlanishga o'tadi.",
  items: ["Oraliq va yakuniy sanalar oylar bo'yicha", "Necha kun qolgani: qizil ≤ 7, sariq ≤ 21, yashil — ko'proq", "Sanadan fanga, fandan repetitorga bir bosishda o'tish", "Demo sanalar haqida ogohlantirish: dekanat jadvali bilan solishtirish"],
  gap: 4,
});

/* 17. Materiallar */
await shotSlide({
  title: "O'quv materiallari", section: B, img: await shot('materials', { aspect: 1.9 }),
  notes: "Materiallar sahifasi: konspekt, test, video va imtihon savollari fanlar bo'yicha. Talaba o'zi ham material ulashishi mumkin, lekin havola avval adminga tushadi va tekshirilgach hamma ko'radi. Tepada ikki izoh: materiallar qanday tekshirilishi va nimani ulashish mumkinligi, ya'ni mualliflik huquqi.",
  purpose: "Tarqoq materiallarni fanlar bo'yicha bir joyga yig'adi.",
  items: ["To'rt tur: konspekt, test, video, imtihon savollari", "Fan va tur bo'yicha filtr", "Talaba ham ulashadi; admin tekshirgach ko'rinadi", "Ogohlantirish: mualliflik huquqi va shaxsiy ma'lumot"],
  left: true,
});

/* 18. Telegram orqali kirish */
{
  const s = slide('LIGHT', B, "Ro'yxatdan o'tish va kirish Telegram bot orqali. Foydalanuvchi tugmani bosadi, bot ochiladi, Start bosadi va bot 6 xonali kod yuboradi. Kodni saytga kiritadi. Shu bilan Telegram ismi va username'i akkauntga ulanadi, parol kerak emas. Kod 10 daqiqa amal qiladi, bir marta ishlatiladi va 5 ta noto'g'ri urinishdan keyin bloklanadi.");
  s.addText("Kirish: Telegram bot orqali, parolsiz", { placeholder: 'title' });
  frame(s, await shot('register', { aspect: 1.6 }), 0.55, 1.25, 4.5, 'kirish', "Ro'yxatdan o'tish");
  const steps = [
    ['FiMousePointer', 'Tugmani bosing', "«Telegram orqali kod olish»: bot ochiladi"],
    ['FiPlay', 'Botda Start', 'Bot 6 xonali kod yuboradi'],
    ['FiKey', 'Kodni kiriting', 'Saytdagi maydonga yoziladi'],
    ['FiCheck', 'Tayyor', "Ism va username ulandi; telefon ixtiyoriy"],
  ];
  for (const [i, [ic, head, sub]] of steps.entries()) {
    const y = 1.2 + i * 0.75;
    await badge(s, ic, 5.4, y, 0.5);
    txt(s, head, { x: 6.1, y: y - 0.02, w: 3.4, h: 0.28, fontSize: 14, bold: true, color: C.text2 });
    txt(s, sub, { x: 6.1, y: y + 0.26, w: 3.4, h: 0.4, fontSize: 12, color: C.accent5 });
  }
  card(s, 5.4, 4.2, 4.1, 0.85, C.background2, 'xavfsizlik');
  txt(s, "Kod 10 daqiqa amal qiladi, bir martalik, 5 urinishdan keyin bloklanadi. Kodni boshqa Telegram akkaunti ololmaydi.", { x: 5.55, y: 4.25, w: 3.8, h: 0.75, fontSize: 12, color: C.text1, valign: 'middle' });
}

/* 19. Mening darslarim */
await shotSlide({
  title: 'Mening darslarim (talaba)', section: B, img: await shot('my', { aspect: 1.9, top: 0.0 }), left: false, imgW: 5.1,
  notes: "Talabaning shaxsiy sahifasi. Tepada holatlar nimani bildirishi tushuntirilgan. Kartada dars, repetitor, narx va chegirma ko'rinadi. Repetitor tasdiqlagach «To'lash» tugmasi chiqadi, Telegram aloqasi ochiladi. Dars o'tgach baho berish mumkin. To'langan darsni belgilangan muddatdan oldin bekor qilsa, to'lov qaytariladi.",
  purpose: "Bronning butun hayot sikli talaba uchun bir sahifada.",
  items: ["Holatlar izohi: kutilmoqda, to'lov kutilmoqda, to'langan, o'tgan", "«To'lash»: Click, Payme yoki karta (pilotda mock)", "Tasdiqdan keyin «Telegramda yozish» ochiladi", "Bekor qilish va dars o'tgach baho berish"],
});

/* 20. Repetitor kabineti */
await shotSlide({
  title: 'Repetitor kabineti', section: B, img: await shot('tutor-panel', { aspect: 1.6 }),
  notes: "Repetitor kabineti. Anketa tasdiqlangach repetitor bu yerda bronlarni boshqaradi: tasdiqlaydi yoki rad etadi, dars o'tgach belgilaydi. Har bir bronda uning ulushi ko'rinadi, ya'ni komissiya ayirilgan summa. Anketani istalgan vaqt yangilashi mumkin, haftalik bo'sh vaqtlarini o'zi belgilaydi. Yangi bron kelsa, Telegramga xabar keladi.",
  purpose: "Repetitor o'z bronlarini va jadvalini shu yerda boshqaradi.",
  items: ["Anketa: sarlavha, narx, fanlar, til, format, haftalik vaqtlar", "Bronlar: tasdiqlash, rad etish, «Dars o'tdi»", "Har bir bronda uning ulushi ko'rinadi", "Yangi bron haqida Telegram xabari"],
  left: false,
});

/* 21. Mobil va uch til */
{
  const s = slide('LIGHT', B, "Sayt telefonda ham to'liq ishlaydi: har bir sahifa telefon uchun alohida maketga ega. Bu muhim, chunki talabalarning ko'pchiligi telefondan kiradi. Interfeys uch tilda: o'zbek, rus va ingliz, tanlov saqlanadi. Ommaviy sahifa yengil, taxminan 136 kilobayt siqilgan holda.");
  s.addText('Telefonda va uch tilda', { placeholder: 'title' });
  const phone = async (name, x) => {
    const m = await sharp(path.join(SH, `${name}.jpg`)).metadata();
    const img = { path: path.join(SH, `${name}.jpg`), ratio: m.width / m.height };
    frame(s, img, x, 1.2, 1.75, name, name);
  };
  await phone('mobile-home', 0.6);
  await phone('mobile-tutor', 2.75);
  const items = [
    ['FiSmartphone', "Har sahifa telefon uchun alohida maket", ""],
    ['FiGlobe', "O'zbek, rus, ingliz: til almashtirgich sarlavhada", ""],
    ['FiZap', "Yengil sayt (~136 KB) va silliq animatsiya", ""],
    ['FiEye', "Harakatni cheklagan foydalanuvchilar uchun animatsiya o'chadi", ""],
  ];
  for (const [i, [ic, head]] of items.entries()) {
    const y = 1.35 + i * 0.9;
    await badge(s, ic, 5.2, y, 0.52);
    txt(s, head, { x: 5.95, y: y - 0.04, w: 3.55, h: 0.62, fontSize: 14, valign: 'middle' });
  }
}

/* 22. So'rovnoma */
await shotSlide({
  title: "So'rovnoma: Customer Development", section: B, img: await shot('survey', { aspect: 1.6 }), left: false,
  notes: "Hisobotdagi bo'sh jadvallarni to'ldirish uchun saytda anonim so'rovnoma bor. Talaba va repetitor uchun alohida savollar. Ism va email so'ralmaydi. Natijalar admin panelda avtomatik hisoblanadi: qidirishga ketadigan vaqt, sharhga ishonch, to'lashga tayyorlik, o'rtacha byudjet. Maqsad — kamida 30 ta javob.",
  purpose: "Gipotezalarni haqiqiy javoblar bilan tekshiradi va hisobotdagi raqamlarni to'ldiradi.",
  items: ["Anonim: ism va email so'ralmaydi", "Talaba va repetitor uchun alohida savollar", "Natija adminda avtomatik: foizlar, o'rtacha byudjet, ehtiyojlar", "CSV eksport va bozor hajmi kalkulyatori; maqsad ≥ 30 javob"],
});

/* 23. Bron hayot sikli */
{
  const s = slide('LIGHT', Cc, "Har bir bron to'rt holatdan o'tadi. Talaba yuboradi — kutilmoqda. Repetitor tasdiqlaydi — to'lov kutilmoqda. Talaba to'laydi — to'langan. Dars o'tadi — o'tgan. Har bosqichda tegishli odamga Telegram xabari boradi. Istalgan bosqichda bekor qilish mumkin, to'langan bo'lsa qoidaga ko'ra to'lov qaytariladi.");
  s.addText('Bron hayot sikli', { placeholder: 'title' });
  const st = [
    ['Kutilmoqda', 'Talaba bron yubordi', "Repetitorga: «Yangi bron»", C.accent3],
    ["To'lov kutilmoqda", 'Repetitor tasdiqladi', "Talabaga: «Tasdiqlandi, to'lang»", C.accent1],
    ["To'langan", "Talaba to'ladi (yoki admin qo'lda)", "Repetitorga: «To'lov qabul qilindi»", C.accent1],
    ["O'tgan", "Dars o'tdi", "Talabaga: «Baho bering»", C.accent5],
  ];
  for (const [i, [head, who, msg, col]] of st.entries()) {
    const x = 0.55 + i * 2.27;
    s.addShape(pres.ShapeType.roundRect, { x, y: 1.3, w: 2.0, h: 0.75, rectRadius: 0.08, fill: { color: col }, line: { color: col, width: 0 }, objectName: `holat-${i + 1}` });
    txt(s, head, { x, y: 1.3, w: 2.0, h: 0.75, fontSize: 15, bold: true, color: C.background1, align: 'center', valign: 'middle' });
    if (i < 3) s.addShape(pres.ShapeType.rightArrow, { x: x + 2.04, y: 1.52, w: 0.2, h: 0.3, fill: { color: C.accent5 }, line: { color: C.accent5, width: 0 }, objectName: `o'tish-${i + 1}` });
    txt(s, who, { x, y: 2.2, w: 2.0, h: 0.6, fontSize: 12, bold: true, color: C.text2, align: 'center' });
    txt(s, msg, { x, y: 2.85, w: 2.0, h: 0.55, fontSize: 11, color: C.accent5, align: 'center' });
  }
  card(s, 0.55, 3.65, 4.35, 1.35, C.background2, 'bekor');
  await badge(s, 'FiXCircle', 0.75, 3.85, 0.5, C.accent4);
  txt(s, 'Bekor qilish', { x: 1.45, y: 3.82, w: 3.3, h: 0.3, fontSize: 14, bold: true, color: C.text2 });
  txt(s, "To'langan darsni boshlanishiga belgilangan soatdan (standart 24) ko'p qolganda bekor qilsa, pul qaytariladi. Repetitor rad etsa, har doim qaytariladi.", { x: 1.45, y: 4.14, w: 3.3, h: 0.85, fontSize: 11, color: C.text1 });
  card(s, 5.1, 3.65, 4.35, 1.35, C.background2, 'poyga');
  await badge(s, 'FiLock', 5.3, 3.85, 0.5, C.accent1);
  txt(s, 'Ikki marta bron yo\'q', { x: 6.0, y: 3.82, w: 3.3, h: 0.3, fontSize: 14, bold: true, color: C.text2 });
  txt(s, "Bir vaqtga ikki bron yoki ikki marta to'lov mumkin emas: bu ma'lumotlar bazasi darajasida kafolatlangan va testda tekshirilgan.", { x: 6.0, y: 4.14, w: 3.3, h: 0.85, fontSize: 11, color: C.text1 });
}

/* 24. Pul oqimi */
{
  const s = slide('LIGHT', Cc, "Pul hisobi shaffof. Misol: repetitor soatiga 100 ming so'm so'raydi. Birinchi darsga 20 foiz chegirma: talaba 80 ming to'laydi. Platforma 10 foiz komissiya oladi, ya'ni 8 ming. Repetitorga 72 ming qoladi. Talaba uchun foydalanish bepul. Komissiya va chegirma admin paneldan o'zgartiriladi. Pilotda to'lov qo'lda, Click va Payme keyinroq ulanadi.");
  s.addText("Pul oqimi: misol hisob", { placeholder: 'title' });
  s.addChart(pres.charts.DOUGHNUT, [{ name: "100 000 so'mlik dars", labels: ['Repetitor ulushi', 'Platforma komissiyasi', 'Talaba chegirmasi'], values: [72000, 8000, 20000] }], {
    x: 0.45, y: 1.1, w: 4.4, h: 3.9, holeSize: 55, chartColors: [HEX.teal, HEX.dk, HEX.amber], showLegend: true, legendPos: 'b', legendFontSize: 12, legendColor: HEX.ink,
    showPercent: false, showValue: true, dataLabelColor: 'FFFFFF', dataLabelFontSize: 11, dataLabelFormatCode: '#,##0', showTitle: true, title: "100 000 so'mlik dars", titleFontSize: 14, titleColor: HEX.ink,
    dataBorder: { pt: 1, color: 'FFFFFF' },
  });
  const rows = [
    ['Repetitor narxi', "100 000 so'm", false],
    ['Birinchi dars chegirmasi 20%', "− 20 000 so'm", false],
    ["Talaba to'laydi", "80 000 so'm", true],
    ['Platforma komissiyasi 10%', "− 8 000 so'm", false],
    ['Repetitorga qoladi', "72 000 so'm", true],
  ];
  for (const [i, [a, b, bold]] of rows.entries()) {
    const y = 1.3 + i * 0.5;
    card(s, 5.1, y, 4.35, 0.42, bold ? C.accent1 : C.background2, `hisob-${i}`);
    txt(s, a, { x: 5.25, y, w: 2.6, h: 0.42, fontSize: 12, bold, color: bold ? C.background1 : C.text1, valign: 'middle' });
    txt(s, b, { x: 7.7, y, w: 1.6, h: 0.42, fontSize: 13, bold: true, color: bold ? C.background1 : C.text2, align: 'right', valign: 'middle' });
  }
  bullets(s, ["Talaba uchun foydalanish bepul", "Foiz va muddatlar admin paneldan o'zgaradi", "Pilotda to'lov qo'lda; Click/Payme keyinroq"], { x: 5.1, y: 3.95, w: 4.35, h: 1.1, fontSize: 12, gap: 3 });
}

/* 25. Ishonch mexanizmlari */
{
  const s = slide('LIGHT', Cc, "Marketplace ishonchga tayanadi, shuning uchun oltita mexanizm bor. Sharh faqat dars o'tgan talabadan, bitta bronga bittadan. Repetitor va materialni admin tekshiradi. Telegram kontakti faqat tasdiqlangan bronda ochiladi. Buzg'unchini bloklash mumkin. Bekor qilish qoidalari oldindan ko'rsatilgan. Admin harakatlari jurnalga yoziladi.");
  s.addText('Ishonch mexanizmlari', { placeholder: 'title' });
  const items = [
    ['FiStar', "Halol reyting", "Sharh faqat o'tgan darsdan keyin, bitta bronga bittadan"],
    ['FiShield', 'Admin tekshiruvi', "Repetitor anketasi va talaba materiallari tasdiqlanmaguncha ko'rinmaydi"],
    ['FiLock', 'Kontakt maxfiyligi', "Telegram va telefon faqat tasdiqlangan bronda, ikkinchi tomonga ko'rinadi"],
    ['FiUserX', 'Bloklash', "Qoidabuzarni bloklash: u kira olmaydi va bron qila olmaydi"],
    ['FiRefreshCw', 'Aniq qoidalar', "Bekor qilish va qaytarish qoidalari bron oldidan ko'rsatiladi"],
    ['FiList', 'Faoliyat jurnali', "Admin harakatlari o'chirib bo'lmaydigan tarixga yoziladi"],
  ];
  for (const [i, [ic, head, text]] of items.entries()) {
    const x = 0.55 + (i % 3) * 3.0; const y = 1.3 + Math.floor(i / 3) * 1.9;
    card(s, x, y, 2.85, 1.72, C.background2, `ishonch-${i + 1}`);
    await badge(s, ic, x + 0.2, y + 0.18, 0.5);
    txt(s, head, { x: x + 0.82, y: y + 0.2, w: 1.95, h: 0.45, fontSize: 14, bold: true, color: C.text2, valign: 'middle' });
    txt(s, text, { x: x + 0.2, y: y + 0.82, w: 2.5, h: 0.85, fontSize: 12, color: C.text1 });
  }
}

/* 26. Admin: umumiy xarita */
{
  const s = slide('DARK', D, "Admin panel — platformaning boshqaruv markazi, 12 bo'limdan iborat. Har bir bo'limning tepasida «bu bo'lim nima qiladi» izohi bor, raqamlar yonida esa qanday hisoblanishini aytadigan belgi. Birinchi marta kirgan admin uchun alohida yo'riqnoma bo'limi bor.");
  dark(s);
  s.addText("Admin panel: 12 ta bo'lim", { placeholder: 'title' });
  const items = [
    ['FiBarChart2', 'Umumiy', 'Tayyorlik, grafiklar, voronka'],
    ['FiUsers', 'Foydalanuvchilar', 'Qidirish, bloklash, rol'],
    ['FiUserCheck', 'Repetitorlar', 'Tasdiqlash va rad etish'],
    ['FiCalendar', 'Bronlar', "Qo'lda to'lov, dars o'tdi"],
    ['FiDollarSign', 'Moliya', 'Repetitorlarga hisob'],
    ['FiStar', 'Sharhlar', 'Qoidabuzarini yashirish'],
    ['FiFileText', 'Kontent', 'Fan, sana, material'],
    ['FiSend', 'Xabarlar', "Telegram e'lonlari"],
    ['FiSearch', 'Tadqiqot', "So'rovnoma, bozor hajmi"],
    ['FiSettings', 'Sozlamalar', 'Komissiya, chegirma, parol'],
    ['FiClock', 'Jurnal', 'Kim nima qilgani'],
    ['FiHelpCircle', "Yo'riqnoma", 'Kunlik va haftalik ishlar'],
  ];
  for (const [i, [ic, head, sub]] of items.entries()) {
    const x = 0.5 + (i % 4) * 2.28; const y = 1.2 + Math.floor(i / 4) * 1.3;
    s.addShape(pres.ShapeType.roundRect, { x, y, w: 2.15, h: 1.15, rectRadius: 0.08, fill: { color: C.accent1, transparency: 25 }, line: { color: C.accent1, width: 0 }, objectName: `admin-${i + 1}` });
    await badge(s, ic, x + 0.15, y + 0.15, 0.45, C.accent2, HEX.dk);
    txt(s, head, { x: x + 0.7, y: y + 0.17, w: 1.4, h: 0.42, fontSize: 14, bold: true, color: C.background1, valign: 'middle' });
    txt(s, sub, { x: x + 0.15, y: y + 0.72, w: 1.9, h: 0.4, fontSize: 12, color: C.accent6 });
  }
}

/* 27. Admin: umumiy ko'rinish + voronka */
await twoShots({
  title: "Admin: umumiy ko'rinish", section: D,
  notes: "Birinchi bo'lim. Pilotga tayyorlik ro'yxati to'qqiz punktdan iborat: parol almashtirilganmi, bot ulanganmi, fanlar kiritilganmi, sanalar rasmiymi, repetitorlar yetarlimi va hokazo. Har bir bajarilmagan punkt uchun nima qilish kerakligi yoziladi. Pastda ko'rsatkichlar, 30 kunlik grafiklar va voronka: odamlar qaysi bosqichda to'xtab qolayotgani.",
  a: { name: 'admin-umumiy', head: 'Pilotga tayyorlik va ko\'rsatkichlar', text: "9 punktli tayyorlik ro'yxati, tasdiqni kutayotgan narsalar, 8 ta asosiy ko'rsatkich (ⓘ da formulasi).", img: await shot('admin-overview', { aspect: 1.6 }) },
  b: { name: 'admin-voronka', head: 'Voronka va dinamika', text: "Kirdi → ro'yxatdan o'tdi → bron qildi → to'ladi → qaytdi. 30 kunlik grafiklar, tashrif manbalari.", img: await shot('admin-funnel', { aspect: 1.6 }) },
});

/* 28. Admin: foydalanuvchilar + repetitorlar */
await twoShots({
  title: 'Admin: foydalanuvchilar va repetitorlar', section: D,
  notes: "Foydalanuvchilar bo'limida hamma akkauntni qidirish, batafsil ko'rish, bloklash va admin huquqini berish mumkin; o'zini bloklab bo'lmaydi va oxirgi adminni olib tashlab bo'lmaydi. Repetitorlar bo'limida anketalar: tasdiqlash yoki sabab yozib rad etish; sabab repetitorga Telegram orqali boradi. Har bir repetitorning daromadi va reytingi ko'rinadi.",
  a: { name: 'admin-foydalanuvchilar', head: 'Foydalanuvchilar', text: "Qidirish, rol bo'yicha filtr, batafsil, bloklash, admin huquqi berish, CSV eksport.", img: await shot('admin-users', { aspect: 1.6 }) },
  b: { name: 'admin-repetitorlar', head: 'Repetitorlar moderatsiyasi', text: "Anketani tasdiqlash yoki sabab yozib rad etish (sabab Telegramga ketadi), «Tavsiya» belgisi.", img: await shot('admin-tutors', { aspect: 1.6 }) },
});

/* 29. Admin: bronlar + moliya */
await twoShots({
  title: 'Admin: bronlar va moliya', section: D,
  notes: "Bronlar bo'limida admin nizoli holatlarni hal qiladi. Pilotda to'lov qo'lda bo'lgani uchun talaba to'lagach admin Qo'lda to'langan tugmasini bosadi. Moliya bo'limida pul uch bosqichda ko'rinadi: kutilmoqda, repetitorga berilishi kerak va o'tkazilgan. Pulni admin bank orqali o'zi o'tkazadi va O'tkazildi deb belgilaydi.",
  a: { name: 'admin-bronlar', head: 'Bronlar', text: "Filtrlar, «Qo'lda to'langan», «Dars o'tdi», bekor qilish, CSV. Har amal jurnalga yoziladi.", img: await shot('admin-bookings', { aspect: 1.6 }) },
  b: { name: 'admin-moliya', head: 'Moliya', text: "Kutilmoqda / berilishi kerak / o'tkazilgan; repetitor bo'yicha hisob, oylik daromad, CSV.", img: await shot('admin-finance', { aspect: 1.6 }) },
});

/* 30. Admin: kontent + xabarlar */
await twoShots({
  title: "Admin: kontent va e'lonlar", section: D,
  notes: "Kontent bo'limida fanlar, nazorat sanalari va materiallar. Demo sanalarni bir tugma bilan rasmiy qilish mumkin. Talabalar yuborgan materiallar shu yerda tekshiriladi. Xabarlar bo'limida Telegram bot orqali barcha, faqat talabalar yoki faqat repetitorlarga e'lon yuboriladi; qabul qiluvchilar soni va xabar ko'rinishi oldindan ko'rsatiladi.",
  a: { name: 'admin-kontent', head: 'Kontent', text: "Fanlarni tahrirlash, nazorat sanalari («Demo» belgisini olib tashlash), materiallarni tekshirish.", img: await shot('admin-content', { aspect: 1.6 }) },
  b: { name: 'admin-xabarlar', head: "Telegram e'lonlari", text: "Kimga yuborilishi, qabul qiluvchilar soni, xabar ko'rinishi va yuborilganlar tarixi.", img: await shot('admin-messages', { aspect: 1.6 }) },
});

/* 31. Admin: sozlamalar, jurnal, yo'riqnoma */
{
  const s = slide('LIGHT', D, "Oxirgi uchta bo'lim. Sozlamalarda komissiya, chegirma, bekor qilish muddati, ro'yxatdan o'tishni yopish va saytning yuqori xabari; kod o'zgartirilmaydi, o'zgarish darhol kuchga kiradi. Jurnalda adminlar harakati o'chirilmaydigan tarix bo'lib turadi. Yo'riqnomada har bir bo'limning vazifasi va kunlik, haftalik ishlar tartibi yozilgan.");
  s.addText("Admin: sozlamalar, jurnal, yo'riqnoma", { placeholder: 'title' });
  const items = [
    ['admin-settings', 'Sozlamalar', "Komissiya, chegirma, bekor qilish muddati, yuqori xabar, parol, tizim holati"],
    ['admin-audit', 'Faoliyat jurnali', "Kim, qachon, nima qilgani: o'chirib bo'lmaydi"],
    ['admin-guide', "Yo'riqnoma", "Har bo'limning vazifasi, kunlik va haftalik ishlar, atamalar"],
  ];
  for (const [i, [name, head, text]] of items.entries()) {
    const x = 0.55 + i * 3.0;
    frame(s, await shot(name, { aspect: name === 'admin-audit' ? 2.2 : 1.6 }), x, 1.2, 2.75, name, head);
    txt(s, head, { x, y: 3.1, w: 2.75, h: 0.3, fontSize: 14, bold: true, color: C.text2 });
    txt(s, text, { x, y: 3.42, w: 2.75, h: 0.9, fontSize: 12, color: C.accent5 });
  }
  card(s, 0.55, 4.4, 8.9, 0.62, C.background2, 'eslatma');
  txt(s, "Admin panel faqat o'zbek tilida; kodi alohida yuklanadi, shuning uchun ommaviy sahifa yengil qoladi.", { x: 0.75, y: 4.4, w: 8.5, h: 0.62, fontSize: 12, color: C.text1, valign: 'middle' });
}

/* 32. Texnologiya */
{
  const s = slide('LIGHT', E, "Texnologiya — siz so'ragan stek: React va Tailwind klientda, Node va Express serverda, MongoDB bazada. Telegram bot serverning o'zida, long polling bilan ishlaydi, shuning uchun ochiq domen talab qilinmaydi. To'lov qatlami alohida fayl: hozir mock, keyin Click va Payme bilan almashtiriladi.");
  s.addText('Texnologiya va arxitektura', { placeholder: 'title' });
  const box = async (x, y, w, h, ic, head, sub, style = 'teal') => {
    const fill = { teal: C.accent1, dark: C.text2, light: C.background2 }[style];
    const onDark = style !== 'light';
    card(s, x, y, w, h, fill, `blok-${head}`);
    await badge(s, ic, x + 0.15, y + 0.15, 0.46, onDark ? C.accent2 : C.accent1, onDark ? HEX.dk : 'FFFFFF');
    txt(s, head, { x: x + 0.72, y: y + 0.13, w: w - 0.85, h: 0.5, fontSize: 14, bold: true, color: onDark ? C.background1 : C.text2, valign: 'middle' });
    txt(s, sub, { x: x + 0.15, y: y + 0.72, w: w - 0.3, h: h - 0.8, fontSize: 12, color: onDark ? C.background2 : C.text1 });
  };
  await box(0.55, 1.3, 2.6, 1.6, 'FiMonitor', 'Brauzer', 'React 18 · Vite · Tailwind CSS · Framer Motion · React Router');
  await box(3.7, 1.3, 2.6, 1.6, 'FiServer', 'API server', 'Node.js · Express · Mongoose · Zod · JWT · bcrypt · Helmet', 'dark');
  await box(6.85, 1.3, 2.6, 1.6, 'FiDatabase', 'MongoDB', "Foydalanuvchi, repetitor, bron, sharh, sozlama, jurnal", 'teal');
  for (const x of [3.2, 6.35]) s.addShape(pres.ShapeType.rightArrow, { x, y: 1.95, w: 0.45, h: 0.3, fill: { color: C.accent5 }, line: { color: C.accent5, width: 0 }, objectName: 'strelka' });
  await box(3.7, 3.35, 2.6, 1.6, 'FiSend', 'Telegram Bot API', 'Kirish kodi, bildirishnomalar, admin e\'lonlari (long polling)', 'teal');
  await box(6.85, 3.35, 2.6, 1.6, 'FiCreditCard', "To'lov provayderi", "Hozir mock · keyin Click va Payme (payments.js almashtiriladi)", 'light');
  s.addShape(pres.ShapeType.line, { x: 5.0, y: 2.9, w: 0, h: 0.45, line: { color: HEX.muted, width: 1.5, endArrowType: 'triangle', beginArrowType: 'triangle' }, objectName: 'bog-telegram' });
  s.addShape(pres.ShapeType.line, { x: 6.3, y: 2.9, w: 0.55, h: 0.45, line: { color: HEX.muted, width: 1.5, dashType: 'dash', endArrowType: 'triangle' }, objectName: 'bog-tolov' });
  card(s, 0.55, 3.35, 2.6, 1.6, C.background2, 'kod-tuzilishi');
  txt(s, 'Kod tuzilishi', { x: 0.7, y: 3.47, w: 2.3, h: 0.3, fontSize: 14, bold: true, color: C.text2 });
  txt(s, "client/ — sayt\nserver/ — API, bot, testlar\npresentation/ — shu taqdimot", { x: 0.7, y: 3.82, w: 2.3, h: 1.0, fontSize: 12, color: C.text1 });
}

/* 33. Xavfsizlik va sifat */
{
  const s = slide('LIGHT', E, "Sifat va xavfsizlikka alohida e'tibor berdik. Kodni auditdan o'tkazib jiddiy xatolarni topdik va tuzatdik: NoSQL in'ektsiyasi, ikki marta bron va ikki marta to'lash poygasi, productionda demo akkauntlar. Server uchun 11 ta avtomatik test yozilgan va hammasi o'tadi. Server bog'liqliklarida zaiflik yo'q, klientda react-router bo'yicha ikkita o'rtacha ogohlantirish bor, xavfi past.");
  s.addText('Xavfsizlik va sifat', { placeholder: 'title' });
  const stats = [['11/11', "avtomatik test o'tdi"], ['0', 'server zaifliklari (npm audit)'], ['3', "audit topgan jiddiy xato tuzatildi"]];
  for (const [i, [big, cap]] of stats.entries()) {
    const y = 1.3 + i * 1.22;
    card(s, 0.55, y, 3.1, 1.08, C.accent1, `stat-${i + 1}`);
    txt(s, big, { x: 0.7, y, w: 1.4, h: 1.08, fontSize: 36, bold: true, color: C.accent2, valign: 'middle' });
    txt(s, cap, { x: 2.1, y, w: 1.45, h: 1.08, fontSize: 12, color: C.background1, valign: 'middle' });
  }
  bullets(s, [
    "Parollar bcrypt bilan, kirish JWT bilan; Helmet va tezlik cheklovi",
    "Kiruvchi ma'lumotlar Zod bilan tekshiriladi; huquqlar serverda",
    "NoSQL in'ektsiyasiga qarshi himoya (testda tekshirilgan)",
    "Ikki marta bron va to'lash: noyob indeks va atomik holat o'tishlari",
    "CSV eksportda Excel formulasi in'ektsiyasidan himoya",
    "Productionda demo ma'lumot va standart parol taqiqlangan",
    "Admin harakatlari jurnali, bloklash, ro'yxatdan o'tishni yopish",
  ], { x: 4.0, y: 1.3, w: 5.45, h: 3.7, fontSize: 15, gap: 9 });
}

/* 34. Biznes model */
{
  const s = slide('LIGHT', F, "Asosiy daromad — har bir to'lovdan komissiya, hozir 10 foiz, admin paneldan o'zgartiriladi. Talaba uchun bepul. Keyingi bosqichlarda katalogda yuqori joylashuv uchun reklama va talabalar uchun obuna. Bozor hajmini, ya'ni TAM, SAM va SOM ni, pilot so'rovnomasi natijasidan hisoblaymiz: kalkulyator admin panelda tayyor, shuning uchun hozir taxminiy raqam keltirmayman.");
  s.addText('Biznes model', { placeholder: 'title' });
  const items = [
    ['FiPercent', 'Komissiya', "Har bir to'lovdan platforma ulushi. Hozir 10%, admin sozlaydi.", 'Hozir ishlaydi', C.accent1],
    ['FiTrendingUp', 'Premium joylashuv', "Repetitor yoki o'quv markazi katalogda yuqorida ko'rinadi.", 'Reja', C.accent5],
    ['FiRepeat', 'Obuna', "Talabalar uchun qo'shimcha materiallar va chegirmalar.", 'Keyinroq', C.accent5],
  ];
  for (const [i, [ic, head, text, tag, col]] of items.entries()) {
    const x = 0.55 + i * 3.0;
    card(s, x, 1.3, 2.85, 2.3, C.background2, `daromad-${i + 1}`);
    await badge(s, ic, x + 0.2, 1.48, 0.55, col);
    txt(s, tag, { x: x + 1.0, y: 1.6, w: 1.7, h: 0.3, fontSize: 12, bold: true, color: col, align: 'right' });
    txt(s, head, { x: x + 0.2, y: 2.2, w: 2.5, h: 0.35, fontSize: 16, bold: true, color: C.text2 });
    txt(s, text, { x: x + 0.2, y: 2.6, w: 2.5, h: 0.9, fontSize: 12, color: C.text1 });
  }
  card(s, 0.55, 3.85, 8.9, 1.15, C.accent1, 'bozor');
  await badge(s, 'FiTarget', 0.8, 4.1, 0.65, C.accent2, HEX.dk);
  txt(s, "Bozor hajmi pilotdan keyin hisoblanadi", { x: 1.7, y: 4.0, w: 7.6, h: 0.3, fontSize: 15, bold: true, color: C.background1 });
  txt(s, "TAM/SAM/SOM kalkulyatori admin panelda tayyor: u so'rovnomadagi o'rtacha oylik byudjetdan foydalanadi. Taxminiy raqamni rasmiy manba (stat.uz) bilan tekshirish kerak.", { x: 1.7, y: 4.32, w: 7.6, h: 0.65, fontSize: 12, color: C.background2 });
}

/* 35. Pilot rejasi */
{
  const s = slide('LIGHT', F, "Pilot — UWEDda to'rt hafta. Maqsad — talabalar haqiqatan foydalanishini va pul to'lashga tayyorligini tekshirish. Beshta qadam: repetitorlarni jalb qilish, kontentni to'ldirish, talabalarni jalb qilish, ma'muriyat bilan kelishish va natijalarni tahlil qilish. Maqsadli ko'rsatkichlar: 30 dan 50 gacha bron, 8 dan 10 gacha repetitor, o'rtacha baho 4 dan yuqori. Hammasi admin panelda avtomatik o'lchanadi.");
  s.addText('Pilot: 4 hafta, UWEDda', { placeholder: 'title' });
  const steps = [
    ['Repetitorlar', "Yuqori kurs talabalaridan 8–10 nafar, anketa orqali"],
    ['Kontent', "Fanlar, rasmiy nazorat sanalari, birinchi materiallar, Telegram guruhlar"],
    ['Talabalar', "Guruh chatlari, fakultet kanallari, talabalar ittifoqi; birinchi darsga chegirma"],
    ["Qo'llab-quvvatlash", "Universitet ma'muriyati va kurs o'qituvchisi bilan kelishuv"],
    ['Tahlil', "4 hafta oxirida ko'rsatkichlarni hisoblash va g'oyani qayta ko'rish"],
  ];
  for (const [i, [head, text]] of steps.entries()) {
    const y = 1.2 + i * 0.72;
    s.addShape(pres.ShapeType.ellipse, { x: 0.55, y: y + 0.04, w: 0.5, h: 0.5, fill: { color: C.accent1 }, line: { color: C.accent1, width: 0 }, objectName: `qadam-${i + 1}` });
    txt(s, String(i + 1), { x: 0.55, y: y + 0.04, w: 0.5, h: 0.5, fontSize: 16, bold: true, color: C.background1, align: 'center', valign: 'middle' });
    txt(s, head, { x: 1.2, y, w: 3.4, h: 0.28, fontSize: 14, bold: true, color: C.text2 });
    txt(s, text, { x: 1.2, y: y + 0.28, w: 3.5, h: 0.42, fontSize: 11, color: C.accent5 });
  }
  const kpis = [['30–50', 'bron (darsga yozilganlar)'], ['8–10', 'repetitor'], ['4+', "o'rtacha baho (1–5)"]];
  for (const [i, [big, cap]] of kpis.entries()) {
    const y = 1.2 + i * 1.1;
    card(s, 5.2, y, 4.25, 0.96, C.accent1, `kpi-${i + 1}`);
    txt(s, big, { x: 5.4, y, w: 1.8, h: 0.96, fontSize: 32, bold: true, color: C.accent2, valign: 'middle' });
    txt(s, cap, { x: 7.2, y, w: 2.1, h: 0.96, fontSize: 13, color: C.background1, valign: 'middle' });
  }
  txt(s, "Tashrif, konversiya va qayta dars ko'rsatkichlari admin panelda avtomatik hisoblanadi.", { x: 5.2, y: 4.5, w: 4.25, h: 0.5, fontSize: 12, color: C.accent5 });
}

/* 36. Holat va yo'l xaritasi */
{
  const s = slide('LIGHT', F, "Hozirgi holat: sayt, admin panel, Telegram orqali kirish, bron, baho, uch til va testlar tayyor. Pilotdan oldin bajarilishi shart: bot tokeni, haqiqiy kontent, joylashtirish va HTTPS, yuridik hujjatlar, git, profil sahifasi. Pilotdan keyin: Click va Payme, bronni ko'chirish, repetitor daromad kabineti, webhook va admin rollari. Click va Payme uchun merchant shartnomasi eng uzoq qism, shuning uchun arizani hoziroq berish kerak.");
  s.addText("Hozirgi holat va yo'l xaritasi", { placeholder: 'title' });
  const cols = [
    ['FiCheckCircle', 'Tayyor', C.accent1, ["Sayt va 12 bo'limli admin panel", "Telegram orqali kirish va xabarlar", "Bron, to'lov oqimi (mock), baho", "Uch til, mobil maket", "11 ta avtomatik test"]],
    ['FiFlag', 'Pilotdan oldin', C.accent3, ["Bot tokeni va haqiqiy kontent", "Joylashtirish, HTTPS, zaxira nusxa", "Oferta va maxfiylik siyosati", "Git va profil sahifasi", "Click/Payme'ga ariza berish"]],
    ['FiMap', 'Pilotdan keyin', C.accent5, ["Click va Payme integratsiyasi", "Bronni ko'chirish", "Repetitor daromad kabineti", "Webhook va admin rollari", "Boshqa universitetlar"]],
  ];
  for (const [i, [ic, head, col, list]] of cols.entries()) {
    const x = 0.55 + i * 3.0;
    card(s, x, 1.25, 2.85, 3.5, C.background2, `reja-${head}`);
    await badge(s, ic, x + 0.2, 1.42, 0.5, col);
    txt(s, head, { x: x + 0.85, y: 1.42, w: 1.9, h: 0.5, fontSize: 16, bold: true, color: C.text2, valign: 'middle' });
    bullets(s, list, { x: x + 0.2, y: 2.15, w: 2.5, h: 2.55, fontSize: 13, gap: 7 });
  }
}

/* 37. Xulosa */
{
  const s = slide('DARK', F, "Xulosa. UWEDRepo talabalar uchun tarqoq resurslar muammosini bitta platformada hal qiladi: kursga moslashtirilgan katalog, ochiq narx, halol sharhlar, qulay bron va to'lov. Texnik asos tayyor, keyingi qadam — pilot. Savollaringiz bo'lsa, javob beraman.");
  dark(s);
  s.addText('Xulosa', { placeholder: 'title' });
  const pts = [
    ['FiAlertTriangle', 'Muammo', "Talabalar uchun ta'lim resurslari tarqoq, ishonchsiz va narxi yopiq."],
    ['FiCheckCircle', 'Yechim', "Kursga moslashtirilgan bozor: ochiq narx, halol sharhlar, platforma ichida bron."],
    ['FiPlay', 'Holat', "Sayt va admin panel tayyor; keyingi qadam — UWEDda 4 haftalik pilot."],
  ];
  for (const [i, [ic, head, text]] of pts.entries()) {
    const y = 1.6 + i * 0.95;
    await badge(s, ic, 0.55, y, 0.6, C.accent2, HEX.dk);
    txt(s, head, { x: 1.4, y: y - 0.02, w: 2, h: 0.32, fontSize: 16, bold: true, color: C.accent2 });
    txt(s, text, { x: 1.4, y: y + 0.3, w: 7.8, h: 0.5, fontSize: 15, color: C.background1 });
  }
  txt(s, "Rahmat! Savollar?", { x: 0.5, y: 4.6, w: 6, h: 0.5, fontSize: 24, bold: true, color: C.background1 });
}

await pres.writeFile({ fileName: OUT });
await applyTheme(OUT, THEME);
console.log(`yozildi: ${OUT} (${n} slayd)`);
