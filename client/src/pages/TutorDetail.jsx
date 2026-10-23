import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api.js';
import { useApp } from '../context/App.jsx';
import { ErrorBox, Spinner, Stars, useFetch } from '../components/ui.jsx';
import { Hint, InfoTip } from '../components/Motion.jsx';
import { FORMAT_LABEL, LANG_LABEL, DAYS, dayKey, dayLabel, hhmm, money } from '../lib/format.js';
import { t } from '../lib/i18n.js';

function Booking({ tutor }) {
  const { user, meta } = useApp();
  const nav = useNavigate();
  const { data: slots, loading } = useFetch(`/tutors/${tutor._id}/slots`);
  const [subject, setSubject] = useState(tutor.subjects[0]?._id || '');
  const [slot, setSlot] = useState('');
  const [note, setNote] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const days = useMemo(() => {
    const m = new Map();
    (slots || []).forEach((s) => { const k = dayKey(s); m.set(k, [...(m.get(k) || []), s]); });
    return [...m.values()];
  }, [slots]);

  const submit = async () => {
    if (!user) return nav('/login', { state: { from: `/tutors/${tutor._id}` } });
    setBusy(true); setErr('');
    try {
      await api('/bookings', { method: 'POST', body: { tutor: tutor._id, subject, startsAt: slot, note: note || undefined } });
      nav('/my');
    } catch (e) { setErr(e.message); setSlot(''); } finally { setBusy(false); }
  };

  return (
    <div className="card sticky top-20 space-y-4 p-5">
      <div>
        <div className="text-4xl font-extrabold tracking-tight text-brand-700">{money(tutor.pricePerHour)} <span className="text-base font-medium text-slate-600">/ {t('soat')}</span></div>
        <p className="mt-1 flex items-center gap-1.5 text-sm font-medium text-brand-700">{t('Birinchi darsga {n}% talaba chegirmasi', { n: meta.firstLessonDiscount })}
          <InfoTip text={t("Chegirma faqat platformada hali to'langan darsingiz bo'lmasa qo'llanadi va bron yuborganingizda narxga avtomatik hisoblanadi.")} /></p>
      </div>
      <label className="block">
        <span className="label">{t('Fan')}</span>
        <select className="input" value={subject} onChange={(e) => setSubject(e.target.value)}>{tutor.subjects.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}</select>
      </label>
      <div>
        <span className="label">{t("Bo'sh vaqtni tanlang")}</span>
        {loading ? <Spinner /> : !days.length ? <p className="text-sm text-slate-500">{t("Yaqin 14 kunda bo'sh vaqt yo'q.")}</p> : (
          <div className="max-h-64 space-y-3 overflow-y-auto pr-1">
            {days.map((list) => (
              <div key={list[0]}>
                <div className="mb-1 text-xs font-semibold text-slate-600">{dayLabel(list[0])}</div>
                <div className="flex flex-wrap gap-1.5">
                  {list.map((s) => (
                    <button key={s} type="button" onClick={() => setSlot(s)} aria-pressed={slot === s}
                      className={`choice !px-3.5 !py-1.5 ${slot === s ? 'choice-on !bg-brand-600' : ''}`}>{hhmm(s)}</button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <label className="block"><span className="label">{t('Izoh (ixtiyoriy)')}</span><textarea className="input" rows={2} maxLength={500} placeholder={t('Qaysi mavzu kerak?')} value={note} onChange={(e) => setNote(e.target.value)} /></label>
      <ErrorBox error={err} />
      <button className="btn-primary w-full" disabled={!slot || !subject || busy} onClick={submit}>{user ? t('Darsga yozilish') : t('Kirish va yozilish')}</button>
      <p className="text-sm text-slate-500">{t("Repetitor tasdiqlagach, to'lov platforma ichida amalga oshiriladi.")}</p>
    </div>
  );
}

export default function TutorDetail() {
  const { id } = useParams();
  const { meta } = useApp();
  const { data, loading, error } = useFetch(`/tutors/${id}`);
  if (loading) return <Spinner />;
  if (error) return <ErrorBox error={error} />;
  const { tutor, reviews } = data;

  return (
    <>
      <Link to="/tutors" className="mb-6 inline-block text-sm font-semibold text-brand-700 hover:underline">← {t('Repetitorlar')}</Link>
      <div className="grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-6">
          <div className="card p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-600 text-2xl font-bold text-white">{tutor.user.name[0]}</div>
              <div>
                <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">{tutor.user.name}</h1>
                <Stars value={tutor.ratingAvg} count={tutor.ratingCount} />
                <div className="text-xs text-slate-500">{t('{n} ta dars o\'tgan', { n: tutor.lessonsCount })}{tutor.user.year ? ` · ${t('{n}-kurs talabasi', { n: tutor.user.year })}` : ''}</div>
              </div>
            </div>
            <p className="mt-4 font-medium text-slate-800">{tutor.headline}</p>
            {tutor.bio && <p className="mt-2 whitespace-pre-line text-sm text-slate-600">{tutor.bio}</p>}
            {tutor.experience && <p className="mt-2 text-sm text-slate-500"><b>{t('Tajriba:')}</b> {tutor.experience}</p>}
            <div className="mt-4 flex flex-wrap gap-2">
              {tutor.subjects.map((s) => <Link key={s._id} to={`/subjects/${s._id}`} className="chip bg-brand-50 text-brand-700 hover:bg-brand-100">{s.name}</Link>)}
            </div>
            <div className="mt-4 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
              <div><b>{t('Format:')}</b> {tutor.formats.map((f) => FORMAT_LABEL[f]).join(', ')}</div>
              <div><b>{t('Til:')}</b> {tutor.languages.map((l) => LANG_LABEL[l]).join(', ')}</div>
              <div className="sm:col-span-2"><b>{t('Odatdagi vaqtlar:')}</b> {tutor.availability.map((a) => `${DAYS[a.day]} ${a.from}–${a.to}`).join(' · ') || '—'}</div>
            </div>
          </div>
          <Hint title={t('Bron qanday ishlaydi')}>
            <ul>
              <li>{t("O'ng tomondan fan va bo'sh vaqtni tanlab, bron yuborasiz.")}</li>
              <li>{t("Repetitor bronni tasdiqlaydi — shundan keyin Telegram aloqasi ochiladi.")}</li>
              <li>{t("Tasdiqdan so'ng «Darslarim» sahifasida to'laysiz.")}</li>
              <li>{t("Dars o'tgach repetitorni baholaysiz.")}</li>
            </ul>
          </Hint>
          <Hint kind="warn" title={t('Bekor qilish qoidasi')}>
            <p>{t("To'langan darsni boshlanishiga {h} soatdan ko'p qolganda bekor qilsangiz, to'lov qaytariladi. Kamroq qolsa — qaytarilmaydi. Repetitor rad etsa, pul har doim qaytariladi.", { h: meta.cancelHours })}</p>
          </Hint>
          <div>
            <h2 className="mb-3 text-2xl font-extrabold tracking-tight">{t('Sharhlar')} ({reviews.length})</h2>
            {!reviews.length ? <div className="card p-5 text-sm text-slate-500">{t("Hozircha sharh yo'q. Faqat dars olgan talabalar baho qoldira oladi.")}</div> : (
              <div className="space-y-3">{reviews.map((r) => (
                <div key={r._id} className="card p-4">
                  <div className="flex items-center justify-between"><b className="text-sm">{r.student?.name}</b><Stars value={r.rating} size="text-sm" /></div>
                  {r.comment && <p className="mt-1 text-sm text-slate-600">{r.comment}</p>}
                </div>
              ))}</div>
            )}
          </div>
        </div>
        <Booking tutor={tutor} />
      </div>
    </>
  );
}
