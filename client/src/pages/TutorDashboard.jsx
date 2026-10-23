import { useState } from 'react';
import { api } from '../api.js';
import { useApp } from '../context/App.jsx';
import { Hint } from '../components/Motion.jsx';
import { ErrorBox, Field, PageTitle, Spinner, Tabs, useFetch } from '../components/ui.jsx';
import { DAYS, FORMAT_LABEL, LANG_LABEL, STATUS, dateTime, money, tgLink } from '../lib/format.js';
import { t } from '../lib/i18n.js';

function TutorForm({ initial, onSaved }) {
  const { meta } = useApp();
  const subjects = useFetch('/subjects');
  const [f, setF] = useState(() => ({
    headline: '', bio: '', experience: '', pricePerHour: 60000, telegram: '', formats: ['online'], languages: ['uz'],
    availability: [{ day: 1, from: '16:00', to: '19:00' }],
    ...initial,
    subjects: initial?.subjects?.map((s) => s._id) || [],
  }));
  const [err, setErr] = useState('');
  const [ok, setOk] = useState('');
  const toggle = (k, v) => setF((p) => ({ ...p, [k]: p[k].includes(v) ? p[k].filter((x) => x !== v) : [...p[k], v] }));
  const setAv = (i, patch) => setF((p) => ({ ...p, availability: p.availability.map((a, j) => (j === i ? { ...a, ...patch } : a)) }));
  const hours = Array.from({ length: 16 }, (_, i) => `${String(i + 7).padStart(2, '0')}:00`);

  const submit = async (e) => {
    e.preventDefault(); setErr(''); setOk('');
    try {
      const body = { headline: f.headline, bio: f.bio, experience: f.experience, pricePerHour: Number(f.pricePerHour), subjects: f.subjects, formats: f.formats, languages: f.languages, telegram: f.telegram, availability: f.availability.map(({ day, from, to }) => ({ day, from, to })) };
      await api(initial ? '/tutors/me' : '/tutors', { method: initial ? 'PUT' : 'POST', body });
      setOk(initial ? 'Saqlandi' : "Anketa yuborildi! Admin tasdiqlagach katalogda ko'rinasiz.");
      onSaved?.();
    } catch (er) { setErr(er.message); }
  };

  const chk = (label, on, onChange, key = label) => (
    <label key={key} className={`choice ${on ? 'choice-on' : ''}`}>
      <input type="checkbox" className="sr-only" checked={on} onChange={onChange} />{label}
    </label>
  );

  return (
    <form onSubmit={submit} className="card space-y-5 p-5 sm:p-6">
      <Field label="Qisqa sarlavha"><input className="input" required minLength={5} maxLength={120} placeholder={t('Masalan: Hisoblash va Ekonomika — imtihongacha tayyorlov')} value={f.headline} onChange={(e) => setF({ ...f, headline: e.target.value })} /></Field>
      <Field label="O'zingiz haqingizda"><textarea className="input" rows={3} maxLength={1500} value={f.bio} onChange={(e) => setF({ ...f, bio: e.target.value })} /></Field>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Tajriba"><input className="input" maxLength={300} placeholder={t("2 yil, 30+ o'quvchi")} value={f.experience} onChange={(e) => setF({ ...f, experience: e.target.value })} /></Field>
        <Field label="Soatlik narx (so'm)"><input className="input" type="number" required min={10000} max={2000000} step={5000} value={f.pricePerHour} onChange={(e) => setF({ ...f, pricePerHour: e.target.value })} /></Field>
        <Field label="Telegram (bog'lanish uchun)"><input className="input" placeholder="@username" value={f.telegram} onChange={(e) => setF({ ...f, telegram: e.target.value })} /></Field>
      </div>
      <div><span className="label">{t('Fanlar')}</span><div className="flex flex-wrap gap-2">{subjects.data?.map((s) => chk(s.name, f.subjects.includes(s._id), () => toggle('subjects', s._id), s._id))}</div></div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div><span className="label">{t('Format')}</span><div className="flex gap-2">{meta.formats.map((x) => chk(FORMAT_LABEL[x], f.formats.includes(x), () => toggle('formats', x), x))}</div></div>
        <div><span className="label">{t('Dars tili')}</span><div className="flex gap-2">{meta.languages.map((x) => chk(LANG_LABEL[x], f.languages.includes(x), () => toggle('languages', x), x))}</div></div>
      </div>
      <div>
        <span className="label">{t("Haftalik bo'sh vaqtlar")}</span>
        <div className="space-y-2">
          {f.availability.map((a, i) => (
            <div key={i} className="flex flex-wrap items-center gap-2">
              <select className="input !w-auto" value={a.day} onChange={(e) => setAv(i, { day: Number(e.target.value) })}>{DAYS.map((d, n) => <option key={n} value={n}>{d}</option>)}</select>
              <select className="input !w-auto" value={a.from} onChange={(e) => setAv(i, { from: e.target.value })}>{hours.map((h) => <option key={h}>{h}</option>)}</select>
              <span>–</span>
              <select className="input !w-auto" value={a.to} onChange={(e) => setAv(i, { to: e.target.value })}>{hours.map((h) => <option key={h}>{h}</option>)}</select>
              <button type="button" className="text-sm text-red-600" onClick={() => setF({ ...f, availability: f.availability.filter((_, j) => j !== i) })}>{t("O'chirish")}</button>
            </div>
          ))}
          <button type="button" className="btn-ghost btn-sm" onClick={() => setF({ ...f, availability: [...f.availability, { day: 1, from: '16:00', to: '19:00' }] })}>{t("+ Vaqt qo'shish")}</button>
        </div>
      </div>
      <ErrorBox error={err} />
      {ok && <p className="text-sm text-emerald-600">{t(ok)}</p>}
      <button className="btn-primary" disabled={!f.subjects.length || !f.formats.length || !f.languages.length}>{initial ? t('Saqlash') : t('Anketani yuborish')}</button>
    </form>
  );
}

function Incoming() {
  const [n, setN] = useState(0);
  const { data, loading, error } = useFetch('/bookings/incoming', [n]);
  const [err, setErr] = useState('');
  const act = async (id, action) => { setErr(''); try { await api(`/bookings/${id}/${action}`, { method: 'PATCH' }); setN(n + 1); } catch (e) { setErr(e.message); } };
  if (loading) return <Spinner />;
  return (
    <div className="space-y-3">
      <ErrorBox error={error || err} />
      {!data?.length && <div className="card p-6 text-sm text-slate-500">{t("Hozircha bronlar yo'q.")}</div>}
      {data?.map((b) => (
        <div key={b._id} className="card flex flex-wrap items-center justify-between gap-3 p-4">
          <div>
            <div className="font-semibold">{b.student?.name} <span className={`chip ml-1 ${STATUS[b.status].cls}`}>{STATUS[b.status].label}</span></div>
            <div className="text-sm text-slate-500">{b.subject?.name} · {dateTime(b.startsAt)} · {t('sizga:')} {money(b.payout)}</div>
            {b.note && <div className="text-sm text-slate-500">“{b.note}”</div>}
            {b.student?.telegram && <a className="text-xs text-brand-600 underline" target="_blank" rel="noopener noreferrer" href={tgLink(b.student.telegram)}>Telegram: {b.student.telegram}</a>}
            {b.student?.phone && <a className="ml-3 text-sm text-brand-700 underline" href={`tel:${b.student.phone}`}>{b.student.phone}</a>}
          </div>
          <div className="flex gap-2">
            {b.status === 'pending' && <button className="btn-primary btn-sm" onClick={() => act(b._id, 'confirm')}>{t('Tasdiqlash')}</button>}
            {['pending', 'confirmed', 'paid'].includes(b.status) && <button className="btn-ghost btn-sm text-red-600" onClick={() => act(b._id, 'reject')}>{t('Rad etish')}</button>}
            {b.status === 'paid' && new Date(b.startsAt) <= new Date() && <button className="btn-primary btn-sm" onClick={() => act(b._id, 'complete')}>{t("Dars o'tdi")} ✓</button>}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function TutorDashboard() {
  const { meta } = useApp();
  const [n, setN] = useState(0);
  const { data: tutor, loading } = useFetch('/tutors/me', [n]);
  const [tab, setTab] = useState('bookings');
  if (loading) return <Spinner />;

  if (!tutor) return (
    <>
      <PageTitle title={t("Repetitor bo'ling")} sub={t("Anketani to'ldiring — admin tasdiqlagach katalogda ko'rinasiz va dars bron qilina boshlaydi")} />
      <div className="mb-8 grid gap-4 md:grid-cols-2">
        <Hint title={t("Anketa qanday ko'rib chiqiladi")}>
          <ul>
            <li>{t("Admin anketani tekshiradi, tasdiqlangach katalogda ko'rinasiz.")}</li>
            <li>{t("Talaba bron yuboradi, siz tasdiqlaysiz yoki rad etasiz.")}</li>
            <li>{t("Har bir to'lovdan platforma {n}% komissiya oladi, qolgani sizniki.", { n: meta.commission })}</li>
          </ul>
        </Hint>
        <Hint kind="warn" title={t("Telegram username'ingizni kiriting")}>
          <p>{t("Tasdiqlangan bronda talaba sizga shu username orqali yozadi. Username bo'lmasa, aloqa qilish qiyin bo'ladi.")}</p>
        </Hint>
      </div>
      <TutorForm onSaved={() => setN(n + 1)} />
    </>
  );

  const banner = { pending: ['bg-amber-50 text-amber-800', "Anketangiz tekshirilmoqda. Tasdiqlangach katalogda ko'rinadi."], approved: ['bg-emerald-50 text-emerald-800', "Anketangiz tasdiqlangan va katalogda ko'rinadi."], rejected: ['bg-red-50 text-red-700', "Anketangiz rad etilgan. Ma'lumotlarni yangilab, admin bilan bog'laning."] }[tutor.status];
  return (
    <>
      <PageTitle title={t('Repetitor paneli')} sub={`${t('{n} ta dars', { n: tutor.lessonsCount })} · ${t('reyting')} ${tutor.ratingAvg || '—'}`} />
      <div className={`mb-8 rounded-md px-5 py-4 text-base font-medium ${banner[0]}`}>{t(banner[1])}</div>
      <Tabs tabs={[['bookings', t('Bronlar')], ['profile', t('Anketa')]]} value={tab} onChange={setTab} />
      {tab === 'bookings' ? <Incoming /> : <TutorForm initial={tutor} onSaved={() => setN(n + 1)} />}
    </>
  );
}
