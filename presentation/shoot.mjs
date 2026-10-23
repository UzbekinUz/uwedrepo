// Saytning haqiqiy sahifalaridan skrinshot oladi (Chrome DevTools Protocol, kutubxonasiz)
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';

const BASE = 'http://127.0.0.1:5174';
const OUT = path.resolve('shots');
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const require = createRequire('D:/AI/UWEDREPO/server/package.json');
const jwt = require('jsonwebtoken');
const secret = (fs.readFileSync('D:/AI/UWEDREPO/server/.env', 'utf8').match(/^JWT_SECRET=(.*)$/m) || [])[1] || 'dev-secret-change-me';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const get = async (p, token) => (await fetch(BASE + '/api' + p, { headers: token ? { Authorization: `Bearer ${token}` } : {} })).json();

// --- tokenlar va identifikatorlar ---
const adminToken = (await (await fetch(BASE + '/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'admin@uwedrepo.uz', password: 'Admin12345' }) })).json()).token;
const sign = (id) => jwt.sign({ id }, secret, { expiresIn: '1d' });
const users = (await get('/admin/users?limit=50', adminToken)).items;
const student = sign(users.find((u) => u.name === 'Talaba 4')._id);
const tutorsAdmin = (await get('/admin/tutors?status=approved', adminToken)).items;
const tutorToken = sign(tutorsAdmin.find((t) => t.user.name.startsWith('Aziza')).user._id);
const subjects = await get('/subjects');
const subj = subjects.find((s) => s.name === 'Hisoblash 1') || subjects[0];
const tutor = (await get('/tutors')).find((t) => t.user.name.startsWith('Aziza'));

// --- Chrome ---
const port = 9333;
const chrome = spawn(CHROME, [`--remote-debugging-port=${port}`, '--headless=new', '--hide-scrollbars', '--disable-gpu', '--no-first-run', `--user-data-dir=${path.resolve('chrome-profile')}`, 'about:blank'], { stdio: 'ignore' });
let ws;
for (let i = 0; i < 40 && !ws; i++) {
  await sleep(500);
  try {
    const tabs = await (await fetch(`http://127.0.0.1:${port}/json`)).json();
    const page = tabs.find((t) => t.type === 'page');
    if (page) ws = new WebSocket(page.webSocketDebuggerUrl);
  } catch { /* chrome hali ishga tushmagan */ }
}
await new Promise((ok, no) => { ws.onopen = ok; ws.onerror = no; });
let id = 0;
const pending = new Map();
ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && pending.has(d.id)) { pending.get(d.id)(d); pending.delete(d.id); } };
const send = (method, params = {}) => new Promise((ok) => { const n = ++id; pending.set(n, ok); ws.send(JSON.stringify({ id: n, method, params })); });
const evalJs = async (expr) => (await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true })).result?.result?.value;
await send('Page.enable');

async function shot(name, { url, token, w = 1440, h = 900, scale = 1.5, mobile = false, scrollText, scrollId, scrollY, after, wait = 2200 }) {
  await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: scale, mobile });
  await send('Page.navigate', { url: BASE + '/login' });
  await sleep(1200);
  await evalJs(`localStorage.clear(); sessionStorage.clear(); localStorage.setItem('lang','uz'); localStorage.setItem('pref', JSON.stringify({faculty:'xim',year:1})); ${token ? `localStorage.setItem('token','${token}');` : ''} 'ok'`);
  await send('Page.navigate', { url: BASE + url });
  await sleep(wait);
  if (after) { await evalJs(after); await sleep(900); }
  if (scrollId || scrollText || scrollY != null) {
    await evalJs(`(async () => {
      let el = ${scrollId ? `document.getElementById(${JSON.stringify(scrollId)})` : scrollText ? `[...document.querySelectorAll('h2,h3')].find(h => h.textContent.includes(${JSON.stringify(scrollText)}))` : 'null'};
      const y = ${scrollY != null ? scrollY : `el ? el.getBoundingClientRect().top + scrollY - 90 : 0`};
      document.documentElement.style.scrollBehavior = 'auto';
      window.scrollTo(0, y);
      await new Promise(r => setTimeout(r, 300)); window.scrollBy(0, 2); window.scrollBy(0, -2);
      return 1; })()`);
    await sleep(2200);
  }
  const r = await send('Page.captureScreenshot', { format: 'jpeg', quality: 88 });
  fs.writeFileSync(path.join(OUT, `${name}.jpg`), Buffer.from(r.result.data, 'base64'));
  console.log('saved', name);
}

const jobs = [
  ['home-hero', { url: '/', wait: 3500 }],
  ['home-features', { url: '/', scrollId: 'imkoniyatlar' }],
  ['home-how', { url: '/', scrollId: 'qanday' }],
  ['home-adv', { url: '/', scrollText: 'Nega aynan UWEDRepo' }],
  ['home-compare', { url: '/', scrollText: 'Telegram kanallari bilan solishtiring' }],
  ['home-faq', { url: '/', scrollId: 'savol' }],
  ['subjects', { url: '/subjects' }],
  ['subject', { url: `/subjects/${subj._id}` }],
  ['tutors', { url: '/tutors' }],
  ['tutor', { url: `/tutors/${tutor._id}` }],
  ['calendar', { url: '/calendar' }],
  ['materials', { url: '/materials' }],
  ['register', { url: '/register', wait: 3000 }],
  ['my', { url: '/my', token: student }],
  ['tutor-panel', { url: '/tutor', token: tutorToken }],
  ['survey', { url: '/survey' }],
  ['mobile-home', { url: '/', w: 390, h: 844, scale: 2, mobile: true, wait: 3500 }],
  ['mobile-tutor', { url: `/tutors/${tutor._id}`, w: 390, h: 844, scale: 2, mobile: true }],
  ['admin-overview', { url: '/admin?tab=overview', token: adminToken, wait: 3000 }],
  ['admin-funnel', { url: '/admin?tab=overview', token: adminToken, wait: 3000, scrollText: 'Voronka' }],
  ['admin-users', { url: '/admin?tab=users', token: adminToken, after: `document.querySelector('tbody button')?.click()`, scrollY: 470 }],
  ['admin-tutors', { url: '/admin?tab=tutors', token: adminToken, after: `[...document.querySelectorAll('button')].find(b => b.textContent.startsWith('Hammasi'))?.click()`, scrollY: 470 }],
  ['admin-bookings', { url: '/admin?tab=bookings', token: adminToken, scrollY: 650 }],
  ['admin-finance', { url: '/admin?tab=finance', token: adminToken, scrollY: 560 }],
  ['admin-content', { url: '/admin?tab=content', token: adminToken, scrollY: 420 }],
  ['admin-messages', { url: '/admin?tab=messages', token: adminToken, scrollY: 520 }],
  ['admin-settings', { url: '/admin?tab=settings', token: adminToken, scrollY: 380 }],
  ['admin-audit', { url: '/admin?tab=audit', token: adminToken, scrollY: 420 }],
  ['admin-guide', { url: '/admin?tab=guide', token: adminToken, scrollY: 330 }],
];
const only = process.argv[2];
for (const [n, o] of jobs) if (!only || n.includes(only)) await shot(n, o);
ws.close();
chrome.kill();
process.exit(0);
