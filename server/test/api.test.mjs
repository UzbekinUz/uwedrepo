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

test("fan mavzulari: admin kiritadi, fan sahifasida tartib bilan chiqadi", async () => {
  const id = String(fx.subject._id);
  assert.equal((await api('PUT', `/admin/subjects/${id}/topics`, { topics: ['A'] }, fx.t.a)).s, 403);
  const r = await api('PUT', `/admin/subjects/${id}/topics`, { topics: ['Ketma-ketlik limiti', 'Funksiya limiti', 'Hosila'] }, fx.t.admin);
  assert.equal(r.s, 200);
  const pub = await api('GET', `/subjects/${id}`);
  assert.deepEqual(pub.j.subject.topics, ['Ketma-ketlik limiti', 'Funksiya limiti', 'Hosila']);
});
