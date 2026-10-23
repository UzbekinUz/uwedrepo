import { useState } from 'react';
import { api } from '../api.js';
import { useApp } from '../context/App.jsx';
import { Hint } from '../components/Motion.jsx';
import { ErrorBox, Field, PageTitle, useFetch } from '../components/ui.jsx';
import { t } from '../lib/i18n.js';

export default function Survey() {
  const { meta } = useApp();
  const opts = useFetch('/survey/options');
  const [role, setRole] = useState('student');
  const [f, setF] = useState({ faculty: '', year: '', searchHoursPerWeek: '', trustReviews: 4, willingToPay: 'yes', monthlyBudget: '', tutorInterest: 'yes', needs: [], comment: '' });
  const [done, setDone] = useState(false);
  const [err, setErr] = useState('');
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const toggleNeed = (n) => setF((p) => ({ ...p, needs: p.needs.includes(n) ? p.needs.filter((x) => x !== n) : [...p.needs, n] }));

  const submit = async (e) => {
    e.preventDefault(); setErr('');
    const body = role === 'student'
      ? { role, faculty: f.faculty || undefined, year: f.year ? Number(f.year) : undefined, searchHoursPerWeek: Number(f.searchHoursPerWeek || 0), trustReviews: Number(f.trustReviews), willingToPay: f.willingToPay === 'yes', monthlyBudget: f.willingToPay === 'yes' ? Number(f.monthlyBudget || 0) : 0, needs: f.needs, comment: f.comment || undefined }
      : { role, tutorInterest: f.tutorInterest === 'yes', comment: f.comment || undefined };
    try { await api('/survey', { method: 'POST', body }); setDone(true); } catch (er) { setErr(er.message); }
  };

  if (done) return <div className="card mx-auto max-w-lg p-10 text-center"><h1 className="text-4xl font-extrabold tracking-tight">{t('Rahmat!')}</h1><p className="mt-1 text-sm text-slate-500">{t('Javobingiz platformani yaxshilashga yordam beradi.')}</p></div>;

  return (
    <div className="mx-auto max-w-xl">
      <PageTitle title={t("Qisqa so'rovnoma")} sub={t("1 daqiqa. Anonim — ism yoki email so'ralmaydi.")} />
      <Hint className="mb-6" title={t("Bu so'rovnoma nima uchun")}>
        <p>{t("Javoblar platformani talabalarga mos qilish uchun ishlatiladi: qaysi fanlar kerak, qancha to'lashga tayyor ekansiz, repetitorlar qiziqadimi. Ism va email so'ralmaydi.")}</p>
      </Hint>
      <div className="mb-4 flex gap-2">
        {[['student', 'Men talabaman'], ['tutor', 'Men repetitorman']].map(([k, l]) => <button key={k} type="button" onClick={() => setRole(k)} className={role === k ? 'btn-primary' : 'btn-ghost'}>{t(l)}</button>)}
      </div>
      <form onSubmit={submit} className="card space-y-4 p-5 sm:p-6">
        {role === 'student' ? (
          <>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Fakultet"><select className="input" value={f.faculty} onChange={set('faculty')}><option value="">—</option>{meta.faculties.map((x) => <option key={x.key} value={x.key}>{t(x.name)}</option>)}</select></Field>
              <Field label="Kurs"><select className="input" value={f.year} onChange={set('year')}><option value="">—</option>{[1, 2, 3, 4].map((y) => <option key={y} value={y}>{t('{n}-kurs', { n: y })}</option>)}</select></Field>
            </div>
            <Field label="Haftasiga resurs qidirishga necha soat sarflaysiz?"><input className="input" type="number" min="0" max="80" step="0.5" required value={f.searchHoursPerWeek} onChange={set('searchHoursPerWeek')} /></Field>
            <label className="block"><span className="label">{t('Sharh va reytingga ishonchingiz (1–5):')} {f.trustReviews}</span><input type="range" min="1" max="5" className="w-full" value={f.trustReviews} onChange={set('trustReviews')} /></label>
            <Field label="Platforma orqali to'lashga tayyormisiz?"><select className="input" value={f.willingToPay} onChange={set('willingToPay')}><option value="yes">{t('Ha')}</option><option value="no">{t("Yo'q")}</option></select></Field>
            {f.willingToPay === 'yes' && <Field label="Oyiga qancha to'lashga tayyorsiz? (so'm)"><input className="input" type="number" min="0" step="10000" required value={f.monthlyBudget} onChange={set('monthlyBudget')} /></Field>}
            <div><span className="label">{t("Eng kerakli yo'nalishlar")}</span><div className="flex flex-wrap gap-2">{opts.data?.needs.map((n) => (
              <label key={n} className={`choice ${f.needs.includes(n) ? 'choice-on' : ''}`}><input type="checkbox" className="sr-only" checked={f.needs.includes(n)} onChange={() => toggleNeed(n)} />{t(n)}</label>
            ))}</div></div>
          </>
        ) : (
          <Field label="Platformada repetitor sifatida ishlashga qiziqasizmi?"><select className="input" value={f.tutorInterest} onChange={set('tutorInterest')}><option value="yes">{t('Ha')}</option><option value="no">{t("Yo'q")}</option></select></Field>
        )}
        <Field label="Qo'shimcha fikr (ixtiyoriy)"><textarea className="input" rows={2} maxLength={800} value={f.comment} onChange={set('comment')} /></Field>
        <ErrorBox error={err} />
        <button className="btn-primary w-full">{t('Yuborish')}</button>
      </form>
    </div>
  );
}
