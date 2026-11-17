import { useState } from 'react';
import { useSeo } from '../lib/seo.js';
import { api } from '../api.js';
import { useApp } from '../context/App.jsx';
import { Hint } from '../components/Motion.jsx';
import { ErrorBox, Field, PageTitle, Spinner, Tabs, useFetch } from '../components/ui.jsx';
import { DAYS_SHORT, FORMAT_LABEL, LANG_LABEL, STATUS, dateTime, money, tgLink } from '../lib/format.js';
import { t } from '../lib/i18n.js';
import { MyQuizzes } from '../components/QuizEditor.jsx';

const WEEK = [1, 2, 3, 4, 5, 6, 0]; // dushanbadan boshlab
const newSlot = () => ({ days: [], from: '16:00', to: '19:00' });

/** Bazadagi [{day, from, to}] ni bir xil vaqtli kunlar guruhiga aylantiradi: Sesh, Pay, Shan 16:00–19:00 */
const groupSlots = (av = []) => {
  const map = new Map();
  for (const a of av) {
    const k = `${a.from}|${a.to}`;
    if (!map.has(k)) map.set(k, { days: [], from: a.from, to: a.to });
    if (!map.get(k).days.includes(a.day)) map.get(k).days.push(a.day);
  }
  return map.size ? [...map.values()] : [{ ...newSlot(), days: [1] }];
};

/** Anketa formasi. Admin ham ishlatadi: endpoint (PUT) va ism maydoni bilan */
export function TutorForm({ initial, onSaved, endpoint, withName = false }) {
  const { meta } = useApp();
  const subjects = useFetch('/subjects');
  const [f, setF] = useState(() => ({
    headline: '', bio: '', experience: '', pricePerHour: 60000, telegram: '', formats: ['online'], languages: ['uz'],
    ...initial,
    name: initial?.user?.name || '',
    subjects: initial?.subjects?.map((s) => s._id) || [],
    slots: groupSlots(initial?.availability),
  }));
  const [err, setErr] = useState('');
  const [ok, setOk] = useState('');
  const toggle = (k, v) => setF((p) => ({ ...p, [k]: p[k].includes(v) ? p[k].filter((x) => x !== v) : [...p[k], v] }));
  const setSlot = (i, patch) => setF((p) => ({ ...p, slots: p.slots.map((a, j) => (j === i ? { ...a, ...patch } : a)) }));
  const toggleDay = (i, d) => setSlot(i, { days: f.slots[i].days.includes(d) ? f.slots[i].days.filter((x) => x !== d) : [...f.slots[i].days, d] });
  const slotsOk = f.slots.length > 0 && f.slots.every((s) => s.days.length && parseInt(s.from, 10) < parseInt(s.to, 10));
  const hours = Array.from({ length: 16 }, (_, i) => `${String(i + 7).padStart(2, '0')}:00`);

  const submit = async (e) => {
    e.preventDefault(); setErr(''); setOk('');
    if (!slotsOk) { setErr(t("Har bir qatorda kamida bitta kun tanlang va boshlanish vaqti tugashdan oldin bo'lsin")); return; }
    // Har bir tanlangan kun alohida yoziladi (server formati o'zgarmaydi), takrorlar olib tashlanadi
    const seen = new Set();
    const availability = f.slots.flatMap((s) => s.days.map((day) => ({ day, from: s.from, to: s.to }))).filter((a) => {
      const k = `${a.day}|${a.from}|${a.to}`;
      return seen.has(k) ? false : seen.add(k);
    });
    try {
      const body = { headline: f.headline, bio: f.bio, experience: f.experience, pricePerHour: Number(f.pricePerHour), subjects: f.subjects, formats: f.formats, languages: f.languages, telegram: f.telegram, availability };
      if (withName) body.name = f.name;
      await api(endpoint || (initial ? '/tutors/me' : '/tutors'), { method: initial ? 'PUT' : 'POST', body });
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
      {withName && <Field label="Ism (katalogda ko'rinadi)"><input className="input" required minLength={2} maxLength={80} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>}
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
          {f.slots.map((a, i) => (
            <div key={i} className="space-y-2 bg-slate-50 p-3">
              <div className="flex flex-wrap gap-1.5">
                {WEEK.map((d) => (
                  <label key={d} className={`choice !px-3 !py-1.5 ${a.days.includes(d) ? 'choice-on' : ''}`}>
                    <input type="checkbox" className="sr-only" checked={a.days.includes(d)} onChange={() => toggleDay(i, d)} />{DAYS_SHORT[d]}
                  </label>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <select className="input !w-auto" value={a.from} onChange={(e) => setSlot(i, { from: e.target.value })}>{hours.map((h) => <option key={h}>{h}</option>)}</select>
                <span>–</span>
                <select className="input !w-auto" value={a.to} onChange={(e) => setSlot(i, { to: e.target.value })}>{hours.map((h) => <option key={h}>{h}</option>)}</select>
                {f.slots.length > 1 && <button type="button" className="text-sm text-red-600" onClick={() => setF({ ...f, slots: f.slots.filter((_, j) => j !== i) })}>{t("O'chirish")}</button>}
              </div>
              {!a.days.length && <p className="text-xs text-amber-700">{t('Kamida bitta kunni tanlang')}</p>}
            </div>
          ))}
          <p className="text-sm text-slate-600">{t("Bir xil vaqtdagi kunlarni birga belgilang (masalan, Sesh, Pay, Shan 16:00–19:00). Boshqa kunlarda vaqt boshqacha bo'lsa, yangi qator qo'shing.")}</p>
          <button type="button" className="btn-ghost btn-sm" onClick={() => setF({ ...f, slots: [...f.slots, newSlot()] })}>{t("+ Vaqt qo'shish")}</button>
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
  useSeo("Repetitor kabineti", '', { noindex: true });
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
      <Tabs tabs={[['bookings', t('Bronlar')], ['profile', t('Anketa')], ...(tutor.status === 'approved' ? [['tests', t('Testlar')]] : [])]} value={tab} onChange={setTab} />
      {tab === 'bookings' && <Incoming />}
      {tab === 'profile' && <TutorForm initial={tutor} onSaved={() => setN(n + 1)} />}
      {tab === 'tests' && (
        <MyQuizzes subjects={tutor.subjects || []}
          note={<Hint title={t('Mashq testlari')}>{t("Fanlaringiz bo'yicha test tuzing: talabalar uni yechadi va natija ostida sizning profilingizni ko'radi. Har bir test (va har bir tahrir) admin tekshirgach chiqadi. Rasmiy imtihon variantlarini emas, o'xshash mashq savollarini joylang.")}</Hint>} />
      )}
    </>
  );
}
