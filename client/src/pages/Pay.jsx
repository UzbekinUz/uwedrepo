import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api.js';
import { useSeo } from '../lib/seo.js';
import { Hint } from '../components/Motion.jsx';
import { ErrorBox, PageTitle, Spinner } from '../components/ui.jsx';
import { dateTime, money } from '../lib/format.js';
import { t } from '../lib/i18n.js';

const NAME = { payme: 'Payme', click: 'Click' };
const OPEN = ['created', 'pending'];

function Line({ label, children, strong }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5">
      <span className="text-sm text-slate-500">{label}</span>
      <span className={`text-right ${strong ? 'text-xl font-extrabold text-slate-900' : 'font-medium text-slate-800'}`}>{children}</span>
    </div>
  );
}

/** Bron va to'lov tafsilotlari (to'lovdan oldin ham, chekda ham) */
function Summary({ p }) {
  const b = p.booking || {};
  return (
    <div className="divide-y divide-slate-100">
      <Line label={t('Xizmat')}>{t('Repetitorlik darsi')}</Line>
      <Line label={t('Fan')}>{b.subject?.name || '—'}</Line>
      <Line label={t('Repetitor')}>{b.tutor?.user?.name || '—'}</Line>
      <Line label={t('Dars vaqti')}>{b.startsAt ? dateTime(b.startsAt) : '—'}</Line>
      <Line label={t("To'lov usuli")}>{NAME[p.provider]}</Line>
      <Line label={t('Jami')} strong>{money(p.amount)}</Line>
    </div>
  );
}

export default function Pay() {
  useSeo("To'lov", '', { noindex: true });
  const { id } = useParams();
  const navigate = useNavigate();
  const [p, setP] = useState(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const load = async () => {
    try { setP(await api(`/payments/${id}`)); } catch (e) { setErr(e.message); }
  };
  useEffect(() => { load(); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Haqiqiy rejim: talaba Payme/Click sahifasidan qaytganda, provayder tasdig'i kelguncha holat tekshirib turiladi
  useEffect(() => {
    if (!p || p.mode !== 'live' || !OPEN.includes(p.status)) return undefined;
    let n = 0;
    const timer = setInterval(async () => {
      n += 1;
      try {
        const x = await api(`/payments/${id}`);
        setP(x);
        if (!OPEN.includes(x.status) || n >= 40) clearInterval(timer);
      } catch {
        clearInterval(timer);
      }
    }, 3000);
    return () => clearInterval(timer);
  }, [id, p?.mode, p?.status]); // eslint-disable-line react-hooks/exhaustive-deps

  const confirmPay = async () => {
    setErr('');
    setBusy(true);
    try {
      await new Promise((ok) => setTimeout(ok, 1200)); // provayder bilan aloqa taqlidi
      setP(await api(`/payments/${id}/demo/confirm`, { method: 'POST' }));
    } catch (e) {
      setErr(e.message);
      load();
    } finally {
      setBusy(false);
    }
  };

  const cancelPay = async () => {
    setErr('');
    try {
      await api(`/payments/${id}/demo/cancel`, { method: 'POST' });
      navigate('/my');
    } catch (e) {
      setErr(e.message);
    }
  };

  if (!p && !err) return <Spinner />;
  if (!p) return (<><PageTitle title={t("To'lov")} /><ErrorBox error={err} /><Link to="/my" className="btn-ghost mt-4">{t('Mening darslarim')}</Link></>);

  const demo = p.mode === 'demo';
  return (
    <div className="mx-auto max-w-xl">
      <PageTitle title={t("To'lov")} sub={`${NAME[p.provider]} · ${money(p.amount)}`} back={{ to: '/my', label: t('Mening darslarim') }} />

      {demo && (
        <Hint kind="warn" title={t('Sinov rejimi')} className="mb-6">
          <p>{t("Bu to'lov sahifasi tizimni sinash uchun: kartangizdan pul yechilmaydi va karta ma'lumotlari so'ralmaydi.")}</p>
        </Hint>
      )}

      {p.status === 'paid' ? (
        <div className="card p-6">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-2xl text-emerald-700">✓</span>
            <div>
              <div className="text-xl font-extrabold text-slate-900">{t("To'lov qabul qilindi")}</div>
              <div className="text-sm text-slate-500">{t('Repetitor xabardor qilindi. Dars vaqtida u bilan Telegram orqali bog\'laning.')}</div>
            </div>
          </div>
          <div className="mt-5 rounded-xl bg-slate-50 px-4">
            <Line label={t("To'lov raqami")}><span className="font-mono">{String(p._id).slice(-8).toUpperCase()}</span></Line>
            <Line label={t('Sana')}>{p.paidAt ? dateTime(p.paidAt) : '—'}</Line>
            <Summary p={p} />
          </div>
          {demo && <p className="mt-4 chip bg-amber-100 text-amber-800">{t("Sinov to'lovi: pul yechilmagan")}</p>}
          {p.refunded && <p className="mt-4 chip bg-sky-100 text-sky-800">{t("To'lov qaytariladi")}</p>}
          <Link to="/my" className="btn-primary mt-6 w-full justify-center">{t('Mening darslarim')}</Link>
        </div>
      ) : p.status === 'cancelled' ? (
        <div className="card p-6">
          <div className="text-xl font-extrabold text-slate-900">{t("To'lov bekor qilindi")}</div>
          <p className="mt-1 text-sm text-slate-600">{p.refunded ? t("Pul kartangizga qaytariladi.") : t("Kartangizdan pul yechilmadi. Bron hali ochiq bo'lsa, «Mening darslarim» sahifasidan qayta to'lashingiz mumkin.")}</p>
          <div className="mt-4 rounded-xl bg-slate-50 px-4"><Summary p={p} /></div>
          <Link to="/my" className="btn-primary mt-6 w-full justify-center">{t('Mening darslarim')}</Link>
        </div>
      ) : demo ? (
        <div className="card p-6">
          <Summary p={p} />
          <ErrorBox error={err} />
          {busy ? (
            <div className="mt-6 flex items-center justify-center gap-3 rounded-xl bg-slate-50 py-4 text-slate-700">
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
              {t("To'lov amalga oshirilmoqda…")}
            </div>
          ) : (
            <div className="mt-6 flex flex-col gap-2 sm:flex-row">
              <button className="btn-primary flex-1 justify-center" onClick={confirmPay}>{t("To'lash")} · {money(p.amount)}</button>
              <button className="btn-ghost justify-center" onClick={cancelPay}>{t('Bekor qilish')}</button>
            </div>
          )}
        </div>
      ) : (
        <div className="card p-6">
          <div className="flex items-center gap-3 text-slate-700">
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
            {t("To'lov tasdiqlanishi kutilmoqda…")}
          </div>
          <p className="mt-2 text-sm text-slate-600">{t("{provider} to'lovni tasdiqlashi bilan bu sahifa o'zi yangilanadi. Agar to'lov sahifasini yopgan bo'lsangiz, «Mening darslarim»dan qayta «To'lash»ni bosing.", { provider: NAME[p.provider] })}</p>
          <div className="mt-4 rounded-xl bg-slate-50 px-4"><Summary p={p} /></div>
          <ErrorBox error={err} />
          <Link to="/my" className="btn-ghost mt-6 w-full justify-center">{t('Mening darslarim')}</Link>
        </div>
      )}
    </div>
  );
}
