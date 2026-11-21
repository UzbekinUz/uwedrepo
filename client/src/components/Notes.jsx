import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Plot, { parseSpec } from './Plot.jsx';
import { Icon } from './Motion.jsx';
import { Inline } from './MathText.jsx';

/**
 * Konspekt matnini chiroyli ko'rsatish (tashqi kutubxonasiz, xavfsiz: HTML ishlatilmaydi).
 *
 * Yozish qoidalari:
 *   ## Sarlavha, ### Kichik sarlavha
 *   Bo'sh qator — yangi xatboshi
 *   - ro'yxat, 1. raqamli ro'yxat
 *   $$ ... $$ — alohida qatorlardagi formula bloki (markazda)
 *   > Misol / Yechim / Eslatma — ramkali blok (ketma-ket > qatorlar bitta blok)
 *   | a | b | — jadval (|---| qatori o'tkazib yuboriladi)
 * Interaktiv bloklar (::: tur [sarlavha] … :::):
 *   maqsad, hayot, oddiy, tushuncha, formula, teorema, eslatma, xato, xulosa — rangli bloklar
 *   misol — shart, keyin «---» qatoridan so'ng yechim (tugma bosilganda ochiladi)
 *   test — «? savol», «- variant», «+ to'g'ri variant», «> izoh»
 *   mashq — «savol || javob» qatorlari (javob tugma bilan ochiladi)
 *   grafik — Plot.jsx dagi tavsif
 *   Bloklar ichma-ich bo'lishi mumkin (masalan, misol yechimi ichida grafik)
 * Qator ichida:
 *   **qalin**, `formula`, {surat|maxraj} — kasr (ichma-ich ham bo'ladi), ^{daraja} yoki x^2, _{indeks}, lim_{x→a}
 */


/** Jadval qatorini katakchalarga bo'lish: {…} ichidagi | (kasr) bo'luvchi emas */
function splitRow(r) {
  const cells = [];
  let d = 0, cur = '';
  for (const ch of r) {
    if (ch === '{') d++;
    if (ch === '}') d--;
    if (ch === '|' && d === 0) { cells.push(cur.trim()); cur = ''; } else cur += ch;
  }
  cells.push(cur.trim());
  return cells;
}

/** Sarlavhadan langar (id) yasash: «Ishlangan misollar» → ishlangan-misollar */
export const slug = (s) => String(s).toLowerCase().replace(/[^a-z0-9ʻ'‘’ʼ\s-]/gi, '').replace(/['‘’ʻʼ]/g, '').trim().replace(/\s+/g, '-');

/** Mundarija uchun ## sarlavhalar */
export function headings(src) {
  return String(src).split('\n').filter((l) => /^## /.test(l.trim())).map((l) => { const text = l.trim().slice(3); return { id: slug(text), text }; });
}

/** Konspekt statistikasi (sahifa boshidagi belgilar uchun) */
export function noteStats(src) {
  const t = String(src);
  return {
    minutes: Math.max(3, Math.round(t.split(/\s+/).length / 130)),
    examples: (t.match(/^::: ?misol/gm) || []).length,
    questions: (t.match(/^\? /gm) || []).length,
  };
}

/** Matnni bloklarga ajratish */
function parse(src, ctx = { misol: 0 }) {
  const lines = String(src).replace(/\r/g, '').split('\n');
  const blocks = [];
  let i = 0;
  while (i < lines.length) {
    const tr = lines[i].trim();
    if (!tr) { i++; continue; }
    // ::: konteyner
    const cm = /^:::\s*([a-z]+)\s*(.*)$/i.exec(tr);
    if (cm) {
      const type = cm[1].toLowerCase(); const title = cm[2].trim();
      // Ichki bloklar (masalan, misol yechimidagi grafik) ham bo'lishi mumkin: ochilish/yopilishni sanaymiz
      const inner = []; i++; let depth = 0;
      while (i < lines.length) {
        const t = lines[i].trim();
        if (t === ':::') { if (depth === 0) break; depth--; } else if (/^:::\s*[a-z]+/i.test(t)) depth++;
        inner.push(lines[i]); i++;
      }
      i++;
      if (type === 'misol') {
        const cut = inner.findIndex((l) => l.trim() === '---');
        ctx.misol += 1;
        blocks.push({ k: 'misol', n: ctx.misol, title, cond: parse((cut < 0 ? inner : inner.slice(0, cut)).join('\n'), ctx), sol: cut < 0 ? [] : parse(inner.slice(cut + 1).join('\n'), ctx) });
      } else if (type === 'test') {
        const qs = [];
        inner.map((l) => l.trim()).filter(Boolean).forEach((l) => {
          if (l.startsWith('? ')) qs.push({ q: l.slice(2), options: [], why: '' });
          else if (qs.length && (l.startsWith('- ') || l.startsWith('+ '))) qs[qs.length - 1].options.push({ text: l.slice(2), ok: l[0] === '+' });
          else if (qs.length && l.startsWith('> ')) qs[qs.length - 1].why += (qs[qs.length - 1].why ? ' ' : '') + l.slice(2);
        });
        blocks.push({ k: 'test', title, qs });
      } else if (type === 'mashq') {
        const items = inner.map((l) => l.trim()).filter(Boolean).map((l) => {
          const [q, a = ''] = l.replace(/^\d+[.)]\s*/, '').split('||');
          return { q: q.trim(), a: a.trim() };
        });
        blocks.push({ k: 'mashq', title, items });
      } else if (type === 'grafik') {
        blocks.push({ k: 'grafik', spec: parseSpec(title, inner.map((l) => l.trim()).filter(Boolean)) });
      } else {
        blocks.push({ k: 'call', type, title, children: parse(inner.join('\n'), ctx) });
      }
      continue;
    }
    if (tr.startsWith('$$')) {
      const body = [];
      const first = tr.slice(2).replace(/\$\$$/, '').trim();
      if (first) body.push(first);
      if (tr.length > 2 && tr.endsWith('$$') && tr !== '$$') { blocks.push({ k: 'math', lines: body }); i++; continue; }
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('$$')) { if (lines[i].trim()) body.push(lines[i].trim()); i++; }
      i++;
      blocks.push({ k: 'math', lines: body });
      continue;
    }
    if (tr.startsWith('### ')) { blocks.push({ k: 'h3', text: tr.slice(4) }); i++; continue; }
    if (tr.startsWith('## ')) { blocks.push({ k: 'h2', text: tr.slice(3) }); i++; continue; }
    if (tr.startsWith('>')) {
      const inner = [];
      while (i < lines.length && lines[i].trim().startsWith('>')) { inner.push(lines[i].trim().replace(/^>\s?/, '')); i++; }
      blocks.push({ k: 'box', children: parse(inner.join('\n'), ctx) });
      continue;
    }
    if (tr.startsWith('|')) {
      const rows = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        const r = lines[i].trim();
        if (!/^\|[\s:|-]+\|$/.test(r)) rows.push(splitRow(r.replace(/^\||\|$/g, '')));
        i++;
      }
      blocks.push({ k: 'table', rows });
      continue;
    }
    if (/^[-•]\s/.test(tr) || /^\d+[.)]\s/.test(tr)) {
      const ordered = /^\d/.test(tr);
      const items = [];
      while (i < lines.length && (ordered ? /^\d+[.)]\s/ : /^[-•]\s/).test(lines[i].trim())) {
        items.push(lines[i].trim().replace(ordered ? /^\d+[.)]\s/ : /^[-•]\s/, ''));
        i++;
      }
      blocks.push({ k: ordered ? 'ol' : 'ul', items });
      continue;
    }
    const para = [];
    while (i < lines.length && lines[i].trim() && !/^(#{2,3} |\$\$|>|\||[-•]\s|\d+[.)]\s|:::)/.test(lines[i].trim())) { para.push(lines[i].trim()); i++; }
    blocks.push({ k: 'p', text: para.join(' ') });
  }
  return blocks;
}

/* ---------- Rangli bloklar ---------- */
const CALL = {
  maqsad: { label: 'Bu mavzuda nimani o\'rganasiz', icon: 'search', box: 'bg-sky-50 ring-sky-200', head: 'text-sky-800', ic: 'bg-sky-100 text-sky-700' },
  hayot: { label: 'Hayotda qayerda kerak?', icon: 'globe', box: 'bg-amber-50 ring-amber-200', head: 'text-amber-900', ic: 'bg-amber-100 text-amber-800' },
  oddiy: { label: 'Oddiy qilib aytganda', icon: 'chat', box: 'bg-violet-50 ring-violet-200', head: 'text-violet-900', ic: 'bg-violet-100 text-violet-700' },
  tushuncha: { label: 'Ta\'rif', icon: 'book', box: 'bg-brand-50 ring-brand-100', head: 'text-brand-700', ic: 'bg-brand-100 text-brand-700' },
  formula: { label: 'Asosiy formula', icon: 'star', box: 'bg-white ring-2 ring-brand-300', head: 'text-brand-700', ic: 'bg-brand-100 text-brand-700' },
  teorema: { label: 'Teorema', icon: 'shield', box: 'bg-indigo-50 ring-indigo-200', head: 'text-indigo-900', ic: 'bg-indigo-100 text-indigo-700' },
  eslatma: { label: 'Maslahat', icon: 'info', box: 'bg-emerald-50 ring-emerald-200', head: 'text-emerald-900', ic: 'bg-emerald-100 text-emerald-700' },
  xato: { label: 'Ko\'p uchraydigan xato', icon: 'warn', box: 'bg-rose-50 ring-rose-200', head: 'text-rose-900', ic: 'bg-rose-100 text-rose-700' },
  xulosa: { label: 'Qisqacha xulosa', icon: 'check', box: 'bg-field text-white ring-field', head: 'text-brand-300', ic: 'bg-white/10 text-brand-300', dark: true },
};

function Callout({ type, title, children }) {
  const c = CALL[type] || CALL.eslatma;
  return (
    <div className={`not-prose my-6 rounded-2xl px-4 py-4 ring-1 sm:px-6 sm:py-5 ${c.box} ${c.dark ? 'notes-dark' : ''}`}>
      <div className={`mb-1 flex items-center gap-2.5 text-sm font-bold uppercase tracking-wide ${c.head}`}>
        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${c.ic}`}><Icon name={c.icon} size={18} /></span>
        <span>{title ? <Inline text={title} /> : c.label}</span>
      </div>
      <Blocks blocks={children} />
    </div>
  );
}

/* ---------- Misol: avval o'zingiz, keyin yechim ---------- */
function Misol({ b }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="my-6 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
      <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50 px-4 py-2.5 sm:px-6">
        <span className="rounded-full bg-slate-900 px-3 py-0.5 text-xs font-bold uppercase tracking-wide text-white">{b.n}-misol</span>
        {b.title && <span className="text-sm font-semibold text-slate-700"><Inline text={b.title} /></span>}
      </div>
      <div className="px-4 pt-2 sm:px-6"><Blocks blocks={b.cond} /></div>
      {b.sol.length > 0 && (
        <div className="px-4 pb-4 sm:px-6">
          <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open}
            className={`mt-1 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${open ? 'bg-slate-100 text-slate-700 hover:bg-slate-200' : 'bg-brand-600 text-white hover:bg-brand-700'}`}>
            {open ? 'Yechimni yashirish' : 'Yechimni ko\'rish'}
            <span className={`transition ${open ? 'rotate-180' : ''}`}>▾</span>
          </button>
          {!open && <span className="ml-3 text-xs text-slate-500">Avval o'zingiz yechib ko'ring</span>}
          <AnimatePresence initial={false}>
            {open && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }} className="overflow-hidden">
                <div className="mt-4 border-l-4 border-brand-300 pl-4"><Blocks blocks={b.sol} /></div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

/* ---------- Mini test: bosilganda darhol tekshiradi ---------- */
function Test({ b }) {
  const [ans, setAns] = useState({});
  const done = Object.keys(ans).length;
  const right = b.qs.filter((q, i) => ans[i] !== undefined && q.options[ans[i]]?.ok).length;
  return (
    <div className="my-8 rounded-3xl bg-gradient-to-br from-brand-50 to-white p-4 ring-1 ring-brand-100 sm:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 text-lg font-extrabold text-slate-900">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-600 text-white"><Icon name="check" size={20} /></span>
          {b.title ? <Inline text={b.title} /> : 'O\'zingizni tekshiring'}
        </div>
        <span className="rounded-full bg-white px-3 py-1 text-sm font-semibold text-slate-700 ring-1 ring-slate-200">{right} / {b.qs.length} to'g'ri</span>
      </div>
      <ol className="space-y-4">
        {b.qs.map((q, qi) => {
          const picked = ans[qi];
          return (
            <li key={qi} className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
              <div className="mb-3 font-semibold text-slate-900"><span className="mr-1 text-brand-700">{qi + 1}.</span> <Inline text={q.q} /></div>
              <div className="grid gap-2 sm:grid-cols-2">
                {q.options.map((o, oi) => {
                  const state = picked === undefined ? 'idle' : o.ok ? 'ok' : picked === oi ? 'bad' : 'off';
                  const cls = { idle: 'bg-slate-50 ring-slate-200 hover:bg-brand-50 hover:ring-brand-300', ok: 'bg-emerald-50 ring-emerald-400 text-emerald-900', bad: 'bg-rose-50 ring-rose-400 text-rose-900', off: 'bg-slate-50 ring-slate-100 opacity-60' }[state];
                  return (
                    <button key={oi} type="button" disabled={picked !== undefined} onClick={() => setAns({ ...ans, [qi]: oi })}
                      className={`flex items-center gap-2 rounded-xl px-3 py-2.5 text-left text-[0.97rem] ring-1 transition ${cls}`}>
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-xs font-bold ring-1 ring-slate-300">{state === 'ok' ? '✓' : state === 'bad' ? '✗' : 'ABCD'[oi]}</span>
                      <span className="math-soft"><Inline text={o.text} /></span>
                    </button>
                  );
                })}
              </div>
              {picked !== undefined && (
                <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className={`mt-3 text-sm ${q.options[picked]?.ok ? 'text-emerald-800' : 'text-rose-800'}`}>
                  <strong>{q.options[picked]?.ok ? 'To\'g\'ri! ' : 'Noto\'g\'ri. '}</strong><Inline text={q.why} />
                </motion.p>
              )}
            </li>
          );
        })}
      </ol>
      {done === b.qs.length && b.qs.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white p-4 ring-1 ring-slate-200">
          <span className="font-semibold text-slate-900">
            {right === b.qs.length ? 'Ajoyib! Hammasi to\'g\'ri 🎉' : right >= b.qs.length / 2 ? 'Yaxshi natija! Xato qilgan joyingizni qayta ko\'rib chiqing.' : 'Mavzuni yana bir bor o\'qib chiqing va qayta urinib ko\'ring.'}
          </span>
          <button type="button" className="btn-ghost btn-sm" onClick={() => setAns({})}>Qaytadan</button>
        </div>
      )}
    </div>
  );
}

/* ---------- Mashqlar: javobi yashirin ---------- */
function Mashq({ b }) {
  const [open, setOpen] = useState({});
  return (
    <div className="my-6 rounded-2xl bg-white ring-1 ring-slate-200">
      <div className="flex items-center gap-2.5 border-b border-slate-100 px-4 py-3 font-bold text-slate-900 sm:px-6">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 text-amber-800"><Icon name="file" size={18} /></span>
        {b.title ? <Inline text={b.title} /> : 'Mustaqil ishlash uchun'}
      </div>
      <ol className="divide-y divide-slate-100">
        {b.items.map((it, i) => (
          <li key={i} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:gap-4 sm:px-6">
            <span className="w-6 shrink-0 font-extrabold text-brand-700">{i + 1}.</span>
            <span className="min-w-0 flex-1 text-slate-800"><Inline text={it.q} /></span>
            {it.a && (open[i]
              ? <button type="button" onClick={() => setOpen({ ...open, [i]: false })} className="shrink-0 rounded-xl bg-emerald-50 px-3 py-1.5 text-left text-sm font-semibold text-emerald-900 ring-1 ring-emerald-200"><Inline text={it.a} /></button>
              : <button type="button" onClick={() => setOpen({ ...open, [i]: true })} className="shrink-0 rounded-full bg-slate-100 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-200">Javob</button>)}
          </li>
        ))}
      </ol>
    </div>
  );
}

function Blocks({ blocks }) {
  return blocks.map((b, i) => {
    switch (b.k) {
      case 'h2': return <h2 key={i} id={slug(b.text)} className="mt-12 scroll-mt-24 text-[1.7rem] font-extrabold leading-tight tracking-tight text-slate-900 first:mt-0"><Inline text={b.text} /></h2>;
      case 'h3': return <h3 key={i} className="mt-7 text-xl font-bold text-slate-900"><Inline text={b.text} /></h3>;
      case 'math': return (
        <div key={i} className="math my-4 overflow-x-auto rounded-xl bg-slate-50/80 px-4 py-3 text-center text-[1.12rem] text-slate-900 ring-1 ring-slate-200">
          {b.lines.map((l, j) => <div key={j} className="py-1"><Inline text={l} /></div>)}
        </div>
      );
      case 'box': return <div key={i} className="my-5 rounded-2xl border-l-4 border-brand-500 bg-brand-50/70 px-4 py-3 sm:px-5"><Blocks blocks={b.children} /></div>;
      case 'call': return <Callout key={i} type={b.type} title={b.title}>{b.children}</Callout>;
      case 'misol': return <Misol key={i} b={b} />;
      case 'test': return <Test key={i} b={b} />;
      case 'mashq': return <Mashq key={i} b={b} />;
      case 'grafik': return <Plot key={i} spec={b.spec} />;
      case 'table': return (
        <div key={i} className="my-5 overflow-x-auto rounded-xl ring-1 ring-slate-200">
          <table className="w-full text-left text-[0.95rem]">
            <thead className="bg-slate-50"><tr>{b.rows[0].map((c, j) => <th key={j} className="px-3 py-2.5 font-bold text-slate-900"><Inline text={c} /></th>)}</tr></thead>
            <tbody>{b.rows.slice(1).map((r, j) => <tr key={j} className="border-t border-slate-100">{r.map((c, k) => <td key={k} className="px-3 py-2.5 text-slate-800"><Inline text={c} /></td>)}</tr>)}</tbody>
          </table>
        </div>
      );
      case 'ul': return <ul key={i} className="my-3 space-y-2 pl-1">{b.items.map((x, j) => <li key={j} className="flex gap-3"><span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" /><span className="min-w-0"><Inline text={x} /></span></li>)}</ul>;
      case 'ol': return <ol key={i} className="my-3 space-y-2">{b.items.map((x, j) => <li key={j} className="flex gap-3"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">{j + 1}</span><span className="min-w-0"><Inline text={x} /></span></li>)}</ol>;
      default: return <p key={i} className="my-3 leading-[1.75]"><Inline text={b.text} /></p>;
    }
  });
}

export default function Notes({ text }) {
  return <div className="notes text-[1.06rem] text-slate-800"><Blocks blocks={parse(text)} /></div>;
}
