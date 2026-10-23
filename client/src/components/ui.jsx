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

export function PageTitle({ title, sub, children }) {
  return (
    <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
      <div className="max-w-3xl">
        <h1 className="text-[clamp(2rem,5vw,3.75rem)] font-extrabold leading-[1.02] tracking-[-0.03em] text-slate-900">{title}</h1>
        {sub && <p className="mt-4 text-base text-slate-600 sm:text-lg">{sub}</p>}
      </div>
      {children}
    </div>
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
