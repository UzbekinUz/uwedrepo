import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Spinner, ErrorBox } from '../../components/ui.jsx';
import { CsvButton, Hint, Section, Stat, StatGrid, money, useFetch } from './kit.jsx';

function Market({ budget }) {
  const [v, setV] = useState({ total: 1300000, sam: 150000, share: 1.5, budget: budget || 100000 });
  const set = (k) => (e) => setV({ ...v, [k]: Number(e.target.value) });
  const year = v.budget * 12;
  const som = Math.round((v.sam * v.share) / 100);
  return (
    <div className="space-y-4 bg-white p-5 sm:p-6">
      <h3 className="text-xl font-extrabold">Bozor hajmi kalkulyatori (TAM / SAM / SOM)</h3>
      <p className="text-sm text-slate-600">Hisobotdagi jadval uchun. <b>TAM</b> — butun O'zbekistondagi talabalar; <b>SAM</b> — shundan siz erisha oladigan va pullik qo'shimcha ta'lim oladiganlar; <b>SOM</b> — birinchi yilda real jalb qilish mumkin bo'lgan ulush. Oylik byudjet so'rovnomadagi o'rtacha javobdan olinadi{budget ? '' : " (hozircha ma'lumot yo'q: qo'lda kiriting)"}. Talabalar soni va ulushlar taxminiy, ularni rasmiy manbadan (stat.uz) tekshiring.</p>
      <div className="grid gap-3 sm:grid-cols-4">
        <label className="block"><span className="label">Barcha talabalar (TAM)</span><input className="input" type="number" value={v.total} onChange={set('total')} /></label>
        <label className="block"><span className="label">Toshkent, pullik (SAM)</span><input className="input" type="number" value={v.sam} onChange={set('sam')} /></label>
        <label className="block"><span className="label">SOM ulushi, %</span><input className="input" type="number" step="0.5" value={v.share} onChange={set('share')} /></label>
        <label className="block"><span className="label">Oylik byudjet, so'm</span><input className="input" type="number" step="10000" value={v.budget} onChange={set('budget')} /></label>
      </div>
      <StatGrid>
        <Stat label="TAM / yil" value={money(v.total * year)} />
        <Stat label="SAM / yil" value={money(v.sam * year)} />
        <Stat label="SOM / yil" value={money(som * year)} hint={`${som} talaba`} />
      </StatGrid>
    </div>
  );
}

export default function Research() {
  const { data: q, loading, error } = useFetch('/admin/survey');
  if (loading) return <Spinner />;
  if (error) return <ErrorBox error={error} />;
  return (
    <Section title="Tadqiqot: so'rovnoma natijalari"
      intro={<><p>Hisobotingizdagi bo'sh <b>[__]</b> joylar (Customer Development jadvali va bozor hajmi) shu yerdagi raqamlar bilan to'ldiriladi. Raqamlar <Link className="underline" to="/survey">/survey</Link> sahifasidagi javoblardan avtomatik hisoblanadi.</p><p>Natija ishonchli bo'lishi uchun kamida <b>30 ta javob</b> to'plang va turli kurslardan so'rang. Havolani guruh chatlariga <code>?ref=guruh-nomi</code> bilan yuboring: «Umumiy» bo'limida qaysi chat ko'proq odam keltirgani ko'rinadi.</p></>}
      actions={<CsvButton path="/admin/export/survey.csv" name="sorovnoma.csv" />}>
      <StatGrid>
        <Stat label="Respondentlar" value={q.respondents} hint={`talaba ${q.students} · repetitor ${q.tutors}`} warn={q.respondents < 30} tip="Hisobot uchun kamida 30 ta javob tavsiya etiladi." />
        <Stat label="Qidirishga ketadigan vaqt" value={q.searchHoursAvg != null ? `${q.searchHoursAvg} soat/hafta` : null} hint={q.searchLongPct != null ? `${q.searchLongPct}% haftasiga 2+ soat` : ''} tip="Gipoteza: «talabalar resurs qidirishga ko'p vaqt sarflaydi»." />
        <Stat label="Sharhga ishonadi" value={q.trustReviewsPct != null ? `${q.trustReviewsPct}%` : null} tip="Ishonch bahosi 4 yoki 5 deb javob berganlar ulushi." />
        <Stat label="To'lashga tayyor" value={q.willingToPayPct != null ? `${q.willingToPayPct}%` : null} hint={q.avgMonthlyBudget ? `o'rtacha ${money(q.avgMonthlyBudget)}/oy` : ''} tip="O'rtacha byudjet faqat «tayyorman» deb javob berib, summa ko'rsatganlardan hisoblanadi." />
        <Stat label="Repetitorlar qiziqishi" value={q.tutorTotal ? `${q.tutorInterested} / ${q.tutorTotal}` : null} />
      </StatGrid>
      {q.topNeeds.length > 0 && <div className="bg-white p-5"><h3 className="font-bold">Eng ko'p tilga olingan ehtiyojlar</h3><ol className="mt-2 space-y-1 text-sm">{q.topNeeds.map(([n, c]) => <li key={n} className="flex justify-between"><span>{n}</span><b>{c}</b></li>)}</ol></div>}
      {q.comments.length > 0 && <div className="bg-white p-5"><h3 className="font-bold">Oxirgi izohlar</h3><ul className="mt-2 space-y-2 text-sm">{q.comments.map((c, i) => <li key={i} className="border-l-4 border-brand-300 pl-3">{c.text}</li>)}</ul></div>}
      {q.respondents === 0 && <Hint kind="warn" title="Hali javob yo'q"><p>Havolani guruh chatlariga yuboring: <code>{window.location.origin}/survey?ref=chat-nomi</code></p></Hint>}
      <Market budget={q.avgMonthlyBudget} />
    </Section>
  );
}
