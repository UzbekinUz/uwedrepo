import { useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useApp } from '../context/App.jsx';
import { LANGS, t } from '../lib/i18n.js';

const links = [
  ['/subjects', 'Fanlar'],
  ['/tutors', 'Repetitorlar'],
  ['/calendar', 'Nazoratlar'],
  ['/materials', 'Materiallar'],
];

function LangSwitch() {
  const { lang, changeLang } = useApp();
  return (
    <select className="cursor-pointer rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-800" value={lang} onChange={(e) => changeLang(e.target.value)} aria-label="Language">
      {LANGS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
    </select>
  );
}

export default function Layout() {
  const { user, logout, meta } = useApp();
  const [open, setOpen] = useState(false);
  const nav = useNavigate();
  const { pathname } = useLocation();
  const cls = ({ isActive }) => `rounded-full px-3.5 py-2 text-sm font-medium transition ${isActive ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-100'}`;
  const close = () => setOpen(false);
  const tutorLabel = user?.role === 'tutor' ? t('Repetitor paneli') : t("Repetitor bo'lish");
  const home = pathname === '/';

  return (
    <div className="flex min-h-screen flex-col">
      {meta?.banner && (
        <div role="status" className={`px-4 py-2 text-center text-sm font-medium ${meta.banner.kind === 'warn' ? 'bg-amber-100 text-amber-950' : 'bg-brand-100 text-slate-900'}`}>{meta.banner.text}</div>
      )}
      <header className="sticky top-0 z-30 bg-white">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2.5 text-xl font-extrabold tracking-tight text-field" onClick={close} aria-label="UWEDRepo">
            <img src="/logo-icon.png" width="36" height="36" alt="" className="h-9 w-9" />
            <span>UWED<span className="text-brand-600">Repo</span></span>
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            {links.map(([to, label]) => <NavLink key={to} to={to} className={cls}>{t(label)}</NavLink>)}
          </nav>
          <div className="hidden items-center gap-2 md:flex">
            <LangSwitch />
            {user ? (
              <>
                <NavLink to="/my" className={cls}>{t('Darslarim')}</NavLink>
                <NavLink to="/tutor" className={cls}>{tutorLabel}</NavLink>
                {user.role === 'admin' && <NavLink to="/admin" className={cls}>Admin</NavLink>}
                <button className="btn-ghost btn-sm" onClick={() => { logout(); nav('/'); }}>{t('Chiqish')}</button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn-ghost btn-sm">{t('Kirish')}</Link>
                <Link to="/register" className="btn-primary btn-sm">{t("Ro'yxatdan o'tish")}</Link>
              </>
            )}
          </div>
          <div className="flex items-center gap-2 md:hidden">
            <LangSwitch />
            <button className="rounded-full p-2 hover:bg-slate-100" onClick={() => setOpen(!open)} aria-label={t('Menyu')} aria-expanded={open}>
              <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d={open ? 'M6 6l12 12M18 6L6 18' : 'M4 7h16M4 12h16M4 17h16'} /></svg>
            </button>
          </div>
        </div>
        {open && (
          <div className="flex flex-col gap-1 bg-white px-4 pb-4 md:hidden" onClick={close}>
            {links.map(([to, label]) => <NavLink key={to} to={to} className={cls}>{t(label)}</NavLink>)}
            {user ? (
              <>
                <NavLink to="/my" className={cls}>{t('Darslarim')}</NavLink>
                <NavLink to="/tutor" className={cls}>{tutorLabel}</NavLink>
                {user.role === 'admin' && <NavLink to="/admin" className={cls}>Admin</NavLink>}
                <button className="btn-ghost mt-2" onClick={() => { logout(); nav('/'); }}>{t('Chiqish')} ({user.name})</button>
              </>
            ) : (
              <><Link to="/login" className="btn-ghost mt-2">{t('Kirish')}</Link><Link to="/register" className="btn-primary">{t("Ro'yxatdan o'tish")}</Link></>
            )}
          </div>
        )}
      </header>

      <main className={home ? 'flex-1' : 'mx-auto w-full max-w-6xl flex-1 px-4 py-12 sm:px-6 sm:py-16'}>
        <motion.div key={pathname} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: 'easeOut' }}><Outlet /></motion.div>
      </main>

      <footer className="mt-24 bg-field text-slate-300">
        <div className="mx-auto max-w-6xl px-4 pb-6 pt-16 sm:px-6">
          <div className="flex flex-wrap items-start justify-between gap-8">
            <p className="max-w-sm text-base text-slate-300">{t('UWED talabalari uchun repetitorlar, materiallar va nazorat sanalari — bir joyda.')}</p>
            <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium text-white">
              {links.map(([to, label]) => <Link key={to} to={to} className="hover:text-brand-300">{t(label)}</Link>)}
              <Link to="/#qanday" className="hover:text-brand-300">{t('Qanday ishlaydi')}</Link>
              <Link to="/#savol" className="hover:text-brand-300">{t('Savol-javob')}</Link>
              <Link to="/survey" className="hover:text-brand-300">{t("So'rovnomada qatnashing")}</Link>
            </nav>
          </div>
          <div className="select-none pt-14 text-[clamp(3.5rem,17vw,15rem)] font-extrabold leading-[0.85] tracking-[-0.05em] text-brand-600" aria-hidden="true"><span className="text-slate-300">UWED</span>Repo</div>
        </div>
      </footer>
    </div>
  );
}
