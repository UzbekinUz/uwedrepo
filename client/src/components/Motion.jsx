import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, animate, motion, useInView, useReducedMotion } from 'framer-motion';
import { t } from '../lib/i18n.js';

/* ---------- Animatsiyali ikonkalar (o'zimiz chizgan, 24x24, chiziqli) ---------- */
const PATHS = {
  book: ['M5 4h13a1 1 0 0 1 1 1v14H6a2 2 0 0 0-2 2V5a1 1 0 0 1 1-1z', 'M4 21a2 2 0 0 1 2-2h13', 'M9 8h6'],
  person: ['M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8z', 'M4 21c0-4 3.6-7 8-7s8 3 8 7'],
  calendar: ['M4 6h16v14H4z', 'M4 10h16', 'M8 3v4', 'M16 3v4', 'M8 14h2', 'M12 14h2', 'M8 17h2'],
  file: ['M6 3h8l4 4v14H6z', 'M14 3v4h4', 'M9 12h6', 'M9 16h6'],
  telegram: ['M21 4L3 11l6 2 2 6 3-4 5 4z', 'M9 13l12-9'],
  star: ['M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z'],
  shield: ['M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z', 'M9 12l2 2 4-4'],
  tag: ['M3 12V4h8l10 10-8 8z', 'M7.5 8.5h.01'],
  percent: ['M5 19L19 5', 'M7 9a2 2 0 1 0 0-4 2 2 0 0 0 0 4z', 'M17 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4z'],
  lock: ['M6 11h12v10H6z', 'M8 11V8a4 4 0 0 1 8 0v3', 'M12 15v2'],
  globe: ['M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z', 'M3 12h18', 'M12 3c3 3 3 15 0 18', 'M12 3c-3 3-3 15 0 18'],
  clock: ['M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z', 'M12 7v5l3 2'],
  check: ['M5 12l4 4 10-10'],
  cross: ['M6 6l12 12', 'M18 6L6 18'],
  info: ['M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z', 'M12 11v5', 'M12 8h.01'],
  warn: ['M12 3l10 18H2z', 'M12 10v5', 'M12 18h.01'],
  card: ['M3 6h18v12H3z', 'M3 10h18', 'M7 15h3'],
  search: ['M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14z', 'M21 21l-5-5'],
  chat: ['M4 5h16v11H9l-5 4z', 'M8 9h8', 'M8 12h5'],
  plus: ['M12 5v14', 'M5 12h14'],
};

/** Ko'ringanda chiziladigan ikonka; `float` bo'lsa, yengil suzib turadi.
 *  Ota-komponent animatsiyalariga bog'liq emas: har bir chiziq o'z holatini o'zi boshqaradi. */
export function Icon({ name, size = 28, className = '', float = false, delay = 0 }) {
  const ref = useRef(null);
  const seen = useInView(ref, { once: true, margin: '-40px' });
  const svg = (
    <motion.svg ref={ref} viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"
      className={className} aria-hidden="true" whileHover={{ scale: 1.12, rotate: [0, -6, 6, 0], transition: { duration: 0.5 } }}>
      {PATHS[name].map((d, i) => (
        <motion.path key={i} d={d} initial={{ pathLength: 0, opacity: 0 }} animate={seen ? { pathLength: 1, opacity: 1 } : { pathLength: 0, opacity: 0 }}
          transition={{ duration: 0.8, delay: i * 0.12, ease: 'easeOut' }} />
      ))}
    </motion.svg>
  );
  if (!float) return svg;
  return (
    <motion.span className="inline-flex" animate={{ y: [0, -5, 0] }} transition={{ duration: 3.2 + delay, repeat: Infinity, ease: 'easeInOut', delay }}>
      {svg}
    </motion.span>
  );
}

/** Dumaloq fonli ikonka (xususiyatlar ro'yxati uchun) */
export function IconBadge({ name, tone = 'brand', delay = 0, size = 30 }) {
  const tones = { brand: 'bg-brand-100 text-brand-700', light: 'bg-white text-brand-700', dark: 'bg-white/10 text-brand-300', amber: 'bg-amber-100 text-amber-800' };
  return (
    <span className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full ${tones[tone]}`}>
      <Icon name={name} size={size} float delay={delay} />
    </span>
  );
}

/* ---------- Ko'ringanda paydo bo'lish ---------- */
export function Reveal({ children, delay = 0, y = 28, className = '', as = 'div' }) {
  const M = motion[as];
  return (
    <M className={className} initial={{ opacity: 0, y }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}>
      {children}
    </M>
  );
}

const group = { hidden: {}, show: { transition: { staggerChildren: 0.09 } } };
const item = { hidden: { opacity: 0, y: 26 }, show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } } };
export function Stagger({ children, className = '', as = 'div' }) {
  const M = motion[as];
  return <M className={className} variants={group} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-60px' }}>{children}</M>;
}
export function Item({ children, className = '', as = 'div' }) {
  const M = motion[as];
  return <M className={className} variants={item}>{children}</M>;
}

/** Raqam 0 dan sanab chiqadi */
export function CountUp({ to, className = '', duration = 1.4 }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const reduce = useReducedMotion();
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!inView) return undefined;
    if (reduce) { setV(to); return undefined; }
    const c = animate(0, to, { duration, ease: 'easeOut', onUpdate: (x) => setV(Math.round(x)) });
    return () => c.stop();
  }, [inView, to, duration, reduce]);
  return <span ref={ref} className={className}>{v}</span>;
}

/* ---------- Animatsiyali fon: o'zbek naqshidagi sakkiz qirrali yulduzlar ---------- */
const STARS = [
  { x: '4%', y: '10%', s: 150, d: 110 }, { x: '78%', y: '-8%', s: 260, d: 160 }, { x: '90%', y: '62%', s: 130, d: 90 },
  { x: '30%', y: '72%', s: 200, d: 140 }, { x: '55%', y: '38%', s: 90, d: 70 }, { x: '-6%', y: '80%', s: 170, d: 120 },
];
const DOTS = [
  { x: '14%', y: '30%', d: 5 }, { x: '48%', y: '12%', d: 6.5 }, { x: '70%', y: '55%', d: 4.5 }, { x: '86%', y: '28%', d: 7 }, { x: '38%', y: '90%', d: 5.5 },
];
export function StarField({ className = 'text-white', opacity = 0.07 }) {
  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`} aria-hidden="true">
      {STARS.map((st, i) => (
        <motion.svg key={i} viewBox="-50 -50 100 100" width={st.s} height={st.s} className="absolute" style={{ left: st.x, top: st.y, opacity }}
          animate={{ rotate: i % 2 ? -360 : 360 }} transition={{ duration: st.d, repeat: Infinity, ease: 'linear' }}>
          <g fill="none" stroke="currentColor" strokeWidth="1.6">
            <rect x="-30" y="-30" width="60" height="60" />
            <rect x="-30" y="-30" width="60" height="60" transform="rotate(45)" />
            <circle r="14" />
          </g>
        </motion.svg>
      ))}
      {DOTS.map((p, i) => (
        <motion.span key={i} className="absolute h-2 w-2 rounded-full bg-current" style={{ left: p.x, top: p.y, opacity: opacity * 3 }}
          animate={{ y: [0, -18, 0], opacity: [opacity * 2, opacity * 4, opacity * 2] }} transition={{ duration: p.d, repeat: Infinity, ease: 'easeInOut', delay: i * 0.6 }} />
      ))}
    </div>
  );
}

/* ---------- Tushuntirish va ogohlantirish bloklari ---------- */
const KINDS = {
  info: { icon: 'info', box: 'bg-brand-50 text-slate-900', ic: 'text-brand-700' },
  warn: { icon: 'warn', box: 'bg-amber-50 text-amber-950', ic: 'text-amber-700' },
  ok: { icon: 'check', box: 'bg-emerald-50 text-emerald-950', ic: 'text-emerald-700' },
};
export function Hint({ kind = 'info', title, children, className = '' }) {
  const k = KINDS[kind];
  return (
    <motion.div role={kind === 'warn' ? 'alert' : 'note'} className={`flex gap-4 rounded-md p-4 sm:p-5 ${k.box} ${className}`}
      initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45 }}>
      <motion.span className={`mt-0.5 shrink-0 ${k.ic}`} animate={kind === 'warn' ? { rotate: [0, -8, 8, -4, 0] } : { scale: [1, 1.12, 1] }}
        transition={{ duration: kind === 'warn' ? 1.2 : 2.4, repeat: Infinity, repeatDelay: kind === 'warn' ? 3.5 : 1.5 }}>
        <Icon name={k.icon} size={24} />
      </motion.span>
      <div className="min-w-0 text-base leading-relaxed">
        {title && <div className="mb-1 font-bold">{title}</div>}
        <div className="space-y-2 [&_li]:ml-5 [&_li]:list-disc">{children}</div>
      </div>
    </motion.div>
  );
}

/** Kichik (i) tugma: bosilganda qisqa izoh chiqadi */
export function InfoTip({ text, label }) {
  const [open, setOpen] = useState(false);
  return (
    <span className="relative inline-flex align-middle">
      <button type="button" className="rounded-full text-brand-700 hover:text-brand-600" aria-expanded={open} aria-label={label || t('Izoh')}
        onClick={() => setOpen(!open)} onBlur={() => setOpen(false)} onKeyDown={(e) => e.key === 'Escape' && setOpen(false)}>
        <Icon name="info" size={20} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.span role="tooltip" className="absolute left-1/2 top-full z-30 mt-2 w-64 -translate-x-1/2 rounded-md bg-slate-900 p-3 text-left text-sm font-normal normal-case leading-relaxed text-white"
            initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18 }}>
            {text}
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
}

/** Savol-javob: silliq ochiladi */
export function Accordion({ items }) {
  const [open, setOpen] = useState(0);
  return (
    <div className="space-y-3">
      {items.map(([q, a], i) => {
        const on = open === i;
        return (
          <div key={q} className="bg-white">
            <button type="button" className="flex w-full items-center justify-between gap-4 p-5 text-left text-lg font-bold text-slate-900 sm:p-6" aria-expanded={on} onClick={() => setOpen(on ? -1 : i)}>
              <span>{q}</span>
              <motion.span animate={{ rotate: on ? 45 : 0 }} className="shrink-0 text-brand-700"><Icon name="plus" size={26} /></motion.span>
            </button>
            <AnimatePresence initial={false}>
              {on && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease: 'easeOut' }} className="overflow-hidden">
                  <p className="px-5 pb-6 text-base leading-relaxed text-slate-700 sm:px-6">{a}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
