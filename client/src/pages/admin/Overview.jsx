import { Link } from 'react-router-dom';
import { Spinner, ErrorBox } from '../../components/ui.jsx';
import { Icon } from '../../components/Motion.jsx';
import { BarChart, Hint, InfoTip, Section, Stat, StatGrid, money, useFetch } from './kit.jsx';

export default function Overview({ go }) {
  const { data, loading, error } = useFetch('/admin/overview');
  if (loading) return <Spinner />;
  if (error) return <ErrorBox error={error} />;
  const { stats: s, series, funnel, topSubjects, noTutorSubjects, topTutors, sources, checklist, pending } = data;
  const done = checklist.filter((c) => c.done).length;
  const topFunnel = Math.max(1, funnel[0].value);

  return (
    <Section title="Umumiy ko'rinish"
      intro={<p>Sayt hozir qanday ishlayotganini bir qarashda ko'rasiz: pilotga tayyorlik ro'yxati, asosiy ko'rsatkichlar, 30 kunlik dinamika va talabalar qaysi bosqichda to'xtab qolayotgani (voronka). Raqam yonidagi <b>ⓘ</b> belgisi uning qanday hisoblanishini tushuntiradi.</p>}>

      {(s.tutorsPending > 0 || pending?.materials > 0) && (
        <Hint kind="warn" title="Sizning tasdig'ingizni kutayotgan narsalar">
          <ul>
            {s.tutorsPending > 0 && <li><button className="font-semibold underline" onClick={() => go('tutors')}>{s.tutorsPending} ta repetitor anketasi</button> — tasdiqlanmaguncha katalogda ko'rinmaydi.</li>}
            {pending?.materials > 0 && <li><button className="font-semibold underline" onClick={() => go('content')}>{pending.materials} ta material</button> — talabalar yuborgan, tekshirilishi kerak.</li>}
          </ul>
        </Hint>
      )}

      <div className="bg-white p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-xl font-extrabold">Pilotga tayyorlik: {done} / {checklist.length}</h3>
          <div className="h-2 w-48 bg-slate-200" role="progressbar" aria-valuenow={done} aria-valuemax={checklist.length}><div className="h-2 bg-brand-600 transition-all" style={{ width: `${(done / checklist.length) * 100}%` }} /></div>
        </div>
        <ul className="mt-4 space-y-3">
          {checklist.map((c) => (
            <li key={c.key} className="flex gap-3">
              <span className={`mt-0.5 shrink-0 ${c.done ? 'text-emerald-600' : c.optional ? 'text-slate-400' : 'text-amber-600'}`}><Icon name={c.done ? 'check' : 'warn'} size={22} /></span>
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-slate-900">{c.label}{c.optional && !c.done && <span className="ml-2 text-sm font-normal text-slate-500">(ixtiyoriy)</span>}</div>
                <p className="text-sm text-slate-600">{c.hint}</p>
              </div>
              {!c.done && <button className="btn-ghost btn-sm shrink-0" onClick={() => go(c.tab)}>O'tish</button>}
            </li>
          ))}
        </ul>
      </div>

      <StatGrid>
        <Stat label="Saytga kirganlar" value={s.visitors} hint={`oxirgi 7 kun: ${s.visitors7}`} tip="Noyob brauzer sessiyalari soni: bitta qurilma bir necha marta kirsa ham bir marta sanaladi. Qurilma o'zgarsa yoki brauzer ma'lumotlari tozalansa, yana yangi tashrif bo'ladi." />
        <Stat label="Ro'yxatdan o'tganlar" value={s.students} tip="Adminlardan tashqari barcha akkauntlar (talaba va repetitorlar)." />
        <Stat label="Bronlar" value={s.bookedTotal} hint={`to'langan talabalar: ${s.paidStudents}`} tip="Barcha holatdagi bronlar soni. Hisobotdagi pilot maqsadi — 30–50 talaba." />
        <Stat label="Konversiya" value={`${s.conversionPct}%`} tip="(Kamida 1 ta to'langan yoki o'tgan dars olgan talabalar) ÷ (saytga kirganlar) × 100." />
        <Stat label="Qayta dars olganlar" value={`${s.repeatPct}%`} tip="2 va undan ko'p dars olgan talabalar ulushi (dars olganlar ichida). Mahsulot haqiqatan kerakligini ko'rsatadigan eng yaxshi belgi." />
        <Stat label="Tasdiqlangan repetitorlar" value={s.tutorsApproved} hint={`kutilmoqda: ${s.tutorsPending} · maqsad 8–10`} warn={s.tutorsApproved < 8} />
        <Stat label="O'rtacha baho" value={s.avgRating ?? '—'} hint={`${s.reviews} ta sharh · maqsad 4+`} tip="Yashirilgan sharhlar hisobga olinmaydi." />
        <Stat label="Aylanma / komissiya" value={money(s.gross)} hint={`komissiya: ${money(s.commission)}`} tip="To'langan va o'tgan darslar summasi. Qaytarilgan to'lovlar ham shu yerga kiradi, aniq hisob uchun «Moliya» bo'limiga qarang." />
      </StatGrid>

      <div className="grid gap-3 lg:grid-cols-3">
        <BarChart title="Noyob tashriflar" data={series.visits} />
        <BarChart title="Yangi foydalanuvchilar" data={series.users} />
        <BarChart title="Yangi bronlar" data={series.bookings} />
      </div>

      <div className="bg-white p-5 sm:p-6">
        <h3 className="text-xl font-extrabold">Voronka: odamlar qayerda to'xtab qolmoqda</h3>
        <p className="mt-1 text-sm text-slate-600">Eng uzun tushish — eng katta muammo. Masalan, kirganlar ko'p-u ro'yxatdan o'tganlar kam bo'lsa, kirish sahifasini yaxshilash kerak.</p>
        <ul className="mt-4 space-y-3">
          {funnel.map((f, i) => (
            <li key={f.label}>
              <div className="flex justify-between text-sm"><span className="font-medium text-slate-900">{f.label}</span><span className="text-slate-600"><b className="text-slate-900">{f.value}</b>{i > 0 && funnel[i - 1].value ? ` · oldingisidan ${Math.round((f.value / funnel[i - 1].value) * 100)}%` : ''}</span></div>
              <div className="mt-1 h-3 bg-slate-100"><div className="h-3 bg-brand-600" style={{ width: `${Math.min(100, (f.value / topFunnel) * 100)}%` }} /></div>
            </li>
          ))}
        </ul>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <div className="bg-white p-5">
          <h3 className="font-bold">Eng ko'p bron qilingan fanlar</h3>
          {topSubjects.length ? <ol className="mt-3 space-y-1 text-sm">{topSubjects.map((x) => <li key={x._id} className="flex justify-between"><span>{x.name}</span><b>{x.n}</b></li>)}</ol> : <p className="mt-2 text-sm text-slate-600">Hali bron yo'q.</p>}
        </div>
        <div className="bg-white p-5">
          <h3 className="font-bold">Repetitori yo'q fanlar</h3>
          {noTutorSubjects.length ? (
            <>
              <p className="mt-1 text-sm text-slate-600">Talaba bu fanlarni tanlasa, hech kimni topolmaydi. Shu fanlardan repetitor qidiring.</p>
              <ul className="mt-2 flex flex-wrap gap-2">{noTutorSubjects.map((x) => <li key={x._id} className="chip bg-amber-100 text-amber-800">{x.name}</li>)}</ul>
            </>
          ) : <p className="mt-2 text-sm text-slate-600">Hamma fanda kamida bitta repetitor bor.</p>}
        </div>
        <div className="bg-white p-5">
          <h3 className="font-bold">Eng ko'p daromad keltirgan repetitorlar</h3>
          {topTutors.length ? <ol className="mt-3 space-y-1 text-sm">{topTutors.map((x) => <li key={x._id} className="flex justify-between"><span>{x.name} <span className="text-slate-500">· {x.n} dars</span></span><b>{money(x.revenue)}</b></li>)}</ol> : <p className="mt-2 text-sm text-slate-600">Hali to'lov yo'q.</p>}
        </div>
        <div className="bg-white p-5">
          <h3 className="flex items-center gap-1.5 font-bold">Tashrif manbalari <InfoTip text="Havolaga ?ref=nomi (yoki ?utm_source=nomi) qo'shilsa, tashrif shu nom bilan yoziladi. Har bir chat yoki kanal uchun alohida nom bering." /></h3>
          {sources.length ? <ol className="mt-3 space-y-1 text-sm">{sources.map((x) => <li key={x._id} className="flex justify-between"><span>{x._id}</span><b>{x.n}</b></li>)}</ol> : (
            <p className="mt-2 text-sm text-slate-600">Hozircha manba aniqlanmagan. Havolalarga <code>?ref=nomi</code> qo'shing, masalan <code>/?ref=0-9a-guruh</code> — shunda qaysi chatdan nechta odam kelgani shu yerda ko'rinadi.</p>
          )}
        </div>
      </div>
      <p className="text-sm text-slate-500">Batafsil so'rovnoma natijalari — <Link className="underline" to="/admin?tab=research">«Tadqiqot»</Link> bo'limida.</p>
    </Section>
  );
}
