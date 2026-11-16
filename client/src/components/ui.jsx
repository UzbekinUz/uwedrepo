import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { t } from '../lib/i18n.js';

export function Spinner() {
  return <div className="flex justify-center py-16"><div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-brand-600" role="status" aria-label="Loading" /></div>;
}

export const ErrorBox = ({ error }) => error ? <div role="alert" className="rounded-md bg-red-50 px-4 py-3 text-sm font-medium text-red-800">{t(error)}</div> : null;
export const Empty = ({ children }) => <div className="card px-6 py-16 text-center text-base text-slate-600">{children}</div>;

export function Stars({ value = 0, count, size = 'text-base' }) {
  return (
    <span className={`inline-flex items-center gap-1 ${size}`} aria-label={`${t('Reyting')} ${value} / 5`}>
      <span className="text-amber-400">{'★'.repeat(Math.round(value))}<span className="text-slate-300">{'★'.repeat(5 - Math.round(value))}</span></span>
      {count != null && <span className="text-xs text-slate-500">{count ? `${value.toFixed(1)} (${count})` : t("Hali baho yo'q")}</span>}
    </span>
  );
}

/** Raketa timsoli (o'zimiz chizgan SVG): yuqoriga uchayotgan raketa va olovli izi */
export function Rocket({ className = '' }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 120 200" className={className} fill="none">
      <defs>
        <linearGradient id="rk-body" x1="0" x2="1"><stop offset="0" stopColor="#ffffff" /><stop offset="1" stopColor="#cfe9e5" /></linearGradient>
        <linearGradient id="rk-flame" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ffe08a" /><stop offset=".5" stopColor="#ff9f43" /><stop offset="1" stopColor="#ff6b6b" stopOpacity="0" /></linearGradient>
      </defs>
      {/* olov */}
      <path className="rocket-flame" d="M48 132 Q60 196 72 132 Z" fill="url(#rk-flame)" />
      {/* qanotlar */}
      <path d="M40 96 L18 132 L42 124 Z" fill="#5EE0D2" />
      <path d="M80 96 L102 132 L78 124 Z" fill="#5EE0D2" />
      {/* korpus */}
      <path d="M60 8 C84 30 88 74 80 128 L40 128 C32 74 36 30 60 8 Z" fill="url(#rk-body)" />
      <path d="M60 8 C70 18 76 30 79 44 L41 44 C44 30 50 18 60 8 Z" fill="#12918B" />
      {/* illyuminator */}
      <circle cx="60" cy="74" r="12" fill="#0E2627" stroke="#5EE0D2" strokeWidth="4" />
      <circle cx="56" cy="70" r="3.5" fill="#ffffff" opacity=".7" />
      <path d="M46 128 L74 128 L70 138 L50 138 Z" fill="#0A7E7A" />
    </svg>
  );
}

/** Bosh sahifadagi fon: kosmik (yashil tumanlik) rasm, ustidan matn o'qilishi uchun to'q qatlam; ixtiyoriy raketa */
export function HeroBg({ rocket = false }) {
  return (
    <>
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[url('/space-tall.jpg')] bg-cover bg-center sm:bg-[url('/space-wide.jpg')]" />
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-gradient-to-r from-field/85 via-field/55 to-field/30" />
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_85%_15%,rgba(94,224,210,0.14),transparent_55%)]" />
      {rocket && (
        <div aria-hidden="true" className="pointer-events-none absolute right-[4%] top-6 hidden w-16 rotate-[30deg] opacity-90 sm:block lg:w-20">
          <Rocket className="rocket-float h-auto w-full drop-shadow-[0_0_18px_rgba(94,224,210,0.45)]" />
        </div>
      )}
    </>
  );
}

/** Sahifa sarlavhasi: bosh sahifadagidek to'q fonli to'liq kenglikdagi bant. back = { to, label } */
export function PageTitle({ title, sub, children, back }) {
  return (
    <section className="relative left-1/2 -mt-12 mb-10 w-screen -translate-x-1/2 overflow-hidden bg-field text-white sm:-mt-16">
      <HeroBg rocket />
      <div className="relative mx-auto flex max-w-6xl flex-wrap items-end justify-between gap-4 px-4 py-10 sm:px-6 sm:py-14">
        <div className="max-w-3xl">
          {back && <Link to={back.to} className="mb-4 inline-block text-sm font-semibold text-brand-300 hover:text-white">← {back.label}</Link>}
          <h1 className="text-[clamp(2rem,5vw,3.75rem)] font-extrabold leading-[1.02] tracking-[-0.03em] text-white">{title}</h1>
          {sub && <p className="mt-4 text-base text-slate-300 sm:text-lg">{sub}</p>}
        </div>
        {children}
      </div>
    </section>
  );
}

/** Tablar: chiziq o'rniga to'ldirilgan faol holat */
export function Tabs({ tabs, value, onChange }) {
  return (
    <div className="mb-8 flex gap-2 overflow-x-auto pb-1" role="tablist">
      {tabs.map(([k, l]) => (
        <button key={k} role="tab" aria-selected={value === k} onClick={() => onChange(k)} className={`choice whitespace-nowrap ${value === k ? 'choice-on' : ''}`}>{l}</button>
      ))}
    </div>
  );
}

/** Ma'lumot yuklash uchun oddiy hook */
export function useFetch(path, deps = []) {
  const [state, set] = useState({ data: null, error: '', loading: true });
  useEffect(() => {
    let off = false;
    set((s) => ({ ...s, loading: true }));
    api(path).then((data) => !off && set({ data, error: '', loading: false })).catch((e) => !off && set({ data: null, error: e.message, loading: false }));
    return () => { off = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, ...deps]);
  return state;
}

export function Select({ value, onChange, children, ...p }) {
  return <select className="input" value={value} onChange={(e) => onChange(e.target.value)} {...p}>{children}</select>;
}

export function Field({ label, children }) {
  return <label className="block"><span className="label">{t(label)}</span>{children}</label>;
}
