import { useEffect, useState } from 'react';
import { api, getToken, qs } from '../../api.js';
import { useFetch } from '../../components/ui.jsx';
import { Hint, InfoTip } from '../../components/Motion.jsx';

export { Hint, InfoTip, useFetch };
export { money, dateTime } from '../../lib/format.js';

/** Bo'lim sarlavhasi + "bu bo'lim nima qiladi" izohi */
export function Section({ title, intro, actions, children }) {
  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 className="text-3xl font-extrabold tracking-[-0.02em] text-slate-900">{title}</h2>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
      {intro && <Hint title="Bu bo'lim nima qiladi">{intro}</Hint>}
      {children}
    </section>
  );
}

export function Stat({ label, value, hint, tip, warn }) {
  return (
    <div className={`p-5 ${warn ? 'bg-amber-50' : 'bg-white'}`}>
      <div className="flex items-center gap-1.5 text-sm font-medium text-slate-600">{label}{tip && <InfoTip text={tip} />}</div>
      <div className="mt-1 text-3xl font-extrabold tracking-tight text-slate-900">{value ?? '—'}</div>
      {hint && <div className="mt-0.5 text-sm text-slate-600">{hint}</div>}
    </div>
  );
}
export const StatGrid = ({ children }) => <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">{children}</div>;

export function Chip({ tone = 'slate', children }) {
  const t = { slate: 'bg-slate-100 text-slate-700', green: 'bg-emerald-100 text-emerald-800', amber: 'bg-amber-100 text-amber-800', red: 'bg-red-100 text-red-700', blue: 'bg-sky-100 text-sky-800', brand: 'bg-brand-100 text-brand-700' }[tone];
  return <span className={`chip ${t}`}>{children}</span>;
}

export const STATUS_TONE = { pending: ['amber', 'Kutilmoqda'], confirmed: ['blue', "To'lov kutilmoqda"], paid: ['green', "To'langan"], completed: ['slate', "O'tgan"], cancelled: ['red', 'Bekor qilingan'], approved: ['green', 'Tasdiqlangan'], rejected: ['red', 'Rad etilgan'] };
export const StatusChip = ({ s }) => <Chip tone={STATUS_TONE[s]?.[0]}>{STATUS_TONE[s]?.[1] || s}</Chip>;

export function Pager({ page, pages, total, onPage }) {
  return (
    <div className="flex items-center justify-between gap-3 pt-2 text-sm text-slate-600">
      <span>Jami: <b className="text-slate-900">{total}</b></span>
      <div className="flex items-center gap-2">
        <button className="btn-ghost btn-sm" disabled={page <= 1} onClick={() => onPage(page - 1)}>← Oldingi</button>
        <span>{page} / {pages}</span>
        <button className="btn-ghost btn-sm" disabled={page >= pages} onClick={() => onPage(page + 1)}>Keyingi →</button>
      </div>
    </div>
  );
}

/** Sahifalangan ro'yxat: filtr o'zgarsa 1-sahifaga qaytadi */
export function useList(path, params = {}) {
  const [page, setPage] = useState(1);
  const [n, setN] = useState(0);
  const key = JSON.stringify(params);
  useEffect(() => { setPage(1); }, [key]);
  const res = useFetch(`${path}${qs({ ...params, page })}`, [n]);
  return { ...res, page, setPage, reload: () => setN((x) => x + 1) };
}

/** Amal bajarish: xato/muvaffaqiyat xabari bilan */
export function useAct() {
  const [err, setErr] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const run = async (fn, ok = '') => {
    setErr(''); setMsg(''); setBusy(true);
    try { const r = await fn(); if (ok) setMsg(ok); return r; } catch (e) { setErr(e.message); return null; } finally { setBusy(false); }
  };
  return { run, err, msg, busy, setErr, setMsg };
}

/** Himoyalangan CSV yuklab olish (Authorization sarlavhasi bilan) */
export async function download(path, filename) {
  const r = await fetch(`${import.meta.env.VITE_API_URL || '/api'}${path}`, { headers: { Authorization: `Bearer ${getToken()}` } });
  if (!r.ok) throw new Error('Yuklab bo\'lmadi');
  const url = URL.createObjectURL(await r.blob());
  const a = Object.assign(document.createElement('a'), { href: url, download: filename });
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}
export const CsvButton = ({ path, name, label = 'CSV yuklab olish' }) => {
  const { run, err } = useAct();
  return <button className="btn-ghost btn-sm" title={err} onClick={() => run(() => download(path, name))}>{label}</button>;
};

/** Kunlik ustunli diagramma (kutubxonasiz SVG) */
export function BarChart({ title, data, color = '#0A7E7A', note }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const total = data.reduce((a, d) => a + d.value, 0);
  const w = 600; const h = 110; const bw = w / data.length;
  return (
    <div className="bg-white p-5">
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="font-bold text-slate-900">{title}</h3>
        <span className="text-sm text-slate-600">30 kunda: <b className="text-slate-900">{total}</b></span>
      </div>
      <svg viewBox={`0 0 ${w} ${h + 18}`} className="mt-3 w-full" role="img" aria-label={`${title}: 30 kunda jami ${total}`}>
        {data.map((d, i) => {
          const bh = Math.max(d.value ? 3 : 1, (d.value / max) * h);
          return <rect key={i} x={i * bw + 2} y={h - bh} width={bw - 4} height={bh} fill={d.value ? color : '#D6DED9'}><title>{`${d.label}: ${d.value}`}</title></rect>;
        })}
        <text x="0" y={h + 14} fontSize="11" fill="#556560">{data[0]?.label}</text>
        <text x={w} y={h + 14} fontSize="11" fill="#556560" textAnchor="end">{data.at(-1)?.label}</text>
      </svg>
      {note && <p className="mt-1 text-sm text-slate-600">{note}</p>}
    </div>
  );
}

export function Table({ head, children, empty }) {
  return (
    <div className="overflow-x-auto bg-white">
      <table className="w-full min-w-[40rem] text-left text-sm">
        <thead><tr className="bg-slate-100 text-slate-800">{head.map((h) => <th key={h} className="whitespace-nowrap px-4 py-3 font-semibold">{h}</th>)}</tr></thead>
        <tbody className="[&>tr:nth-child(even)]:bg-slate-50 [&_td]:px-4 [&_td]:py-3 [&_td]:align-top">{children}</tbody>
      </table>
      {empty && <div className="p-8 text-center text-slate-600">{empty}</div>}
    </div>
  );
}

export const Filters = ({ children }) => <div className="flex flex-wrap items-end gap-3">{children}</div>;
export const FField = ({ label, children, className = '' }) => <label className={`block ${className}`}><span className="label">{label}</span>{children}</label>;
