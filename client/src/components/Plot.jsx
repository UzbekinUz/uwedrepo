/**
 * Konspekt ichidagi funksiya grafiklari (SVG). Ifodalar o'zimizning xavfsiz tahlilchimiz bilan hisoblanadi — eval yo'q.
 *
 * ::: grafik x: -3..3, y: -2..6 | Sarlavha
 * y = x^2 | teal | y = x²
 * y = 4x - 4 | amber | urinma
 * y = x^2 | rose | x < 1 da | -1..1          (faqat shu oraliqda chiziladi — bo'lakli funksiyalar uchun)
 * soha x ; x^2 | 0..1 | teal | yuza          (ikki egri chiziq orasini bo'yash; ikkinchisi bo'lmasa — Ox o'qigacha)
 * nuqta 2, 4 | P(2; 4)
 * nuqta 1, 1 | | ochiq                      (bo'sh doiracha — «teshik»)
 * vertikal 1 | x = 1
 * gorizontal 2 | y = 2
 * :::
 */

const FN = {
  sin: Math.sin, cos: Math.cos, tan: Math.tan, tg: Math.tan, ln: Math.log, log: Math.log10, exp: Math.exp,
  sqrt: Math.sqrt, abs: Math.abs, cbrt: Math.cbrt, atan: Math.atan, arctg: Math.atan, asin: Math.asin, acos: Math.acos,
};
const NAMES = [...Object.keys(FN), 'pi'].sort((a, b) => b.length - a.length);

/** "2x^2 - sin(x)" → (x) => qiymat. Xato bo'lsa null qaytaradi. */
export function compile(src) {
  const s = String(src).replace(/\s+/g, '').replace(/[−–]/g, '-').replace(/[·×]/g, '*').replace(/π/g, 'pi');
  let i = 0;
  const fail = () => { throw new Error('ifoda'); };
  const startsAtom = () => i < s.length && /[0-9.a-z(]/i.test(s[i]);

  function atom() {
    const c = s[i];
    if (c === '(') { i++; const e = expr(); if (s[i] !== ')') fail(); i++; return e; }
    if (/[0-9.]/.test(c)) {
      const m = /^\d*\.?\d+/.exec(s.slice(i)); if (!m) fail();
      i += m[0].length; const v = +m[0]; return () => v;
    }
    if (/[a-z]/i.test(c)) {
      const name = NAMES.find((n) => s.startsWith(n, i));
      if (name === 'pi') { i += 2; return () => Math.PI; }
      if (name && s[i + name.length] === '(') {
        i += name.length + 1; const arg = expr(); if (s[i] !== ')') fail(); i++;
        const f = FN[name]; return (x) => f(arg(x));
      }
      i++;
      if (c === 'x') return (x) => x;
      if (c === 'e') return () => Math.E;
    }
    return fail();
  }
  function power() {
    const base = atom();
    if (s[i] === '^') { i++; const ex = unary(); return (x) => Math.pow(base(x), ex(x)); }
    return base;
  }
  function unary() {
    if (s[i] === '-') { i++; const u = unary(); return (x) => -u(x); }
    if (s[i] === '+') { i++; return unary(); }
    return power();
  }
  function term() {
    let left = unary();
    for (;;) {
      if (s[i] === '*' || s[i] === '/') {
        const op = s[i++]; const r = unary(); const l = left;
        left = op === '*' ? (x) => l(x) * r(x) : (x) => l(x) / r(x);
      } else if (startsAtom()) { // yashirin ko'paytirish: 2x, x(x+1)
        const r = unary(); const l = left; left = (x) => l(x) * r(x);
      } else return left;
    }
  }
  function expr() {
    let left = term();
    while (s[i] === '+' || s[i] === '-') {
      const op = s[i++]; const r = term(); const l = left;
      left = op === '+' ? (x) => l(x) + r(x) : (x) => l(x) - r(x);
    }
    return left;
  }
  try {
    const f = expr();
    if (i !== s.length) return null;
    return f;
  } catch { return null; }
}

const COLORS = { teal: '#0A7E7A', amber: '#D97706', rose: '#E11D48', sky: '#0284C7', violet: '#7C3AED', slate: '#3F4D49', green: '#16A34A' };
const color = (c, i) => COLORS[c] || (/^#[0-9a-f]{3,8}$/i.test(c || '') ? c : Object.values(COLORS)[i % 5]);

/** Grafik tavsifini o'qish */
export function parseSpec(head, lines) {
  const num = (v) => { const f = compile(v); return f ? f(0) : NaN; };
  const head0 = head.split('|')[0];
  const range = (key) => {
    const m = new RegExp(`${key}\\s*:\\s*([^,]+)`).exec(head0);
    const ab = m ? m[1].split('..') : [];
    return ab.length === 2 ? [num(ab[0]), num(ab[1])] : null;
  };
  const spec = {
    title: head.includes('|') ? head.slice(head.indexOf('|') + 1).trim() : '',
    x: range('x') || [-5, 5],
    y: range('y'),
    curves: [], areas: [], points: [], vlines: [], hlines: [],
  };
  lines.forEach((raw) => {
    const parts = raw.split('|').map((p) => p.trim());
    const [main, ...rest] = parts;
    let m;
    if ((m = /^y\s*=\s*(.+)$/.exec(main))) {
      const f = compile(m[1]); const r = /(.+?)\.\.(.+)/.exec(rest[2] || '');
      if (f) spec.curves.push({ f, color: rest[0], label: rest[1] ?? '', from: r ? num(r[1]) : null, to: r ? num(r[2]) : null });
    } else if ((m = /^soha\s+(.+)$/.exec(main))) {
      const [a, b] = m[1].split(';').map((e) => compile(e)); const r = /(.+?)\.\.(.+)/.exec(rest[0] || '');
      if (a && r) spec.areas.push({ f: a, g: b || (() => 0), from: num(r[1]), to: num(r[2]), color: rest[1], label: rest[2] ?? '' });
    } else if ((m = /^nuqta\s+(.+?)\s*,\s*(.+)$/.exec(main))) {
      spec.points.push({ x: num(m[1]), y: num(m[2]), label: rest[0] ?? '', open: /ochiq/.test(rest[1] || '') });
    } else if ((m = /^vertikal\s+(.+)$/.exec(main))) {
      spec.vlines.push({ x: num(m[1]), label: rest[0] ?? '' });
    } else if ((m = /^gorizontal\s+(.+)$/.exec(main))) {
      spec.hlines.push({ y: num(m[1]), label: rest[0] ?? '' });
    }
  });
  return spec;
}

function niceStep(span) {
  const raw = span / 8; const p = 10 ** Math.floor(Math.log10(raw)); const k = raw / p;
  return (k < 1.5 ? 1 : k < 3.5 ? 2 : k < 7.5 ? 5 : 10) * p;
}
const fmt = (v) => (Math.abs(v) < 1e-9 ? '0' : String(+v.toFixed(4)).replace('-', '−').replace('.', ','));

export default function Plot({ spec }) {
  const W = 640, H = 380, P = 28;
  const [x0, x1] = spec.x;
  let [y0, y1] = spec.y || [NaN, NaN];
  if (!spec.y) { // y oralig'ini avtomatik
    const ys = [];
    spec.curves.forEach((c) => { for (let k = 0; k <= 200; k++) { const v = c.f(x0 + ((x1 - x0) * k) / 200); if (Number.isFinite(v)) ys.push(v); } });
    ys.sort((a, b) => a - b);
    y0 = ys.length ? ys[Math.floor(ys.length * 0.02)] : -5; y1 = ys.length ? ys[Math.ceil(ys.length * 0.98) - 1] : 5;
    const pad = (y1 - y0 || 2) * 0.12; y0 -= pad; y1 += pad;
  }
  const sx = (x) => P + ((x - x0) / (x1 - x0)) * (W - 2 * P);
  const sy = (y) => H - P - ((y - y0) / (y1 - y0)) * (H - 2 * P);
  const inY = (y) => y >= y0 - (y1 - y0) * 2 && y <= y1 + (y1 - y0) * 2;

  const path = (c) => {
    let d = '', pen = false, prev = null;
    const a = c.from ?? x0, b = c.to ?? x1;
    const N = Math.max(60, Math.round((700 * (b - a)) / (x1 - x0)));
    for (let k = 0; k <= N; k++) {
      const x = a + ((b - a) * k) / N; const y = c.f(x);
      const ok = Number.isFinite(y) && inY(y) && !(prev !== null && Math.abs(y - prev) > (y1 - y0) * 0.35);
      if (ok) { d += `${pen ? 'L' : 'M'}${sx(x).toFixed(1)} ${sy(y).toFixed(1)}`; pen = true; } else pen = false;
      prev = Number.isFinite(y) ? y : null;
    }
    return d;
  };
  const area = (a) => {
    const N = 200; const top = []; const bot = [];
    for (let k = 0; k <= N; k++) {
      const x = a.from + ((a.to - a.from) * k) / N;
      const u = a.f(x), v = a.g(x);
      if (Number.isFinite(u) && Number.isFinite(v)) { top.push(`${sx(x).toFixed(1)} ${sy(u).toFixed(1)}`); bot.unshift(`${sx(x).toFixed(1)} ${sy(v).toFixed(1)}`); }
    }
    return top.length ? `M${top.join('L')}L${bot.join('L')}Z` : '';
  };

  const xs = niceStep(x1 - x0), ys = niceStep(y1 - y0);
  const ticksX = []; for (let v = Math.ceil(x0 / xs) * xs; v <= x1 + 1e-9; v += xs) ticksX.push(v);
  const ticksY = []; for (let v = Math.ceil(y0 / ys) * ys; v <= y1 + 1e-9; v += ys) ticksY.push(v);
  const ax = y0 <= 0 && y1 >= 0 ? sy(0) : H - P; // x o'qi qayerdan o'tadi
  const ay = x0 <= 0 && x1 >= 0 ? sx(0) : P;
  const id = `clip${Math.round(x0 * 7 + x1 * 13 + y0 * 17 + y1 * 19 + spec.curves.length)}`;
  const legend = [...spec.curves.map((c, i) => ({ c: color(c.color, i), l: c.label, kind: 'line' })), ...spec.areas.map((a, i) => ({ c: color(a.color, i), l: a.label, kind: 'area' }))].filter((x) => x.l);

  return (
    <figure className="my-6 overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200">
      {spec.title && <figcaption className="border-b border-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-700">{spec.title}</figcaption>}
      <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full" role="img" aria-label={spec.title || 'Funksiya grafigi'}>
        <defs><clipPath id={id}><rect x={P} y={P} width={W - 2 * P} height={H - 2 * P} /></clipPath></defs>
        {ticksX.map((v) => <line key={`gx${v}`} x1={sx(v)} x2={sx(v)} y1={P} y2={H - P} stroke="#E7ECE8" />)}
        {ticksY.map((v) => <line key={`gy${v}`} y1={sy(v)} y2={sy(v)} x1={P} x2={W - P} stroke="#E7ECE8" />)}
        <line x1={P} x2={W - P} y1={ax} y2={ax} stroke="#556560" strokeWidth="1.2" />
        <line y1={P} y2={H - P} x1={ay} x2={ay} stroke="#556560" strokeWidth="1.2" />
        <path d={`M${W - P} ${ax}l-7 -4v8z`} fill="#556560" />
        <path d={`M${ay} ${P}l-4 7h8z`} fill="#556560" />
        <text x={W - P + 4} y={ax + 4} fontSize="13" fill="#556560" fontStyle="italic">x</text>
        <text x={ay + 6} y={P - 8} fontSize="13" fill="#556560" fontStyle="italic">y</text>
        {ticksX.filter((v) => Math.abs(v) > 1e-9).map((v) => <text key={`tx${v}`} x={sx(v)} y={Math.min(ax + 16, H - 6)} fontSize="11" fill="#5F6D67" textAnchor="middle">{fmt(v)}</text>)}
        {ticksY.filter((v) => Math.abs(v) > 1e-9).map((v) => <text key={`ty${v}`} x={ay - 6} y={sy(v) + 4} fontSize="11" fill="#5F6D67" textAnchor="end">{fmt(v)}</text>)}
        <g clipPath={`url(#${id})`}>
          {spec.areas.map((a, i) => <path key={`a${i}`} d={area(a)} fill={color(a.color, i)} fillOpacity="0.18" stroke="none" />)}
          {spec.vlines.map((v, i) => <line key={`v${i}`} x1={sx(v.x)} x2={sx(v.x)} y1={P} y2={H - P} stroke="#E11D48" strokeDasharray="6 5" strokeWidth="1.4" />)}
          {spec.hlines.map((h, i) => <line key={`h${i}`} y1={sy(h.y)} y2={sy(h.y)} x1={P} x2={W - P} stroke="#E11D48" strokeDasharray="6 5" strokeWidth="1.4" />)}
          {spec.curves.map((c, i) => <path key={`c${i}`} d={path(c)} fill="none" stroke={color(c.color, i)} strokeWidth="2.6" strokeLinejoin="round" strokeLinecap="round" />)}
        </g>
        {spec.vlines.filter((v) => v.label).map((v, i) => <text key={`vl${i}`} x={sx(v.x) + 5} y={P + 14} fontSize="12" fill="#E11D48">{v.label}</text>)}
        {spec.hlines.filter((h) => h.label).map((h, i) => <text key={`hl${i}`} x={W - P - 4} y={sy(h.y) - 6} fontSize="12" fill="#E11D48" textAnchor="end">{h.label}</text>)}
        {spec.points.map((p, i) => (
          <g key={`p${i}`}>
            {p.open
              ? <circle cx={sx(p.x)} cy={sy(p.y)} r="5" fill="#fff" stroke="#0F1B1A" strokeWidth="2" />
              : <circle cx={sx(p.x)} cy={sy(p.y)} r="5" fill="#0F1B1A" stroke="#fff" strokeWidth="2" />}
            {p.label && <text x={sx(p.x) + 9} y={sy(p.y) - 9} fontSize="13" fontWeight="600" fill="#0F1B1A">{p.label}</text>}
          </g>
        ))}
      </svg>
      {legend.length > 0 && (
        <div className="flex flex-wrap gap-x-5 gap-y-1 border-t border-slate-100 px-4 py-2.5 text-sm text-slate-700">
          {legend.map((x, i) => (
            <span key={i} className="inline-flex items-center gap-2">
              <span className={x.kind === 'area' ? 'h-3 w-4 rounded-sm opacity-40' : 'h-1 w-5 rounded-full'} style={{ background: x.c }} />
              <span className="math">{x.l}</span>
            </span>
          ))}
        </div>
      )}
    </figure>
  );
}
