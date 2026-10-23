import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { useApp } from '../context/App.jsx';
import { ErrorBox, Field } from '../components/ui.jsx';
import { Hint, Icon } from '../components/Motion.jsx';
import { t } from '../lib/i18n.js';

const benefits = () => [
  t("Repetitorga dars bron qilish va platforma ichida to'lash"),
  t('Fakultet va kursingizni eslab qolish: hamma sahifa shunga moslashadi'),
  t("O'tgan darsga baho va sharh qoldirish"),
  t("Material ulashish va nazoratlar kalendaridan foydalanish"),
  t('Repetitor bo\'lib, o\'z jadvalingiz bilan daromad olish'),
];

/** Chapda: ro'yxatdan o'tgach nimalar olinishi; o'ngda: forma */
function Shell({ title, sub, children, foot }) {
  return (
    <div className="mx-auto grid max-w-5xl gap-10 lg:grid-cols-[1fr_1.05fr] lg:items-start">
      <div className="order-2 space-y-5 lg:order-1 lg:pt-4">
        <h2 className="text-3xl font-extrabold leading-tight tracking-[-0.02em] sm:text-4xl">{t('Ro\'yxatdan o\'tgach nimalar olasiz')}</h2>
        <ul className="space-y-3">
          {benefits().map((b) => (
            <li key={b} className="flex gap-3 text-base text-slate-800"><span className="mt-0.5 shrink-0 text-brand-600"><Icon name="check" size={24} /></span>{b}</li>
          ))}
        </ul>
        <Hint kind="info" title={t('Telegram bot nima qiladi')}>
          <p>{t("Bot faqat tasdiqlash kodini yuboradi. Siz o'zingiz Start bosmaguningizcha sizga xabar yubormaydi, parolingizni so'ramaydi.")}</p>
        </Hint>
        <Hint kind="warn" title={t('Kodni hech kimga bermang')}>
          <p>{t("Kodni faqat shu saytdagi maydonga kiriting. UWEDRepo xodimlari ham kodni so'ramaydi.")}</p>
        </Hint>
      </div>
      <div className="order-1 lg:order-2">
        <div className="card space-y-6 p-6 sm:p-10">
          <div>
            <h1 className="text-4xl font-extrabold leading-none tracking-[-0.03em]">{title}</h1>
            {sub && <p className="mt-3 text-base text-slate-600">{sub}</p>}
          </div>
          {children}
        </div>
        <p className="mt-5 text-center text-base text-slate-600">{foot}</p>
      </div>
    </div>
  );
}

function useAfterLogin() {
  const { login } = useApp();
  const nav = useNavigate();
  const { state } = useLocation();
  return (r) => { login(r.token, r.user); nav(state?.from || '/', { replace: true }); };
}

/** Telegram bot orqali: bot ochiladi → Start → kod keladi → kod saytga kiritiladi */
function TelegramAuth({ withProfile }) {
  const { meta, pref } = useApp();
  const done = useAfterLogin();
  const [sess, setSess] = useState(null);
  const [started, setStarted] = useState(false);
  const [code, setCode] = useState('');
  const [profile, setProfile] = useState({ faculty: pref?.faculty || '', year: pref?.year || '' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const create = useCallback(async () => {
    try { setErr(''); setStarted(false); setCode(''); setSess(await api('/auth/telegram/start', { method: 'POST' })); }
    catch (e) { setErr(e.message); }
  }, []);
  useEffect(() => { create(); }, [create]);

  // Bot "Start" bosilganini bilish uchun (kodning o'zi qaytarilmaydi)
  useEffect(() => {
    if (!sess || started) return undefined;
    const id = setInterval(async () => {
      try {
        const s = await api(`/auth/telegram/status/${sess.token}`);
        if (s.expired) create(); else if (s.started) setStarted(true);
      } catch { /* keyingi urinish */ }
    }, 2000);
    return () => clearInterval(id);
  }, [sess, started, create]);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setErr('');
    try {
      const body = { token: sess.token, code };
      if (withProfile && profile.faculty) { body.faculty = profile.faculty; body.year = Number(profile.year) || 1; }
      done(await api('/auth/telegram/verify', { method: 'POST', body }));
    } catch (er) {
      setErr(er.message);
      if (er.status === 410 || er.status === 429) create();
    } finally { setBusy(false); }
  };

  return (
    <form onSubmit={submit} className="space-y-5">
      {withProfile && (
        <div className="grid grid-cols-2 gap-3">
          <Field label="Fakultet"><select className="input" value={profile.faculty} onChange={(e) => setProfile({ ...profile, faculty: e.target.value })}><option value="">—</option>{meta.faculties.map((x) => <option key={x.key} value={x.key}>{t(x.name)}</option>)}</select></Field>
          <Field label="Kurs"><select className="input" value={profile.year} onChange={(e) => setProfile({ ...profile, year: e.target.value })}><option value="">—</option>{[1, 2, 3, 4].map((y) => <option key={y} value={y}>{t('{n}-kurs', { n: y })}</option>)}</select></Field>
        </div>
      )}

      <div>
        <p className="mb-3 text-base font-medium text-slate-900">{t('Botda Start tugmasini bosing — bot sizga kod yuboradi.')}</p>
        <a href={sess?.url || '#'} target="_blank" rel="noopener noreferrer" aria-disabled={!sess}
          className={`btn-primary w-full py-3 text-base ${sess ? '' : 'pointer-events-none opacity-50'}`}>{t('Telegram orqali kod olish')}</a>
        {started && <p className="mt-3 text-base font-medium text-brand-700">{t('Kod botda tayyor. Uni quyiga kiriting.')}</p>}
      </div>

      <Field label="Tasdiqlash kodi">
        <input className="input !py-3 text-center text-2xl font-bold tracking-[0.4em]" inputMode="numeric" autoComplete="one-time-code" pattern="\d{6}" maxLength={6} placeholder="••••••"
          value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} required />
      </Field>
      <ErrorBox error={err} />
      <button className="btn-primary w-full py-3 text-base" disabled={busy || code.length !== 6 || !sess}>{t('Tasdiqlash')}</button>
      <p className="text-sm text-slate-600">{t("Kodni kiritganingizda Telegram ismingiz va username'ingiz akkauntga ulanadi. Kod 10 daqiqa amal qiladi.")}</p>
    </form>
  );
}

function EmailLoginForm() {
  const [f, setF] = useState({ email: '', password: '' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const done = useAfterLogin();
  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setErr('');
    try { done(await api('/auth/login', { method: 'POST', body: f })); } catch (er) { setErr(er.message); } finally { setBusy(false); }
  };
  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="Email"><input className="input" type="email" required autoComplete="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></Field>
      <Field label="Parol"><input className="input" type="password" required autoComplete="current-password" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} /></Field>
      <ErrorBox error={err} />
      <button className="btn-primary w-full py-3 text-base" disabled={busy}>{t('Kirish')}</button>
    </form>
  );
}

function EmailRegisterForm() {
  const { meta, pref } = useApp();
  const [f, setF] = useState({ name: '', email: '', password: '', telegram: '', faculty: pref?.faculty || '', year: pref?.year || '' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const done = useAfterLogin();
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setErr('');
    try {
      done(await api('/auth/register', { method: 'POST', body: { ...f, year: f.year ? Number(f.year) : undefined, faculty: f.faculty || undefined, telegram: f.telegram || undefined } }));
    } catch (er) { setErr(er.message); } finally { setBusy(false); }
  };
  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="Ism familiya"><input className="input" required minLength={2} autoComplete="name" value={f.name} onChange={set('name')} /></Field>
      <Field label="Email"><input className="input" type="email" required autoComplete="email" value={f.email} onChange={set('email')} /></Field>
      <Field label="Parol (kamida 8 belgi)"><input className="input" type="password" required minLength={8} autoComplete="new-password" value={f.password} onChange={set('password')} /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Fakultet"><select className="input" value={f.faculty} onChange={set('faculty')}><option value="">—</option>{meta.faculties.map((x) => <option key={x.key} value={x.key}>{t(x.name)}</option>)}</select></Field>
        <Field label="Kurs"><select className="input" value={f.year} onChange={set('year')}><option value="">—</option>{[1, 2, 3, 4].map((y) => <option key={y} value={y}>{t('{n}-kurs', { n: y })}</option>)}</select></Field>
      </div>
      <Field label="Telegram (ixtiyoriy)"><input className="input" placeholder="@username" value={f.telegram} onChange={set('telegram')} /></Field>
      <ErrorBox error={err} />
      <button className="btn-primary w-full py-3 text-base" disabled={busy}>{t("Ro'yxatdan o'tish")}</button>
    </form>
  );
}

export function Login() {
  const { meta } = useApp();
  const [email, setEmail] = useState(!meta.telegramLogin);
  return (
    <Shell title={t('Kirish')} foot={<>{t("Akkauntingiz yo'qmi?")} <Link to="/register" className="font-semibold text-brand-700 underline">{t("Ro'yxatdan o'ting")}</Link></>}>
      {meta.telegramLogin && !email && <TelegramAuth />}
      {email && <EmailLoginForm />}
      {meta.telegramLogin && (
        <button type="button" className="text-sm font-semibold text-brand-700 underline" onClick={() => setEmail(!email)}>
          {email ? t('Telegram orqali kirish') : t('Email bilan kirish')}
        </button>
      )}
    </Shell>
  );
}

export function Register() {
  const { meta } = useApp();
  return (
    <Shell title={t("Ro'yxatdan o'tish")}
      sub={meta.telegramLogin ? t("Parol shart emas: Telegram bot orqali kod olasiz.") : t("Telegram bot hali sozlanmagan, hozircha email bilan ro'yxatdan o'ting.")}
      foot={<>{t('Akkauntingiz bormi?')} <Link to="/login" className="font-semibold text-brand-700 underline">{t('Kirish')}</Link></>}>
      {!meta.registrationOpen ? (
        <Hint kind="warn" title={t("Hozircha yangi ro'yxatdan o'tish yopiq")}><p>{t("Mavjud akkaunt egalari kirishda davom etadi. Keyinroq qayta urinib ko'ring.")}</p></Hint>
      ) : meta.telegramLogin ? <TelegramAuth withProfile /> : <EmailRegisterForm />}
    </Shell>
  );
}
