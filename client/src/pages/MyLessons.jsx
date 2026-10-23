import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { Hint } from '../components/Motion.jsx';
import { ErrorBox, Empty, PageTitle, Spinner, useFetch } from '../components/ui.jsx';
import { STATUS, dateTime, money, tgLink } from '../lib/format.js';
import { t } from '../lib/i18n.js';

const METHODS = [['click', 'Click'], ['payme', 'Payme'], ['card', 'Bank kartasi']];

function Review({ booking, onDone }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [err, setErr] = useState('');
  const send = async () => {
    try { await api(`/bookings/${booking._id}/review`, { method: 'POST', body: { rating, comment: comment || undefined } }); onDone(); }
    catch (e) { setErr(e.message); }
  };
  return (
    <div className="mt-3 space-y-2 rounded-lg bg-slate-50 p-3">
      <div className="flex items-center gap-2 text-sm">{t('Baho:')}
        {[1, 2, 3, 4, 5].map((n) => <button key={n} type="button" onClick={() => setRating(n)} aria-label={`${n} ★`} className={`text-2xl ${n <= rating ? 'text-amber-400' : 'text-slate-300'}`}>★</button>)}
      </div>
      <textarea className="input" rows={2} maxLength={800} placeholder={t('Sharh (ixtiyoriy)')} value={comment} onChange={(e) => setComment(e.target.value)} />
      <ErrorBox error={err} />
      <button className="btn-primary btn-sm" onClick={send}>{t('Baholash')}</button>
    </div>
  );
}

function BookingCard({ b, reload }) {
  const [payOpen, setPayOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [err, setErr] = useState('');
  const act = async (fn) => { setErr(''); try { await fn(); reload(); } catch (e) { setErr(e.message); } };
  const st = STATUS[b.status];
  const handle = b.tutor?.user?.telegram || b.tutor?.telegram;
  const phone = b.tutor?.user?.phone;
  const msg = t('Assalomu alaykum! UWEDRepo orqali {subject} fanidan {time} ga dars bron qildim.', { subject: b.subject?.name, time: dateTime(b.startsAt) });

  return (
    <div className="card p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <Link to={`/tutors/${b.tutor?._id}`} className="font-semibold text-slate-900 hover:text-brand-600">{b.tutor?.user?.name}</Link>
          <div className="text-sm text-slate-500">{b.subject?.name} · {dateTime(b.startsAt)}</div>
        </div>
        <span className={`chip ${st.cls}`}>{st.label}</span>
      </div>
      <div className="mt-2 text-sm text-slate-600">
        {b.discount > 0 && <span className="text-slate-400 line-through">{money(b.price)} </span>}
        <b>{money(b.total)}</b>{b.discount > 0 && <span className="ml-1 text-emerald-600">({t('talaba chegirmasi')} −{money(b.discount)})</span>}
        {b.refunded && <span className="ml-2 chip bg-sky-100 text-sky-800">{t("To'lov qaytariladi")}</span>}
      </div>
      <ErrorBox error={err} />
      <div className="mt-3 flex flex-wrap gap-2">
        {b.status === 'confirmed' && <button className="btn-primary btn-sm" onClick={() => setPayOpen(!payOpen)}>{t("To'lash")}</button>}
        {['confirmed', 'paid'].includes(b.status) && tgLink(handle, msg) && <a className="btn-ghost btn-sm" target="_blank" rel="noopener noreferrer" href={tgLink(handle, msg)}>{t('Telegramda yozish')}</a>}
        {['confirmed', 'paid'].includes(b.status) && !tgLink(handle, msg) && phone && <a className="btn-ghost btn-sm" href={`tel:${phone}`}>{phone}</a>}
        {b.status === 'completed' && !b.reviewed && <button className="btn-ghost btn-sm" onClick={() => setReviewOpen(!reviewOpen)}>{t('Baho berish')}</button>}
        {b.status === 'completed' && b.reviewed && <span className="text-sm text-slate-500">{t('Baho berilgan')} ✓</span>}
        {['pending', 'confirmed', 'paid'].includes(b.status) && <button className="btn-ghost btn-sm text-red-600" onClick={() => confirm(t('Bronni bekor qilasizmi?')) && act(() => api(`/bookings/${b._id}/cancel`, { method: 'PATCH' }))}>{t('Bekor qilish')}</button>}
      </div>
      {payOpen && (
        <div className="mt-3 rounded-lg bg-slate-50 p-3">
          <div className="mb-2 text-sm font-medium">{t("To'lov usuli:")}</div>
          <div className="flex flex-wrap gap-2">{METHODS.map(([k, l]) => <button key={k} className="btn-ghost btn-sm" onClick={() => act(() => api(`/bookings/${b._id}/pay`, { method: 'POST', body: { method: k } }))}>{t(l)} · {money(b.total)}</button>)}</div>
          <Hint kind="warn" className="mt-3"><p>{t("Pilot rejimi: haqiqiy pul yechilmaydi.")}</p></Hint>
        </div>
      )}
      {reviewOpen && <Review booking={b} onDone={() => { setReviewOpen(false); reload(); }} />}
    </div>
  );
}

export default function MyLessons() {
  const [n, setN] = useState(0);
  const { data, loading, error } = useFetch('/bookings/mine', [n]);
  const reload = () => setN((x) => x + 1);
  const upcoming = (data || []).filter((b) => ['pending', 'confirmed', 'paid'].includes(b.status));
  const past = (data || []).filter((b) => !['pending', 'confirmed', 'paid'].includes(b.status));

  return (
    <>
      <PageTitle title={t('Mening darslarim')} sub={t("Kelgusi darslar va o'tgan darslarni baholash")} />
      <Hint className="mb-8" title={t('Holatlar nimani bildiradi')}>
        <ul>
          <li><b>{t('Kutilmoqda')}</b> — {t('repetitor hali javob bermadi.')}</li>
          <li><b>{t("To'lov kutilmoqda")}</b> — {t("repetitor tasdiqladi, endi «To'lash» tugmasini bosing.")}</li>
          <li><b>{t("To'langan")}</b> — {t("dars vaqtida repetitor bilan Telegram orqali bog'laning.")}</li>
          <li><b>{t("O'tgan")}</b> — {t('dars o\'tdi, endi baho berishingiz mumkin.')}</li>
        </ul>
      </Hint>
      <ErrorBox error={error} />
      {loading ? <Spinner /> : !data?.length ? <Empty>{t('Hali dars bron qilmagansiz.')} <Link className="text-brand-600 underline" to="/tutors">{t('Repetitor toping →')}</Link></Empty> : (
        <div className="space-y-8">
          <section><h2 className="mb-3 font-semibold">{t('Kelgusi')} ({upcoming.length})</h2><div className="grid gap-3 md:grid-cols-2">{upcoming.map((b) => <BookingCard key={b._id} b={b} reload={reload} />)}</div></section>
          <section><h2 className="mb-3 font-semibold">{t('Oldingi')} ({past.length})</h2><div className="grid gap-3 md:grid-cols-2">{past.map((b) => <BookingCard key={b._id} b={b} reload={reload} />)}</div></section>
        </div>
      )}
    </>
  );
}
