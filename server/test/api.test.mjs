// `npm test` — vaqtinchalik (xotiradagi) MongoDB'da butun API ni tekshiradi; haqiqiy bazaga tegmaydi
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import bcrypt from 'bcryptjs';

let mem, server, base, M, signToken;
const api = async (method, path, body, token) => {
  const r = await fetch(base + path, { method, headers: { 'Content-Type': 'application/json', ...(token && { Authorization: `Bearer ${token}` }) }, body: body && JSON.stringify(body) });
  const ct = r.headers.get('content-type') || '';
  // fetch().text() BOM ni olib tashlaydi; CSV ni xom baytlardan o'qiymiz
  return { s: r.status, j: ct.includes('json') ? await r.json() : Buffer.from(await r.arrayBuffer()).toString('utf8'), ct };
};
const fx = {};
const settings = (over = {}) => ({ commission: 10, firstLessonDiscount: 20, cancelHours: 24, registrationOpen: true, banner: { text: '', kind: 'info', active: false }, ...over });

before(async () => {
  const { MongoMemoryServer } = await import('mongodb-memory-server');
  mem = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mem.getUri('test');
  process.env.NODE_ENV = 'test';
  process.env.TELEGRAM_BOT_TOKEN = 'TEST:TOKEN'; // faqat webhook sarlavhasini tekshirish uchun; bot ishga tushirilmaydi
  const { connectDb } = await import('../src/db.js');
  await connectDb();
  M = await import('../src/models/index.js');
  ({ signToken } = await import('../src/middleware/auth.js'));
  await (await import('../src/settings.js')).loadSettings();
  const { createApp } = await import('../src/app.js');
  server = createApp().listen(0);
  base = `http://127.0.0.1:${server.address().port}/api`;

  const mk = (name, extra = {}) => M.User.create({ name, ...extra });
  fx.admin = await mk('Admin', { email: 'a@t.uz', password: await bcrypt.hash('Passw0rd-long', 10), role: 'admin' });
  fx.studentA = await mk('Talaba A', { telegramId: '1001', telegram: '@a' });
  fx.studentB = await mk('Talaba B', { telegramId: '1002' });
  fx.evil = await mk('=HYPERLINK("x")', { telegramId: '1003' });
  fx.tutorUser = await mk('Repetitor', { telegramId: '1004', role: 'tutor' });
  fx.subject = await M.Subject.create({ name: 'Fan', faculty: 'xim', years: [1] });
  const day = (d) => ({ day: d, from: '10:00', to: '20:00' });
  fx.tutor = await M.Tutor.create({
    user: fx.tutorUser._id, subjects: [fx.subject._id], headline: 'Sinov repetitori', pricePerHour: 100000, status: 'approved',
    availability: [0, 1, 2, 3, 4, 5, 6].map(day),
  });
  fx.t = Object.fromEntries(Object.entries({ admin: fx.admin, a: fx.studentA, b: fx.studentB, tutor: fx.tutorUser }).map(([k, u]) => [k, signToken(u)]));
});

after(async () => {
  server?.close();
  await (await import('mongoose')).default.disconnect();
  await mem?.stop();
});

const slot = async (i = 0) => (await api('GET', `/tutors/${fx.tutor._id}/slots`)).j[i];
const book = (token, startsAt) => api('POST', '/bookings', { tutor: String(fx.tutor._id), subject: String(fx.subject._id), startsAt }, token);

test("admin yo'llari faqat adminga", async () => {
  assert.equal((await api('GET', '/admin/overview')).s, 401);
  assert.equal((await api('GET', '/admin/overview', null, fx.t.a)).s, 403);
  const r = await api('GET', '/admin/overview', null, fx.t.admin);
  assert.equal(r.s, 200);
  assert.equal(r.j.series.visits.length, 30);
  assert.ok(Array.isArray(r.j.checklist) && r.j.checklist.length >= 8);
});

test("/auth/me va Telegram holat so'rovi tezlik cheklovidan chiqmaydi (foydalanuvchi tizimdan tushib ketmasin)", async () => {
  for (let i = 0; i < 90; i++) {
    const me = await api('GET', '/auth/me', null, fx.t.a);
    if (me.s !== 200) assert.fail(`${i}-so'rovda /auth/me ${me.s} qaytardi`);
  }
  for (let i = 0; i < 90; i++) {
    const st = await api('GET', '/auth/telegram/status/aaaaaaaaaaaaaaaaaaaa');
    if (st.s !== 200) assert.fail(`${i}-so'rovda status ${st.s} qaytardi`);
  }
});

test("NoSQL operator in'ektsiyasi ishlamaydi (?subject[$ne]=x)", async () => {
  const all = await api('GET', '/tutors');
  const inj = await api('GET', '/tutors?subject[$ne]=x');
  assert.equal(inj.s, 200);
  assert.equal(inj.j.length, all.j.length);
});

test("bir vaqtdagi ikki bron: faqat bittasi o'tadi", async () => {
  const s = await slot(3);
  const [x, y] = await Promise.all([book(fx.t.a, s), book(fx.t.b, s)]);
  assert.deepEqual([x.s, y.s].sort(), [201, 409]);
  const winner = x.s === 201 ? x.j : y.j;
  await M.Booking.updateOne({ _id: winner._id }, { status: 'cancelled' });
});

test("to'liq oqim: bron, tasdiq, to'lov (ikki marta bosish), admin 'dars o'tdi', hisob, o'tkazish", async () => {
  const b = (await book(fx.t.a, await slot(5))).j;
  assert.equal(b.discount, 20000, 'birinchi dars chegirmasi 20%');
  assert.equal((await api('PATCH', `/bookings/${b._id}/confirm`, null, fx.t.tutor)).s, 200);
  const [p1, p2] = await Promise.all([api('POST', `/bookings/${b._id}/pay`, { method: 'click' }, fx.t.a), api('POST', `/bookings/${b._id}/pay`, { method: 'click' }, fx.t.a)]);
  assert.deepEqual([p1.s, p2.s].sort(), [200, 409], "ikki marta to'lab bo'lmaydi");
  assert.equal((await api('POST', `/admin/bookings/${b._id}/complete`, null, fx.t.admin)).s, 200);

  const pay = (await api('GET', '/admin/payouts', null, fx.t.admin)).j.find((x) => x.name === 'Repetitor');
  assert.equal(pay.owed, 72000, "80 000 so'mning 90% i repetitorga");
  const settle = await api('POST', `/admin/payouts/${fx.tutor._id}/settle`, null, fx.t.admin);
  assert.equal(settle.j.sum, 72000);
  const fin = (await api('GET', '/admin/finance', null, fx.t.admin)).j;
  assert.equal(fin.totals.owed, 0);
  assert.equal(fin.totals.paidOut, 72000);
  fx.completed = b;
});

test('sharh: yashirilsa reyting qayta hisoblanadi', async () => {
  const rv = await api('POST', `/bookings/${fx.completed._id}/review`, { rating: 5, comment: "zo'r" }, fx.t.a);
  assert.equal(rv.s, 201);
  assert.equal((await M.Tutor.findById(fx.tutor._id)).ratingAvg, 5);
  await api('PATCH', `/admin/reviews/${rv.j._id}`, { hidden: true }, fx.t.admin);
  const t = await M.Tutor.findById(fx.tutor._id);
  assert.equal(t.ratingCount, 0);
  const pub = await api('GET', `/tutors/${fx.tutor._id}`);
  assert.equal(pub.j.reviews.length, 0, "yashirin sharh ommaviy ko'rinmaydi");
});

test("bloklangan foydalanuvchi kira olmaydi; o'zini bloklab bo'lmaydi", async () => {
  assert.equal((await api('PATCH', `/admin/users/${fx.studentB._id}`, { blocked: true }, fx.t.admin)).s, 200);
  assert.equal((await api('GET', '/bookings/mine', null, fx.t.b)).s, 403);
  await api('PATCH', `/admin/users/${fx.studentB._id}`, { blocked: false }, fx.t.admin);
  assert.equal((await api('GET', '/bookings/mine', null, fx.t.b)).s, 200);
  assert.equal((await api('PATCH', `/admin/users/${fx.admin._id}`, { blocked: true }, fx.t.admin)).s, 400);
  assert.equal((await api('PATCH', `/admin/users/${fx.admin._id}`, { role: 'student' }, fx.t.admin)).s, 400);
});

test("sozlamalar narxga va /meta ga ta'sir qiladi", async () => {
  const put = await api('PUT', '/admin/settings', settings({ commission: 20, firstLessonDiscount: 0, cancelHours: 12, banner: { text: 'Pilot!', kind: 'warn', active: true } }), fx.t.admin);
  assert.equal(put.s, 200);
  const meta = (await api('GET', '/meta')).j;
  assert.equal(meta.commission, 20);
  assert.equal(meta.banner.text, 'Pilot!');
  const b = (await book(fx.t.b, await slot(7))).j;
  assert.equal(b.discount, 0);
  assert.equal(b.commission, 20000);
  assert.equal((await api('PUT', '/admin/settings', settings({ commission: 90 }), fx.t.admin)).s, 400, 'komissiya 50% dan oshmasin');

  await api('PUT', '/admin/settings', settings({ registrationOpen: false }), fx.t.admin);
  const reg = await api('POST', '/auth/register', { name: 'Yangi', email: 'y@t.uz', password: 'longpassword1' });
  assert.equal(reg.s, 403, "ro'yxatdan o'tish yopiq");
  await api('PUT', '/admin/settings', settings(), fx.t.admin);
});

test("e'lon: bot ulanmagan bo'lsa 503", async () => {
  const r = await api('POST', '/admin/announcements', { text: 'Salom hammaga', audience: 'all' }, fx.t.admin);
  assert.equal(r.s, 503);
});

test('CSV eksport: Excel formulasidan himoya', async () => {
  const r = await api('GET', '/admin/export/users.csv', null, fx.t.admin);
  assert.equal(r.s, 200);
  assert.match(r.ct, /text\/csv/);
  assert.ok(r.j.startsWith('﻿'));
  assert.ok(r.j.includes("'=HYPERLINK"), "formula boshiga apostrof qo'yiladi");
});

test('faoliyat jurnali admin harakatlarini yozadi', async () => {
  await new Promise((ok) => setTimeout(ok, 200));
  const r = await api('GET', '/admin/audit', null, fx.t.admin);
  const actions = r.j.items.map((x) => x.action);
  for (const a of ['user.block', 'booking.complete', 'payout.settle', 'settings.update', 'review.hide']) assert.ok(actions.includes(a), `${a} jurnalda yo'q`);
});

test('parolni almashtirish', async () => {
  assert.equal((await api('POST', '/admin/me/password', { current: 'xato-parol', next: 'yangi-uzun-parol1' }, fx.t.admin)).s, 400);
  assert.equal((await api('POST', '/admin/me/password', { current: 'Passw0rd-long', next: 'qisqa' }, fx.t.admin)).s, 400);
  assert.equal((await api('POST', '/admin/me/password', { current: 'Passw0rd-long', next: 'yangi-uzun-parol1' }, fx.t.admin)).s, 200);
  assert.equal((await api('POST', '/auth/login', { email: 'a@t.uz', password: 'yangi-uzun-parol1' })).s, 200);
});

test("Telegram webhook: maxfiy sarlavhasiz so'rov rad etiladi", async () => {
  const { webhookSecret } = await import('../src/telegram.js');
  const call = (headers) => fetch(`${base}/telegram/webhook`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify({ update_id: 1 }) });
  assert.equal((await call({})).status, 403, 'sarlavhasiz');
  assert.equal((await call({ 'X-Telegram-Bot-Api-Secret-Token': 'xato' })).status, 403, "noto'g'ri sarlavha");
  assert.equal((await call({ 'X-Telegram-Bot-Api-Secret-Token': webhookSecret() })).status, 200, "to'g'ri sarlavha");
  assert.match(webhookSecret(), /^[a-f0-9]{64}$/, "Telegram talab qiladigan belgilar: faqat hex");
});

test("production sayti: SPA yo'llari beriladi, CSP sozlangan, API 404 JSON", async () => {
  const r = await fetch(base.replace('/api', '') + '/admin'); // client/dist mavjud bo'lsa SPA qaytadi
  const csp = r.headers.get('content-security-policy') || '';
  assert.ok(csp.includes("script-src 'self'") && csp.includes('fonts.googleapis.com'), 'CSP sozlangan');
  const api404 = await fetch(`${base}/yoq-yol`);
  assert.equal(api404.status, 404);
  assert.match(api404.headers.get('content-type'), /json/);
});
