// `npm test` — vaqtinchalik (xotiradagi) MongoDB'da butun API ni tekshiradi; haqiqiy bazaga tegmaydi
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import bcrypt from 'bcryptjs';

let mem, server, base, M, signToken, aiMock;
const aiCalls = [];
const tgCalls = [];
const api = async (method, path, body, token) => {
  const r = await fetch(base + path, { method, headers: { 'Content-Type': 'application/json', ...(token && { Authorization: `Bearer ${token}` }) }, body: body && JSON.stringify(body) });
  const ct = r.headers.get('content-type') || '';
  // fetch().text() BOM ni olib tashlaydi; CSV ni xom baytlardan o'qiymiz
  return { s: r.status, j: ct.includes('json') ? await r.json() : Buffer.from(await r.arrayBuffer()).toString('utf8'), ct };
};
const fx = {};
const settings = (over = {}) => ({ commission: 10, firstLessonDiscount: 20, cancelHours: 24, registrationOpen: true, banner: { text: '', kind: 'info', active: false }, aiEnabled: true, aiDailyLimit: 10, telegramReminders: true, ...over });

before(async () => {
  const { MongoMemoryServer } = await import('mongodb-memory-server');
  mem = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mem.getUri('test');
  process.env.NODE_ENV = 'test';
  process.env.TELEGRAM_BOT_TOKEN = 'TEST:TOKEN'; // faqat webhook sarlavhasini tekshirish uchun; bot ishga tushirilmaydi
  // Soxta Anthropic API: haqiqiy AI'ga so'rov ketmaydi
  const http = await import('node:http');
  aiMock = http.createServer((req, res) => {
    let b = '';
    req.on('data', (c) => { b += c; });
    req.on('end', () => {
      res.setHeader('content-type', 'application/json');
      if (req.url.startsWith('/bot')) { tgCalls.push(JSON.parse(b || '{}')); return res.end(JSON.stringify({ ok: true, result: {} })); }
      aiCalls.push({ key: req.headers['x-api-key'], body: JSON.parse(b) });
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ content: [{ type: 'text', text: 'Sinov izohi' }] }));
    });
  }).listen(0);
  process.env.ANTHROPIC_API_KEY = 'test-key';
  process.env.ANTHROPIC_API_URL = `http://127.0.0.1:${aiMock.address().port}`;
  process.env.TELEGRAM_API_URL = `http://127.0.0.1:${aiMock.address().port}`; // Telegram ham soxta serverga
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
  aiMock?.close();
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
  assert.equal((await api('POST', `/bookings/${b._id}/checkout`, { provider: 'click' }, fx.t.a)).s, 409, 'tasdiqlanmagan bron uchun to\'lov yo\'q');
  assert.equal((await api('PATCH', `/bookings/${b._id}/confirm`, null, fx.t.tutor)).s, 200);
  const co = await api('POST', `/bookings/${b._id}/checkout`, { provider: 'click' }, fx.t.a);
  assert.equal(co.s, 201);
  assert.equal(co.j.mode, 'demo', 'kalitlarsiz — sinov rejimi');
  assert.equal(co.j.url, `/pay/${co.j.payment}`);
  assert.equal((await api('GET', `/payments/${co.j.payment}`, null, fx.t.b)).s, 404, "boshqa talaba to'lovni ko'rmaydi");
  const view = await api('GET', `/payments/${co.j.payment}`, null, fx.t.a);
  assert.equal(view.j.amount, 80000);
  assert.equal(view.j.booking.subject.name, 'Fan');
  const [p1, p2] = await Promise.all([api('POST', `/payments/${co.j.payment}/demo/confirm`, null, fx.t.a), api('POST', `/payments/${co.j.payment}/demo/confirm`, null, fx.t.a)]);
  assert.deepEqual([p1.s, p2.s].sort(), [200, 409], "ikki marta to'lab bo'lmaydi");
  const paid = await M.Booking.findById(b._id);
  assert.equal(paid.status, 'paid');
  assert.equal(paid.paymentMethod, 'click');
  assert.equal(paid.paymentTest, true, "sinov to'lovi belgilanadi");
  assert.equal((await api('POST', `/bookings/${b._id}/checkout`, { provider: 'payme' }, fx.t.a)).s, 409, "to'langan bron qayta to'lanmaydi");
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

test("sinov to'lovi: bekor qilish; bron rad etilsa ochiq to'lov yopiladi", async () => {
  const meta = (await api('GET', '/meta')).j;
  assert.equal(meta.payment.mode, 'demo');
  assert.deepEqual(meta.payment.providers, ['payme', 'click']);
  const b = (await book(fx.t.a, await slot(16))).j;
  await api('PATCH', `/bookings/${b._id}/confirm`, null, fx.t.tutor);
  const co = (await api('POST', `/bookings/${b._id}/checkout`, { provider: 'payme' }, fx.t.a)).j;
  assert.equal((await api('POST', `/payments/${co.payment}/demo/cancel`, null, fx.t.a)).j.status, 'cancelled');
  assert.equal((await api('POST', `/payments/${co.payment}/demo/confirm`, null, fx.t.a)).s, 409, "bekor qilingan to'lov tasdiqlanmaydi");
  const co2 = (await api('POST', `/bookings/${b._id}/checkout`, { provider: 'click' }, fx.t.a)).j;
  assert.equal((await api('PATCH', `/bookings/${b._id}/reject`, null, fx.t.tutor)).s, 200);
  assert.equal((await M.Payment.findById(co2.payment)).status, 'cancelled');
  assert.equal((await api('POST', `/payments/${co2.payment}/demo/confirm`, null, fx.t.a)).s, 409);
  assert.equal((await M.Booking.findById(b._id)).status, 'cancelled');
});

test("Payme Merchant API: tekshiruv, yaratish, bajarish, hisobot, qaytarish, muddat o'tishi", async () => {
  const env = { PAYMENT_MODE: 'live', PAYME_MERCHANT_ID: 'mid-test', PAYME_KEY: 'sinov:kalit#1?&', PAYME_MXIK: '10305001001000000', PAYME_PACKAGE_CODE: '1501876' };
  Object.assign(process.env, env);
  const rpc = (method, params, key = env.PAYME_KEY) =>
    fetch(`${base}/payments/payme`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Basic ${Buffer.from(`Paycom:${key}`).toString('base64')}` },
      body: JSON.stringify({ id: 7, method, params }),
    }).then(async (r) => ({ s: r.status, j: await r.json() }));
  try {
    const b = (await book(fx.t.a, await slot(10))).j;
    await api('PATCH', `/bookings/${b._id}/confirm`, null, fx.t.tutor);
    assert.equal((await api('POST', `/bookings/${b._id}/checkout`, { provider: 'click' }, fx.t.a)).s, 503, 'Click kaliti yo\'q');
    const co = await api('POST', `/bookings/${b._id}/checkout`, { provider: 'payme' }, fx.t.a);
    assert.equal(co.s, 201);
    assert.equal(co.j.mode, 'live');
    assert.ok(co.j.url.startsWith('https://checkout.paycom.uz/'));
    const order_id = String(co.j.payment);
    const amount = b.total * 100;
    const decoded = Buffer.from(co.j.url.split('/').pop(), 'base64').toString();
    assert.ok(decoded.startsWith(`m=mid-test;ac.order_id=${order_id};a=${amount};`), decoded);

    const bad = await rpc('CheckPerformTransaction', { amount, account: { order_id } }, 'notogri');
    assert.equal(bad.s, 200);
    assert.equal(bad.j.error.code, -32504);
    assert.equal(bad.j.id, 7);
    const broken = await fetch(`${base}/payments/payme`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{buzilgan' });
    assert.equal(broken.status, 200);
    assert.equal((await broken.json()).error.code, -32700);
    assert.equal((await rpc('Yoq', {})).j.error.code, -32601);
    assert.equal((await rpc('CheckPerformTransaction', { amount: amount + 100, account: { order_id } })).j.error.code, -31001);
    const missing = await rpc('CheckPerformTransaction', { amount, account: { order_id: '000000000000000000000000' } });
    assert.equal(missing.j.error.code, -31050);
    assert.equal(missing.j.error.data, 'order_id');
    const check = await rpc('CheckPerformTransaction', { amount, account: { order_id } });
    assert.equal(check.j.result.allow, true);
    assert.equal(check.j.result.detail.items[0].code, env.PAYME_MXIK);
    assert.equal(check.j.result.detail.items[0].price, amount);

    const t0 = Date.now();
    const cr = await rpc('CreateTransaction', { id: 'payme-tx-1', time: t0, amount, account: { order_id } });
    assert.equal(cr.j.result.state, 1);
    assert.equal(cr.j.result.transaction, order_id);
    const again = await rpc('CreateTransaction', { id: 'payme-tx-1', time: t0, amount, account: { order_id } });
    assert.equal(again.j.result.create_time, cr.j.result.create_time, 'takroriy yaratish — o\'sha javob');
    assert.equal((await rpc('CreateTransaction', { id: 'payme-tx-2', time: t0, amount, account: { order_id } })).j.error.code, -31052, 'buyurtma band');
    assert.equal((await rpc('CheckPerformTransaction', { amount, account: { order_id } })).j.error.code, -31052);

    const pf = await rpc('PerformTransaction', { id: 'payme-tx-1' });
    assert.equal(pf.j.result.state, 2);
    assert.equal((await rpc('PerformTransaction', { id: 'payme-tx-1' })).j.result.perform_time, pf.j.result.perform_time);
    assert.equal((await rpc('PerformTransaction', { id: 'yoq' })).j.error.code, -31003);
    const bk = await M.Booking.findById(b._id);
    assert.equal(bk.status, 'paid');
    assert.equal(bk.paymentMethod, 'payme');
    assert.equal(bk.paymentTest, false);
    assert.equal((await api('POST', `/payments/${order_id}/demo/confirm`, null, fx.t.a)).s, 409, 'haqiqiy to\'lovda sinov tasdig\'i yo\'q');

    const ct = await rpc('CheckTransaction', { id: 'payme-tx-1' });
    assert.equal(ct.j.result.state, 2);
    assert.equal(ct.j.result.cancel_time, 0);
    const stm = await rpc('GetStatement', { from: t0 - 1000, to: Date.now() + 1000 });
    assert.ok(stm.j.result.transactions.some((x) => x.id === 'payme-tx-1' && x.amount === amount && x.account.order_id === order_id));

    const cn = await rpc('CancelTransaction', { id: 'payme-tx-1', reason: 5 });
    assert.equal(cn.j.result.state, -2);
    const after = await M.Booking.findById(b._id);
    assert.equal(after.status, 'cancelled');
    assert.equal(after.refunded, true);
    assert.equal((await rpc('CheckTransaction', { id: 'payme-tx-1' })).j.result.reason, 5);
    assert.equal((await rpc('CancelTransaction', { id: 'payme-tx-1', reason: 5 })).j.result.cancel_time, cn.j.result.cancel_time, 'takroriy bekor qilish');

    // 12 soatda bajarilmagan tranzaksiya bekor qilinadi
    const b2 = (await book(fx.t.a, await slot(12))).j;
    await api('PATCH', `/bookings/${b2._id}/confirm`, null, fx.t.tutor);
    const co2 = (await api('POST', `/bookings/${b2._id}/checkout`, { provider: 'payme' }, fx.t.a)).j;
    await rpc('CreateTransaction', { id: 'payme-tx-3', time: Date.now(), amount: b2.total * 100, account: { order_id: String(co2.payment) } });
    await M.Payment.updateOne({ extId: 'payme-tx-3' }, { $set: { createTime: Date.now() - 13 * 3600e3 } });
    assert.equal((await rpc('PerformTransaction', { id: 'payme-tx-3' })).j.error.code, -31008);
    const exp = (await rpc('CheckTransaction', { id: 'payme-tx-3' })).j.result;
    assert.equal(exp.state, -1);
    assert.equal(exp.reason, 4);
    assert.equal((await M.Booking.findById(b2._id)).status, 'confirmed', "bron ochiq qoladi: talaba qayta to'lashi mumkin");
  } finally {
    for (const k of Object.keys(env)) delete process.env[k];
  }
});

test('Click Shop API: imzo, summa, prepare/complete, takroriy so\'rov', async () => {
  const env = { PAYMENT_MODE: 'live', CLICK_SERVICE_ID: '777', CLICK_MERCHANT_ID: '888', CLICK_SECRET_KEY: 'click-sinov-siri' };
  Object.assign(process.env, env);
  const crypto = await import('node:crypto');
  const md5 = (x) => crypto.createHash('md5').update(x).digest('hex');
  const sign = (x, prep = '') => md5(`${x.click_trans_id}${x.service_id}${env.CLICK_SECRET_KEY}${x.merchant_trans_id}${prep}${x.amount}${x.action}${x.sign_time}`);
  const post = (path, form) =>
    fetch(`${base}/payments/click/${path}`, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams(form).toString() }).then((r) => r.json());
  try {
    const b = (await book(fx.t.b, await slot(14))).j;
    await api('PATCH', `/bookings/${b._id}/confirm`, null, fx.t.tutor);
    assert.equal((await api('POST', `/bookings/${b._id}/checkout`, { provider: 'payme' }, fx.t.b)).s, 503, 'Payme kaliti yo\'q');
    const co = (await api('POST', `/bookings/${b._id}/checkout`, { provider: 'click' }, fx.t.b)).j;
    const url = new URL(co.url);
    assert.equal(url.host, 'my.click.uz');
    assert.equal(url.searchParams.get('service_id'), '777');
    assert.equal(url.searchParams.get('transaction_param'), String(co.payment));

    const f = { click_trans_id: '5551', service_id: '777', click_paydoc_id: '1', merchant_trans_id: String(co.payment), amount: `${b.total}.00`, action: '0', error: '0', error_note: 'Success', sign_time: '2026-11-24 10:00:00' };
    assert.equal((await post('prepare', { ...f, sign_string: 'notogri' })).error, -1);
    const low = { ...f, amount: '1.00' };
    assert.equal((await post('prepare', { ...low, sign_string: sign(low) })).error, -2);
    const nobody = { ...f, merchant_trans_id: '000000000000000000000000' };
    assert.equal((await post('prepare', { ...nobody, sign_string: sign(nobody) })).error, -5);
    const prep = await post('prepare', { ...f, sign_string: sign(f) });
    assert.equal(prep.error, 0);
    assert.equal(prep.click_trans_id, 5551);
    assert.ok(prep.merchant_prepare_id > 0);

    const c = { ...f, action: '1', merchant_prepare_id: String(prep.merchant_prepare_id) };
    const wrong = { ...c, merchant_prepare_id: '1' };
    assert.equal((await post('complete', { ...wrong, sign_string: sign(wrong, '1') })).error, -6);
    const done = await post('complete', { ...c, sign_string: sign(c, c.merchant_prepare_id) });
    assert.equal(done.error, 0);
    assert.equal(done.merchant_confirm_id, prep.merchant_prepare_id);
    assert.equal((await post('complete', { ...c, sign_string: sign(c, c.merchant_prepare_id) })).error, -4, 'takroriy complete');
    const bk = await M.Booking.findById(b._id);
    assert.equal(bk.status, 'paid');
    assert.equal(bk.paymentMethod, 'click');
    assert.equal(bk.paymentTest, false);

    // Click to'lov amalga oshmaganini xabar qilsa — to'lov bekor, bron ochiq qoladi
    const b2 = (await book(fx.t.b, await slot(18))).j;
    await api('PATCH', `/bookings/${b2._id}/confirm`, null, fx.t.tutor);
    const co2 = (await api('POST', `/bookings/${b2._id}/checkout`, { provider: 'click' }, fx.t.b)).j;
    const f2 = { ...f, click_trans_id: '5552', merchant_trans_id: String(co2.payment), amount: `${b2.total}` };
    const prep2 = await post('prepare', { ...f2, sign_string: sign(f2) });
    const c2 = { ...f2, action: '1', error: '-5017', merchant_prepare_id: String(prep2.merchant_prepare_id) };
    assert.equal((await post('complete', { ...c2, sign_string: sign(c2, c2.merchant_prepare_id) })).error, -9);
    assert.equal((await M.Payment.findById(co2.payment)).status, 'cancelled');
    assert.equal((await M.Booking.findById(b2._id)).status, 'confirmed');
  } finally {
    for (const k of Object.keys(env)) delete process.env[k];
  }
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

test("fanlarni admin boshqaradi: ko'p qo'shish, takrorni o'tkazib yuborish, yashirish, namunaviy fanlar", async () => {
  const body = { names: ['  Mikroiqtisodiyot ', 'Makroiqtisodiyot', 'mikroiqtisodiyot', 'Statistika'], faculty: 'xm', years: [2, 3], category: 'core' };
  const add = await api('POST', '/admin/subjects/bulk', body, fx.t.admin);
  assert.equal(add.s, 201);
  assert.equal(add.j.added, 3, "takrorlangan nom (katta-kichik harf farqisiz) bir marta qo'shiladi");
  const again = await api('POST', '/admin/subjects/bulk', body, fx.t.admin);
  assert.equal(again.j.added, 0, 'qayta yuborilsa, hammasi o\'tkazib yuboriladi');
  assert.equal(again.j.skipped.length, 4, "yuborilgan 4 nomning hammasi allaqachon bor");

  assert.equal((await api('POST', '/admin/subjects/bulk', body, fx.t.a)).s, 403, 'talaba fan qo\'sha olmaydi');
  assert.equal((await api('POST', '/admin/subjects', { name: 'MIKROIQTISODIYOT', faculty: 'xm', years: [1] }, fx.t.admin)).s, 409, 'bitta qo\'shishda ham takror rad etiladi');

  // yashirish: talabaga ko'rinmaydi, adminda qoladi
  const all = (await api('GET', '/admin/subjects', null, fx.t.admin)).j;
  const target = all.find((s) => s.name === 'Statistika');
  assert.ok(target && target.active === true && target.tutors === 0);
  assert.equal((await api('PATCH', `/admin/subjects/${target._id}/active`, { active: false }, fx.t.admin)).s, 200);
  const pub = (await api('GET', '/subjects?faculty=xm&year=2')).j.map((s) => s.name);
  assert.ok(pub.includes('Mikroiqtisodiyot') && !pub.includes('Statistika'), 'yashirin fan ommaviy ro\'yxatda yo\'q');
  assert.equal((await api('GET', `/subjects/${target._id}`)).s, 404, 'yashirin fan sahifasi ochilmaydi');
  assert.equal((await api('GET', '/admin/subjects', null, fx.t.admin)).j.find((s) => s.name === 'Statistika').active, false, 'adminda ko\'rinadi');
  await api('PATCH', `/admin/subjects/${target._id}/active`, { active: true }, fx.t.admin);
  assert.equal((await api('GET', `/subjects/${target._id}`)).s, 200, 'qaytarilgach yana ochiladi');

  // namunaviy fanlar: faqat yo'qlari qo'shiladi, takror emas
  const st1 = await api('POST', '/admin/subjects/starter', null, fx.t.admin);
  const st2 = await api('POST', '/admin/subjects/starter', null, fx.t.admin);
  assert.equal(st1.s, 201);
  assert.equal(st2.j.added, 0);
});

test("mashq testi: repetitor tuzadi, admin tasdiqlaydi, talaba yechadi, javoblar oldindan ko'rinmaydi", async () => {
  const body = {
    subject: String(fx.subject._id), title: 'Sinov testi',
    questions: [
      { text: '2+2=?', options: ['3', '4', '5'], correct: 1, explanation: 'Oddiy qo\'shish' },
      { text: '3*3=?', options: ['9', '6'], correct: 0 },
    ],
  };
  assert.equal((await api('POST', '/quizzes', body, fx.t.a)).s, 403, 'oddiy talaba test tuza olmaydi');
  assert.equal((await api('POST', '/quizzes', { ...body, questions: [{ text: 'x', options: ['a', 'b'], correct: 3 }] }, fx.t.tutor)).s, 400, "to'g'ri javob variantlar ichida bo'lsin");
  const c = await api('POST', '/quizzes', body, fx.t.tutor);
  assert.equal(c.s, 201);
  assert.equal(c.j.status, 'pending');
  const id = c.j._id;
  assert.equal((await api('GET', `/quizzes/${id}`)).s, 404, 'tasdiqlanmagan test talabaga ko\'rinmaydi');
  assert.equal((await api('GET', `/quizzes/${id}`, null, fx.t.tutor)).s, 200, 'muallif o\'zinikini ko\'radi');

  assert.equal((await api('PATCH', `/admin/quizzes/${id}`, { status: 'approved' }, fx.t.admin)).s, 200);
  const pub = await api('GET', `/quizzes/${id}`);
  assert.equal(pub.s, 200);
  assert.equal(pub.j.questions[0].correct, undefined, "to'g'ri javob oldindan yuborilmaydi");
  assert.equal(pub.j.questions[0].explanation, undefined);
  assert.equal((await api('GET', `/subjects/${fx.subject._id}`)).j.quizzes.length, 1);

  const at = await api('POST', `/quizzes/${id}/attempt`, { answers: [0, 0] }, fx.t.a);
  assert.equal(at.s, 200);
  assert.equal(at.j.score, 1);
  assert.equal(at.j.results[0].ok, false);
  assert.equal(at.j.results[0].correct, 1);
  assert.equal(await M.QuizAttempt.countDocuments({ quiz: id }), 1);
  assert.equal((await api('POST', `/quizzes/${id}/attempt`, { answers: [1] })).j.score, 1, 'kirmagan ham yecha oladi, natija saqlanmaydi');
  assert.equal(await M.QuizAttempt.countDocuments({ quiz: id }), 1);

  // repetitor tahrirlasa test qayta tekshiruvga tushadi
  assert.equal((await api('PUT', `/quizzes/${id}`, body, fx.t.tutor)).j.status, 'pending');
  assert.equal((await api('PUT', `/quizzes/${id}`, body, fx.t.b)).s, 403, 'begona tahrirlay olmaydi');
  await api('PATCH', `/admin/quizzes/${id}`, { status: 'approved' }, fx.t.admin);
  fx.quiz = (await api('GET', `/quizzes/${id}`)).j;
});

test("AI izohi: faqat xato javobga, kesh, kunlik limit, nazorat kuni o'chadi", async () => {
  const q = fx.quiz;
  const qid = q.questions[0]._id;
  const ex = (token, chosen = 0) => api('POST', `/quizzes/${q._id}/explain`, { questionId: qid, chosen, lang: 'uz' }, token);
  assert.equal((await ex(null)).s, 401);
  assert.equal((await ex(fx.t.a, 1)).s, 400, "to'g'ri javobga izoh so'ralmaydi");
  const first = await ex(fx.t.a);
  assert.equal(first.s, 200);
  assert.equal(first.j.text, 'Sinov izohi');
  assert.equal(aiCalls.length, 1);
  assert.equal(aiCalls[0].key, 'test-key');
  assert.match(aiCalls[0].body.messages[0].content, /2\+2/);
  const again = await ex(fx.t.b);
  assert.equal(again.j.cached, true, 'ikkinchi talaba keshdan oladi');
  assert.equal(aiCalls.length, 1, 'AI qayta chaqirilmadi');

  // limit: kesh bo'lmagan savolga
  await api('PUT', '/admin/settings', settings({ aiDailyLimit: 1 }), fx.t.admin);
  const q2 = q.questions[1]._id;
  const lim = await api('POST', `/quizzes/${q._id}/explain`, { questionId: q2, chosen: 1 }, fx.t.a);
  assert.equal(lim.s, 429, 'talaba A bugun 1 ta ishlatgan');

  // nazorat kuni: shu fan bo'yicha AI o'chadi
  await api('PUT', '/admin/settings', settings({ aiDailyLimit: 10 }), fx.t.admin);
  const exam = await M.Exam.create({ subject: fx.subject._id, type: 'oraliq', date: new Date() });
  assert.equal((await ex(fx.t.b)).s, 403);
  await exam.deleteOne();

  // admin o'chirsa: 503 va /meta da ko'rinmaydi
  await api('PUT', '/admin/settings', settings({ aiEnabled: false }), fx.t.admin);
  assert.equal((await ex(fx.t.b)).s, 503);
  assert.equal((await api('GET', '/meta')).j.aiExplain, false);
  await api('PUT', '/admin/settings', settings(), fx.t.admin);
  assert.equal((await api('GET', '/meta')).j.aiExplain, true);
});

test("test natijalari: admin kimlar yechganini, o'rtacha natijani va CSV ni ko'radi", async () => {
  const id = fx.quiz._id;
  assert.equal((await api('GET', `/admin/quizzes/${id}/attempts`, null, fx.t.a)).s, 403, 'talaba ko\'ra olmaydi');
  await api('POST', `/quizzes/${id}/attempt`, { answers: [1, 0] }, fx.t.b); // B: 2/2
  const r = await api('GET', `/admin/quizzes/${id}/attempts`, null, fx.t.admin);
  assert.equal(r.s, 200);
  assert.equal(r.j.summary.students, 2);
  assert.ok(r.j.rows.some((x) => x.student.name === 'Talaba B' && x.pct === 100));
  assert.ok(r.j.rows.some((x) => x.student.name === 'Talaba A' && x.score === 1));
  assert.equal(r.j.summary.questions.length, 2);
  assert.ok(r.j.quiz.attempts > r.j.summary.saved, 'kirmasdan yechganlar umumiy sonda');
  const csv = await api('GET', `/admin/quizzes/${id}/attempts.csv`, null, fx.t.admin);
  assert.match(csv.ct, /text\/csv/);
  assert.match(csv.j, /Talaba B/);
});

test("admin repetitor anketasini tahrirlaydi (ism ham), talaba qila olmaydi", async () => {
  const body = { name: 'Toza Ism', headline: 'Ekonometrika darslari', bio: '', experience: '', pricePerHour: 60000, subjects: [String(fx.subject._id)], formats: ['online'], languages: ['uz'], telegram: '@x', availability: [{ day: 2, from: '16:00', to: '19:00' }, { day: 4, from: '16:00', to: '19:00' }] };
  assert.equal((await api('PUT', `/admin/tutors/${fx.tutor._id}`, body, fx.t.a)).s, 403);
  const r = await api('PUT', `/admin/tutors/${fx.tutor._id}`, body, fx.t.admin);
  assert.equal(r.s, 200);
  assert.equal(r.j.headline, 'Ekonometrika darslari');
  assert.equal(r.j.status, 'approved', "holat o'zgarmaydi");
  assert.equal((await M.User.findById(fx.tutorUser._id)).name, 'Toza Ism');
});

test("talaba o'z natijalarini, muallif esa ismsiz statistikani ko'radi (admin urinishlari hisobga olinmaydi)", async () => {
  const id = fx.quiz._id;
  await api('POST', `/quizzes/${id}/attempt`, { answers: [1, 1] }, fx.t.admin); // admin sinovi
  const mine = await api('GET', '/quizzes/attempts/mine', null, fx.t.a);
  assert.equal(mine.s, 200);
  assert.ok(mine.j.length >= 1 && mine.j[0].quiz.title === 'Sinov testi' && mine.j[0].quiz.subject.name);
  assert.equal((await api('GET', `/quizzes/${id}/stats`, null, fx.t.b)).s, 403, 'begona statistikani ko\'rmaydi');
  const st = await api('GET', `/quizzes/${id}/stats`, null, fx.t.tutor);
  assert.equal(st.s, 200);
  assert.equal(st.j.students, 2, 'faqat talabalar A va B');
  assert.equal(st.j.rows, undefined, 'ismlar yo\'q');
  const adm = await api('GET', `/admin/quizzes/${id}/attempts`, null, fx.t.admin);
  assert.ok(adm.j.summary.adminAttempts >= 1);
  assert.ok(!adm.j.rows.some((x) => x.student.role === 'admin'));
});

test("Telegram eslatmalari: ertangi nazorat va yangi test — bir martadan, faqat tegishli kurs talabalariga", async () => {
  const tg = await import('../src/telegram.js');
  const { runExamReminders, notifyNewQuiz } = await import('../src/reminders.js');
  tg.bot.username = 'testbot';
  try {
    await M.User.updateOne({ _id: fx.studentA._id }, { faculty: 'xim', year: 1 }); // mos keladi
    await M.User.updateOne({ _id: fx.studentB._id }, { faculty: 'xm', year: 1 }); // boshqa fakultet
    const exam = await M.Exam.create({ subject: fx.subject._id, type: 'oraliq', date: new Date(Date.now() + 24 * 3600e3) });
    tgCalls.length = 0;
    const r1 = await runExamReminders();
    assert.equal(r1.length, 1);
    assert.equal(r1[0].total, 1, 'faqat xim 1-kurs talabasi');
    assert.equal(tgCalls[0].chat_id, '1001');
    assert.match(tgCalls[0].text, /oraliq nazorat/);
    assert.equal((await runExamReminders()).length, 0, 'qayta yuborilmaydi');
    await exam.deleteOne();

    const q = await api('POST', '/quizzes', { subject: String(fx.subject._id), title: 'Yangi test', questions: [{ text: '1+1?', options: ['1', '2'], correct: 1 }] }, fx.t.admin);
    await new Promise((ok) => setTimeout(ok, 300));
    assert.ok(tgCalls.some((c) => /Yangi mashq testi/.test(c.text)), 'admin tuzgan test darhol e\'lon qilinadi');
    assert.equal(await notifyNewQuiz(q.j._id), null, 'ikkinchi marta yuborilmaydi');

    await api('PUT', '/admin/settings', settings({ telegramReminders: false }), fx.t.admin);
    await M.Exam.create({ subject: fx.subject._id, type: 'yakuniy', date: new Date(Date.now() + 24 * 3600e3) });
    assert.equal((await runExamReminders()).length, 0, "sozlamada o'chirilsa yuborilmaydi");
    await api('PUT', '/admin/settings', settings(), fx.t.admin);
  } finally {
    tg.bot.username = '';
  }
});

test("SEO: robots.txt va sitemap.xml faqat ommaviy sahifalarni beradi", async () => {
  const root = base.replace(/\/api$/, '');
  const robots = await (await fetch(`${root}/robots.txt`)).text();
  assert.match(robots, /Disallow: \/admin/);
  assert.match(robots, /Sitemap: .+\/sitemap\.xml/);

  const hidden = await M.User.create({ name: 'Yashirin', telegramId: '9901', role: 'tutor' });
  const pending = await M.Tutor.create({ user: hidden._id, subjects: [fx.subject._id], headline: 'Kutilmoqda', pricePerHour: 100000, status: 'pending' });
  const archived = await M.Subject.create({ name: 'Arxiv fan', faculty: 'xim', years: [1], active: false });
  const note = await M.Material.create({ subject: fx.subject._id, title: 'SEO konspekt', type: 'konspekt', body: 'Matn', status: 'approved' });
  const link = await M.Material.create({ subject: fx.subject._id, title: 'Tashqi havola', type: 'konspekt', url: 'https://example.com/x', status: 'approved' });

  const res = await fetch(`${root}/sitemap.xml`);
  assert.equal(res.status, 200);
  assert.match(res.headers.get('content-type'), /xml/);
  const xml = await res.text();
  assert.match(xml, /<urlset/);
  assert.ok(xml.includes(`/tutors/${fx.tutor._id}`), 'tasdiqlangan repetitor sitemap da bo\'lishi kerak');
  assert.ok(xml.includes(`/subjects/${fx.subject._id}`), 'faol fan sitemap da bo\'lishi kerak');
  assert.ok(xml.includes('/materials/' + note._id), "matnli konspekt sitemap da bo'lishi kerak");
  assert.ok(!xml.includes(String(link._id)), "tashqi havolali material sitemap da bo'lmasligi kerak");
  assert.ok(!xml.includes(String(pending._id)), 'tasdiqlanmagan repetitor sitemap da bo\'lmasligi kerak');
  assert.ok(!xml.includes(String(archived._id)), 'arxivdagi fan sitemap da bo\'lmasligi kerak');
  assert.ok(!xml.includes('/admin'), 'admin sahifasi sitemap da bo\'lmasligi kerak');
  // boshqa testlarga ta'sir qilmasin
  await M.Material.deleteMany({ _id: { $in: [note._id, link._id] } });
  await M.Tutor.deleteOne({ _id: pending._id });
  await M.User.deleteOne({ _id: hidden._id });
  await M.Subject.deleteOne({ _id: archived._id });
});

test("fan mavzulari: admin kiritadi, fan sahifasida tartib bilan chiqadi", async () => {
  const id = String(fx.subject._id);
  assert.equal((await api('PUT', `/admin/subjects/${id}/topics`, { topics: ['A'] }, fx.t.a)).s, 403);
  const r = await api('PUT', `/admin/subjects/${id}/topics`, { topics: ['Ketma-ketlik limiti', 'Funksiya limiti', 'Hosila'] }, fx.t.admin);
  assert.equal(r.s, 200);
  const pub = await api('GET', `/subjects/${id}`);
  assert.deepEqual(pub.j.subject.topics, ['Ketma-ketlik limiti', 'Funksiya limiti', 'Hosila']);
});

test("matnli konspekt: faqat admin yozadi, ro'yxatda matnsiz, alohida sahifada to'liq va mavzu tartibida", async () => {
  const subject = String(fx.subject._id);
  const note = { subject, title: '2-mavzu: Funksiya limiti', body: '## Tushuncha\n\nFunksiya limiti haqida qisqa matn.', order: 2 };
  assert.equal((await api('POST', '/admin/materials', note, fx.t.a)).s, 403);
  const n2 = await api('POST', '/admin/materials', note, fx.t.admin);
  assert.equal(n2.s, 201);
  const n1 = await api('POST', '/admin/materials', { ...note, title: '1-mavzu: Ketma-ketlik', order: 1 }, fx.t.admin);
  // Oddiy foydalanuvchi havolasiz material yubora olmaydi (body faqat admin yo'li orqali)
  assert.equal((await api('POST', '/materials', { subject, title: 'Matn', type: 'konspekt', body: 'x'.repeat(50) }, fx.t.a)).s, 400);
  const pub = await api('GET', `/subjects/${subject}`);
  const notes = pub.j.materials.filter((m) => !m.url);
  assert.deepEqual(notes.map((m) => m.title), ['1-mavzu: Ketma-ketlik', '2-mavzu: Funksiya limiti']);
  assert.ok(notes.every((m) => m.body === undefined), "ro'yxatda matn yuborilmaydi");
  const one = await api('GET', `/materials/${n2.j._id}`);
  assert.equal(one.s, 200);
  assert.match(one.j.body, /Funksiya limiti/);
  assert.deepEqual(one.j.siblings.map((x) => String(x._id)), [String(n1.j._id), String(n2.j._id)]);
  const upd = await api('PUT', `/admin/materials/${n2.j._id}`, { body: '## Yangi\n\nYangilangan matn, yetarlicha uzun.' }, fx.t.admin);
  assert.equal(upd.s, 200);
  assert.match((await api('GET', `/materials/${n2.j._id}`)).j.body, /Yangilangan/);
  assert.equal((await api('GET', '/materials/notanid')).s, 400);
});

test('premium: rejalar, bepul sinov, sotib olish, uzaytirish, dars chegirmasi, xatolarim, mukofot, admin, Payme', async () => {
  const day = (d) => ({ day: d, from: '10:00', to: '20:00' });
  await M.Tutor.updateOne({ _id: fx.tutor._id }, { $set: { pricePerHour: 100000, status: 'approved', availability: [0, 1, 2, 3, 4, 5, 6].map(day) } });
  const u = await M.User.create({ name: 'Premium talaba', telegramId: '2001' });
  const tok = signToken(u);

  const guest = (await api('GET', '/premium')).j;
  assert.deepEqual(guest.plans.map((p) => p.key), ['month', 'semester', 'year']);
  assert.equal(guest.plans[0].price, 19000);
  assert.equal(guest.active, false);

  // «Mening xatolarim»: bepul foydalanuvchiga faqat soni ko'rinadi
  const qz = await api('POST', '/quizzes', { subject: String(fx.subject._id), title: 'Premium sinov testi', questions: [{ text: '2+2?', options: ['3', '4'], correct: 1, explanation: "To'rt" }, { text: '1+1?', options: ['2', '5'], correct: 0 }] }, fx.t.admin);
  assert.equal(qz.s, 201);
  await api('POST', `/quizzes/${qz.j._id}/attempt`, { answers: [0, 0] }, tok);
  const locked = (await api('GET', '/quizzes/mistakes', null, tok)).j;
  assert.equal(locked.locked, true);
  assert.equal(locked.count, 1);
  assert.equal(locked.items.length, 0);

  // Bepul sinov — bir marta
  const tr = await api('POST', '/premium/trial', null, tok);
  assert.equal(tr.s, 200);
  assert.equal(tr.j.active, true);
  assert.equal((await api('POST', '/premium/trial', null, tok)).s, 409);
  const open = (await api('GET', '/quizzes/mistakes', null, tok)).j;
  assert.equal(open.locked, false);
  assert.equal(open.items[0].correct, 1);
  assert.equal(open.items[0].explanation, "To'rt");
  assert.ok((await api('GET', '/auth/me', null, tok)).j.user.premiumUntil);

  // Sotib olish (sinov rejimi): faol muddat oxiridan uzayadi
  const before = (await M.User.findById(u._id)).premiumUntil.getTime();
  const co = await api('POST', '/premium/checkout', { plan: 'month', provider: 'payme' }, tok);
  assert.equal(co.s, 201);
  assert.equal(co.j.url, `/pay/${co.j.payment}`);
  const pv = (await api('GET', `/payments/${co.j.payment}`, null, tok)).j;
  assert.equal(pv.kind, 'premium');
  assert.equal(pv.amount, 19000);
  assert.equal(pv.days, 30);
  assert.equal((await api('POST', `/payments/${co.j.payment}/demo/confirm`, null, tok)).s, 200);
  const after = (await M.User.findById(u._id)).premiumUntil.getTime();
  assert.ok(Math.abs(after - before - 30 * 86400e3) < 5000, "faol muddatga 30 kun qo'shildi");
  assert.equal((await api('POST', `/payments/${co.j.payment}/demo/confirm`, null, tok)).s, 409);
  assert.equal((await api('POST', '/premium/checkout', { plan: 'abadiy', provider: 'payme' }, tok)).s, 400);
  assert.equal((await api('GET', '/premium', null, tok)).j.history.length, 1);

  // Dars chegirmasi: birinchi darsda qo'shilmaydi, keyingisida platforma komissiyasidan
  const meta = (await api('GET', '/meta')).j;
  const b1 = (await book(tok, await slot(0))).j;
  assert.equal(b1.premiumDiscount, 0, "birinchi darsda chegirmalar qo'shilmaydi");
  await M.Booking.updateOne({ _id: b1._id }, { $set: { status: 'completed' } });
  const b2 = (await book(tok, await slot(0))).j;
  const fullCom = Math.round((100000 * meta.commission) / 100);
  const pd = Math.min(5000, fullCom);
  assert.equal(b2.premiumDiscount, pd);
  assert.equal(b2.total, 100000 - pd);
  assert.equal(b2.payout, 100000 - fullCom, "repetitor ulushi o'zgarmaydi");
  assert.equal(b2.commission, fullCom - pd);

  // Tasdiqlangan material muallifiga mukofot — bir marta
  const mat = await M.Material.create({ subject: fx.subject._id, title: 'Talaba konspekti', type: 'konspekt', body: 'matn', author: fx.studentB._id, status: 'pending' });
  assert.equal((await api('PATCH', `/admin/materials/${mat._id}`, { status: 'approved' }, fx.t.admin)).s, 200);
  const rewarded = (await M.User.findById(fx.studentB._id)).premiumUntil;
  assert.ok(rewarded.getTime() > Date.now() + 6 * 86400e3);
  await api('PATCH', `/admin/materials/${mat._id}`, { status: 'pending' }, fx.t.admin);
  await api('PATCH', `/admin/materials/${mat._id}`, { status: 'approved' }, fx.t.admin);
  assert.equal((await M.User.findById(fx.studentB._id)).premiumUntil.getTime(), rewarded.getTime(), 'mukofot bir marta');

  // Admin kunlarni qo'lda boshqaradi
  assert.equal((await api('POST', `/admin/users/${u._id}/premium`, { days: 10 }, fx.t.a)).s, 403);
  assert.equal((await api('POST', `/admin/users/${u._id}/premium`, { days: -1000 }, fx.t.admin)).s, 200);
  assert.equal((await api('GET', '/premium', null, tok)).j.active, false);
  assert.equal((await api('GET', '/quizzes/mistakes', null, tok)).j.locked, true);

  // Haqiqiy rejim: Payme orqali yillik obuna va qaytarish
  const env = { PAYMENT_MODE: 'live', PAYME_MERCHANT_ID: 'mid-prem', PAYME_KEY: 'prem-kalit' };
  Object.assign(process.env, env);
  const rpc = (method, params) =>
    fetch(`${base}/payments/payme`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Basic ${Buffer.from(`Paycom:${env.PAYME_KEY}`).toString('base64')}` },
      body: JSON.stringify({ id: 1, method, params }),
    }).then((r) => r.json());
  try {
    const c2 = (await api('POST', '/premium/checkout', { plan: 'year', provider: 'payme' }, tok)).j;
    const order_id = String(c2.payment);
    const amount = 149000 * 100;
    assert.equal((await rpc('CheckPerformTransaction', { amount, account: { order_id } })).result.allow, true);
    assert.equal((await rpc('CreateTransaction', { id: 'prem-1', time: Date.now(), amount, account: { order_id } })).result.state, 1);
    assert.equal((await rpc('PerformTransaction', { id: 'prem-1' })).result.state, 2);
    assert.ok((await M.User.findById(u._id)).premiumUntil.getTime() > Date.now() + 364 * 86400e3);
    assert.equal((await rpc('CancelTransaction', { id: 'prem-1', reason: 5 })).result.state, -2);
    assert.ok((await M.User.findById(u._id)).premiumUntil.getTime() < Date.now() + 86400e3, 'qaytarilgan kunlar olib tashlandi');
  } finally {
    for (const k of Object.keys(env)) delete process.env[k];
  }
});

test("Imtihon rejimi: vaqt chegarasi, sarflangan vaqt, javoblar tahlili yopiq", async () => {
  const body = { subject: String(fx.subject._id), title: 'Vaqtli test', timeLimit: 45, hideReview: true, questions: [{ text: '2+2?', options: ['3', '4'], correct: 1, explanation: "To'rt" }, { text: '1+1?', options: ['2', '5'], correct: 0 }, { text: '3+3?', options: ['6', '7'], correct: 0 }] };
  const c = await api('POST', '/quizzes', body, fx.t.admin);
  assert.equal(c.s, 201);
  const id = c.j._id;
  const pub = (await api('GET', `/quizzes/${id}`)).j;
  assert.equal(pub.timeLimit, 45);
  assert.equal(pub.hideReview, true);
  assert.equal(pub.questions[0].correct, undefined, "to'g'ri javob oshkor emas");
  assert.equal((await api('GET', '/quizzes')).j.find((q) => q._id === id).timeLimit, 45);

  assert.equal((await api('POST', `/quizzes/${id}/attempt`, { answers: [1, 0, 0] }, fx.t.a)).s, 409, 'boshlanmagan vaqtli test topshirilmaydi');
  assert.equal((await api('POST', `/quizzes/${id}/attempt`, { answers: [1, 0, 0] })).s, 401, 'kirmagan yecha olmaydi');

  const s1 = await api('POST', `/quizzes/${id}/start`, null, fx.t.a);
  assert.equal(s1.s, 200);
  assert.equal(s1.j.timeLimit, 45);
  const s2 = await api('POST', `/quizzes/${id}/start`, null, fx.t.a);
  assert.equal(s2.j.sessionId, s1.j.sessionId, 'sahifa yangilansa ham o\'sha sessiya davom etadi');
  // 10 daqiqa oldin boshlangan deb hisoblaymiz
  await M.QuizSession.updateOne({ _id: s1.j.sessionId }, { startedAt: new Date(Date.now() - 600e3) });

  const at = await api('POST', `/quizzes/${id}/attempt`, { answers: [1, 1, -1] }, fx.t.a);
  assert.equal(at.s, 200);
  assert.equal(at.j.score, 1);
  assert.equal(at.j.wrong, 1);
  assert.equal(at.j.unanswered, 1);
  assert.equal(at.j.hidden, true);
  assert.equal(at.j.results, undefined, 'qaysi savolda xato qilingani ko\'rsatilmaydi');
  assert.ok(at.j.durationSec >= 600 && at.j.durationSec < 620);
  assert.equal((await api('POST', `/quizzes/${id}/attempt`, { answers: [1, 0, 0] }, fx.t.a)).s, 409, 'bitta sessiya bilan ikki marta topshirilmaydi');

  // Kech topshirish belgilanadi
  const s3 = await api('POST', `/quizzes/${id}/start`, null, fx.t.b);
  await M.QuizSession.updateOne({ _id: s3.j.sessionId }, { startedAt: new Date(Date.now() - (45 * 60 + 100) * 1000) });
  const lateAt = await api('POST', `/quizzes/${id}/attempt`, { answers: [1, 0, 0] }, fx.t.b);
  assert.equal(lateAt.j.score, 3);

  const qid = String(pub.questions[0]._id);
  assert.equal((await api('POST', `/quizzes/${id}/explain`, { questionId: qid, chosen: 0 }, fx.t.a)).s, 403, 'AI izohi ham yopiq');
  assert.ok(!(await api('GET', '/quizzes/mistakes', null, fx.t.a)).j.items.some((x) => String(x.quiz._id) === id));

  const adm = (await api('GET', `/admin/quizzes/${id}/attempts`, null, fx.t.admin)).j;
  const ra = adm.rows.find((x) => x.student.name === 'Talaba A');
  const rb = adm.rows.find((x) => x.student.name === 'Talaba B');
  assert.ok(ra.durationSec >= 600 && ra.durationSec < 620);
  assert.equal(ra.late, false);
  assert.equal(rb.late, true);
  const csv = (await api('GET', `/admin/quizzes/${id}/attempts.csv`, null, fx.t.admin)).j;
  assert.ok(csv.includes('Sarflangan vaqt') && csv.includes('10:0'));
});
