import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { useApp } from '../context/App.jsx';
import { useSeo } from '../lib/seo.js';
import { Hint } from '../components/Motion.jsx';
import { ErrorBox, PageTitle, Spinner } from '../components/ui.jsx';
import { dateTime, money } from '../lib/format.js';
import { t } from '../lib/i18n.js';

const PROVIDER = { payme: 'Payme', click: 'Click' };
const PLAN_TITLE = { month: '1 oy', semester: 'Semestr (4 oy)', year: '1 yil' };

/** Bepul va Premium imkoniyatlari jadvali */
function Compare({ s }) {
  const rows = [
    [t('Konspektlar, mashq testlari, nazorat kalendari'), '✓', '✓'],
    [t('Repetitor topish va bron qilish'), '✓', '✓'],
    [t('AI izohlari («Nega noto\'g\'ri?»)'), t('kuniga {n} ta', { n: s.freeAiDailyLimit }), t('kuniga {n} ta', { n: s.aiDailyLimit })],
    [t('«Mening xatolarim»: barcha testlardagi xatolar to\'g\'ri javob va izoh bilan'), '—', '✓'],
    [t('Konspektni PDF qilib saqlash va chop etish'), '—', '✓'],
    [t('Repetitor darslariga chegirma'), '—', `${s.lessonDiscount}%`],
    [t('Profilda Premium belgisi'), '—', '★'],
  ];
  return (
    <div className="card overflow-hidden">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-white/60">
            <th className="p-4 font-semibold text-slate-600">{t('Imkoniyat')}</th>
            <th className="p-4 text-center font-semibold text-slate-600">{t('Bepul')}</th>
            <th className="p-4 text-center font-bold text-amber-800">★ Premium</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([label, free, prem]) => (
            <tr key={label} className="border-b border-slate-100 last:border-0">
              <td className="p-4 text-slate-800">{label}</td>
              <td className="p-4 text-center text-slate-500">{free}</td>
              <td className="p-4 text-center font-semibold text-slate-900">{prem}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Faq({ s }) {
  const items = [
    [t('Obuna avtomatik yangilanadimi?'), t("Yo'q. Siz tanlagan muddat uchun bir marta to'laysiz. Muddat tugaganda kartangizdan hech narsa yechilmaydi, Premium shunchaki to'xtaydi. Xohlasangiz, keyin yana sotib olasiz.")],
    [t("Premium faol bo'lganda yana sotib olsam-chi?"), t("Yangi muddat hozirgi muddat oxiriga qo'shiladi, kunlaringiz yo'qolmaydi.")],
    [t('Premiumni bepul olish mumkinmi?'), t("Ha: {trial} kunlik bepul sinov (bir marta). Yana: siz yuklagan konspekt yoki material administrator tomonidan tasdiqlansa, sizga {reward} kunlik Premium beriladi.", { trial: s.trialDays, reward: s.rewardDays })],
    [t('Repetitor chegirmasi qanday ishlaydi?'), t("Premium faol bo'lganda qilingan har bir bronga {d}% chegirma avtomatik qo'llanadi (birinchi dars chegirmasi bilan qo'shilmaydi). Chegirma platforma komissiyasidan beriladi, repetitor daromadi kamaymaydi.", { d: s.lessonDiscount })],
    [t("Pulni qaytarish mumkinmi?"), t("Texnik xato yoki ikki marta to'lov bo'lsa — albatta. Administratorga Telegram orqali yozing.")],
  ];
  return (
    <div className="space-y-2">
      {items.map(([q, a]) => (
        <details key={q} className="card group p-5">
          <summary className="cursor-pointer list-none font-semibold text-slate-900">{q}</summary>
          <p className="mt-2 text-sm text-slate-600">{a}</p>
        </details>
      ))}
    </div>
  );
}

export default function Premium() {
  useSeo('UWEDRepo Premium', "Premium: ko'proq AI izohlari, «Mening xatolarim», konspektlarni PDF qilib saqlash va repetitor darslariga chegirma. Avtomatik yechib olish yo'q.");
  const { user, meta, refreshUser } = useApp();
  const navigate = useNavigate();
  const [s, setS] = useState(null);
  const [plan, setPlan] = useState('semester');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const payment = meta?.payment || { mode: 'demo', providers: ['payme', 'click'] };

  const load = async () => {
    try { setS(await api('/premium')); } catch (e) { setErr(e.message); }
  };
  useEffect(() => { load(); }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const needLogin = () => navigate('/login', { state: { from: '/premium' } });

  const buy = async (provider) => {
    if (!user) return needLogin();
    setErr('');
    setBusy(true);
    try {
      const r = await api('/premium/checkout', { method: 'POST', body: { plan, provider } });
      if (r.url.startsWith('/')) navigate(r.url);
      else window.location.assign(r.url);
    } catch (e) {
      setErr(e.message);
      setBusy(false);
    }
  };

  const trial = async () => {
    if (!user) return needLogin();
    setErr('');
    setBusy(true);
    try {
      setS({ ...s, ...(await api('/premium/trial', { method: 'POST' })) });
      await refreshUser();
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  if (!s && !err) return <Spinner />;
  if (!s) return (<><PageTitle title="UWEDRepo Premium" /><ErrorBox error={err} /></>);

  const best = s.plans.reduce((a, p) => (p.price / p.days < a.price / a.days ? p : a), s.plans[0]);
  const monthly = s.plans.find((p) => p.key === 'month');
  const chosen = s.plans.find((p) => p.key === plan) || s.plans[0];

  return (
    <>
      <PageTitle title="UWEDRepo Premium" sub={t("Nazoratga tezroq tayyorlaning: ko'proq AI izohlari, barcha xatolaringiz bir joyda, konspektlar PDF'da va repetitor darslariga chegirma.")} />

      {!s.enabled && <Hint kind="warn" className="mb-6"><p>{t('Premium obuna hozircha yopiq.')}</p></Hint>}

      {s.active && (
        <div className="card mb-8 flex flex-wrap items-center justify-between gap-4 bg-amber-50/80 p-6">
          <div>
            <div className="text-xl font-extrabold text-slate-900">★ {t('Premium faol')}</div>
            <div className="text-sm text-slate-600">{t('{date} gacha', { date: dateTime(s.until) })}</div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to="/mistakes" className="btn-ghost btn-sm">{t('Mening xatolarim')}</Link>
            <Link to="/materials" className="btn-ghost btn-sm">{t('Konspektlar')}</Link>
          </div>
        </div>
      )}

      <ErrorBox error={err} />

      {s.enabled && (
        <section className="mb-12">
          <h2 className="mb-4 text-2xl font-extrabold text-slate-900">{s.active ? t('Muddatni uzaytirish') : t('Rejani tanlang')}</h2>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {s.plans.map((p) => {
              const on = plan === p.key;
              const perMonth = Math.round((p.price / p.days) * 30);
              const save = monthly && p.key !== 'month' ? Math.round((1 - perMonth / monthly.price) * 100) : 0;
              return (
                <button key={p.key} type="button" onClick={() => setPlan(p.key)} aria-pressed={on}
                  className={`card relative p-6 text-left transition ${on ? 'ring-2 ring-amber-400' : 'hover:bg-white/80'}`}>
                  {p.key === best.key && p.key !== 'month' && <span className="chip absolute right-4 top-4 bg-amber-300 text-amber-950">{t('Eng foydali')}</span>}
                  <div className="text-sm font-semibold text-slate-600">{t(PLAN_TITLE[p.key] || p.title)}</div>
                  <div className="mt-2 text-3xl font-extrabold text-slate-900">{money(p.price)}</div>
                  <div className="mt-1 text-sm text-slate-600">≈ {money(perMonth)} / {t('oy')}{save > 0 ? ` · ${t('{n}% tejaysiz', { n: save })}` : ''}</div>
                </button>
              );
            })}
          </div>

          <div className="card mt-4 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="text-sm text-slate-700">
                {t('Tanlandi')}: <b>{t(PLAN_TITLE[chosen.key] || chosen.title)}</b> · {money(chosen.price)} · {t("bir martalik to'lov, avtomatik yechib olinmaydi")}
              </div>
              <div className="flex flex-wrap gap-2">
                {payment.providers.map((k) => (
                  <button key={k} className="btn-primary btn-sm" disabled={busy} onClick={() => buy(k)}>{t('{p} orqali to\'lash', { p: PROVIDER[k] })}</button>
                ))}
              </div>
            </div>
            {payment.mode === 'demo' && <Hint kind="warn" className="mt-4"><p>{t("Sinov rejimi: to'lov sahifasi ishlaydi, lekin haqiqiy pul yechilmaydi.")}</p></Hint>}
          </div>

          {s.trialAvailable && (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-emerald-50 p-5 ring-1 ring-emerald-200">
              <div className="text-sm text-emerald-900"><b>{t('{n} kun bepul sinab ko\'ring', { n: s.trialDays })}</b> — {t("karta kerak emas, muddat tugagach o'zi to'xtaydi.")}</div>
              <button className="btn-primary btn-sm" disabled={busy} onClick={trial}>{t('Bepul sinovni boshlash')}</button>
            </div>
          )}
          {!user && <p className="mt-3 text-sm text-slate-600">{t("Sotib olish yoki sinovni boshlash uchun avval saytga kiring.")}</p>}
        </section>
      )}

      <section className="mb-12">
        <h2 className="mb-4 text-2xl font-extrabold text-slate-900">{t('Bepul va Premium')}</h2>
        <Compare s={s} />
      </section>

      <section className="mb-12">
        <h2 className="mb-4 text-2xl font-extrabold text-slate-900">{t('Premiumni bepul oling')}</h2>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="card p-6">
            <div className="text-lg font-bold text-slate-900">{t('{n} kunlik bepul sinov', { n: s.trialDays })}</div>
            <p className="mt-1 text-sm text-slate-600">{t("Har bir talabaga bir marta. Karta so'ralmaydi.")}</p>
          </div>
          <div className="card p-6">
            <div className="text-lg font-bold text-slate-900">{t('Material yuklang — {n} kun Premium', { n: s.rewardDays })}</div>
            <p className="mt-1 text-sm text-slate-600">{t("O'z konspektingiz yoki foydali materialni «Materiallar» bo'limida yuklang. Administrator tasdiqlasa, Premium avtomatik beriladi.")}</p>
            <Link to="/materials" className="btn-ghost btn-sm mt-3">{t('Material yuklash')}</Link>
          </div>
        </div>
      </section>

      {s.history?.length > 0 && (
        <section className="mb-12">
          <h2 className="mb-4 text-2xl font-extrabold text-slate-900">{t("To'lovlarim")}</h2>
          <div className="card divide-y divide-slate-100">
            {s.history.map((h) => (
              <Link key={h._id} to={`/pay/${h._id}`} className="flex flex-wrap items-center justify-between gap-2 p-4 hover:bg-white/60">
                <span className="font-medium text-slate-800">{t(PLAN_TITLE[h.plan] || h.plan)} · {PROVIDER[h.provider]}</span>
                <span className="text-sm text-slate-600">
                  {h.paidAt ? dateTime(h.paidAt) : ''} · {money(h.amount)}
                  {h.mode === 'demo' && <span className="chip ml-2 bg-amber-100 text-amber-800">{t("Sinov to'lovi")}</span>}
                  {h.refunded && <span className="chip ml-2 bg-sky-100 text-sky-800">{t('Qaytarilgan')}</span>}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-4 text-2xl font-extrabold text-slate-900">{t('Savollar')}</h2>
        <Faq s={s} />
      </section>
    </>
  );
}
