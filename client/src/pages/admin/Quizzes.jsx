import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api.js';
import { Spinner, ErrorBox } from '../../components/ui.jsx';
import QuizEditor from '../../components/QuizEditor.jsx';
import { useApp } from '../../context/App.jsx';
import { Chip, CsvButton, Section, Stat, StatGrid, Table, dateTime, useAct, useFetch } from './kit.jsx';

/** Bitta test natijalari: kimlar yechgan, o'rtacha ball, qaysi savolda ko'p xato qilinadi */
function Results({ id, onBack }) {
  const { meta } = useApp();
  const { data, loading, error } = useFetch(`/admin/quizzes/${id}/attempts`);
  const fac = (k) => meta.faculties.find((f) => f.key === k)?.name || '—';
  if (loading) return <Spinner />;
  if (error) return <ErrorBox error={error} />;
  const { quiz, summary, rows } = data;
  const anon = Math.max(0, quiz.attempts - summary.saved - (summary.adminAttempts || 0));
  return (
    <Section title={`Natijalar: ${quiz.title}`}
      actions={<><CsvButton path={`/admin/quizzes/${id}/attempts.csv`} name="test-natijalari.csv" /><button className="btn-ghost btn-sm" onClick={onBack}>← Testlar ro'yxati</button></>}
      intro={<p>Saytga kirgan talabalarning har bir urinishi saqlanadi. Kirmasdan yechganlar faqat umumiy sonda hisoblanadi{anon ? ` (hozir ${anon} ta)` : ''}. Pastdagi savollar ro'yxati qaysi mavzuda talabalar ko'p xato qilayotganini ko'rsatadi: o'sha mavzu bo'yicha repetitorlarga e'lon berish yoki material qo'shish foydali.</p>}>
      <StatGrid>
        <Stat label="Jami yechilgan" value={quiz.attempts} hint={`${quiz.subject?.name || ''} · ${quiz.count} ta savol`} />
        <Stat label="Talabalar" value={summary.students} hint="saytga kirib yechganlar" />
        <Stat label="O'rtacha natija" value={summary.avgPct == null ? '—' : `${summary.avgPct}%`} />
        <Stat label="Kirmasdan yechganlar" value={anon} hint={summary.adminAttempts ? `admin sinovlari hisobga olinmadi: ${summary.adminAttempts}` : undefined} />
      </StatGrid>
      <Table head={['Talaba', 'Fakultet, kurs', 'Natija', 'Urinishlar', 'Sana']} empty={!rows.length && "Hali saytga kirgan talabalardan hech kim yechmagan."}>
        {rows.map((x) => (
          <tr key={x._id}>
            <td><b>{x.student?.name || "O'chirilgan foydalanuvchi"}</b>{x.student?.telegram && <span className="block text-xs text-slate-500">{x.student.telegram}</span>}</td>
            <td>{x.student?.faculty ? `${fac(x.student.faculty)}, ${x.student.year || '?'}-kurs` : '—'}</td>
            <td><Chip tone={x.pct >= 80 ? 'green' : x.pct >= 50 ? 'amber' : 'red'}>{x.score} / {x.total} · {x.pct}%</Chip></td>
            <td>{x.tries}</td>
            <td className="whitespace-nowrap">{dateTime(x.createdAt)}</td>
          </tr>
        ))}
      </Table>
      {summary.saved > 0 && (
        <div className="space-y-2 glass p-5">
          <h3 className="text-xl font-extrabold">Savollar bo'yicha: necha foiz to'g'ri javob berdi</h3>
          {summary.questions.map((q, i) => (
            <div key={i} className="flex items-center gap-3 text-sm">
              <span className="w-8 shrink-0 font-bold text-slate-500">{i + 1}.</span>
              <span className="min-w-0 flex-1 truncate" title={q.text}>{q.text}</span>
              <span className="h-2 w-32 shrink-0 bg-slate-100"><span className={`block h-2 ${q.rightPct >= 70 ? 'bg-emerald-500' : q.rightPct >= 40 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${q.rightPct}%` }} /></span>
              <b className="w-12 shrink-0 text-right">{q.rightPct}%</b>
            </div>
          ))}
        </div>
      )}
    </Section>
  );
}

const TONE = { pending: ['amber', 'Kutilmoqda'], approved: ['green', "Ko'rinadi"], hidden: ['slate', 'Yashirilgan'] };

export default function Quizzes() {
  const [status, setStatus] = useState('');
  const [n, setN] = useState(0);
  const [edit, setEdit] = useState(null); // null | 'new' | to'liq test
  const [results, setResults] = useState(null); // natijasi ko'rilayotgan test id
  const { data, loading } = useFetch(`/admin/quizzes${status ? `?status=${status}` : ''}`, [n]);
  const subjects = useFetch('/admin/subjects');
  const { run, err, msg } = useAct();
  const reload = () => setN((x) => x + 1);
  const setSt = (id, s) => run(async () => { await api(`/admin/quizzes/${id}`, { method: 'PATCH', body: { status: s } }); reload(); });
  const del = (q) => window.confirm(`«${q.title}» testi, uning natijalari va AI izohlari o'chiriladi. Davom etasizmi?`) && run(async () => { await api(`/admin/quizzes/${q._id}`, { method: 'DELETE' }); reload(); }, "O'chirildi");
  const open = (id) => run(async () => setEdit(await api(`/quizzes/${id}/full`)));

  if (results) return <Results id={results} onBack={() => setResults(null)} />;
  if (edit) {
    if (subjects.loading) return <Spinner />;
    return (
      <Section title={edit === 'new' ? 'Yangi test' : 'Testni tahrirlash'}>
        <QuizEditor subjects={(subjects.data || []).filter((s) => s.active)} initial={edit === 'new' ? null : edit} onSaved={() => { setEdit(null); reload(); }} onCancel={() => setEdit(null)} />
      </Section>
    );
  }

  return (
    <Section title="Mashq testlari"
      actions={<button className="btn-primary btn-sm" onClick={() => setEdit('new')}>+ Yangi test</button>}
      intro={<>
        <p>Talabalar fan sahifasidagi «Testlar» bo'limida mashq testlarini yechadi va natijani darhol ko'radi. Xato javob yonida <b>«Nega noto'g'ri?»</b> tugmasi AI izohini beradi (Sozlamalarda yoqiladi), natija ostida esa shu fan repetitorlari chiqadi.</p>
        <p>Siz tuzgan test darhol ko'rinadi. <b>Repetitor tuzgan yoki tahrirlagan test «Kutilmoqda»</b> holatiga tushadi: javoblari to'g'riligini tekshirib, «Tasdiqlash»ni bosing. Rasmiy imtihon variantlarini emas, o'xshash mashq savollarini joylang.</p>
      </>}>
      <div className="chip-row">
        {[['', 'Hammasi'], ['pending', 'Kutilmoqda'], ['approved', "Ko'rinadi"], ['hidden', 'Yashirilgan']].map(([k, l]) => (
          <button key={k} className={`choice ${status === k ? 'choice-on' : ''}`} onClick={() => setStatus(k)}>{l}</button>
        ))}
      </div>
      <ErrorBox error={err} />{msg && <p className="text-sm font-medium text-emerald-700">{msg}</p>}
      {loading ? <Spinner /> : (
        <Table head={['Test', 'Fan', 'Muallif', 'Savollar', 'Yechilgan', 'Holat', '']} empty={!data?.length && "Hozircha test yo'q. «+ Yangi test» tugmasi bilan birinchisini qo'shing."}>
          {data?.map((q) => (
            <tr key={q._id}>
              <td><Link to={`/quizzes/${q._id}`} className="font-semibold text-brand-700 hover:underline">{q.title}</Link></td>
              <td>{q.subject?.name || '—'}</td>
              <td>{q.author?.name || '—'}{q.byTutor && <span className="block text-xs text-slate-500">repetitor</span>}</td>
              <td>{q.count}</td>
              <td>{q.attempts}</td>
              <td><Chip tone={TONE[q.status][0]}>{TONE[q.status][1]}</Chip></td>
              <td className="whitespace-nowrap">
                <div className="flex flex-wrap gap-1.5">
                  {q.status !== 'approved' && <button className="btn-primary btn-sm" onClick={() => setSt(q._id, 'approved')}>Tasdiqlash</button>}
                  {q.status === 'approved' && <button className="btn-ghost btn-sm" onClick={() => setSt(q._id, 'hidden')}>Yashirish</button>}
                  <button className="btn-ghost btn-sm" onClick={() => setResults(q._id)}>Natijalar</button>
                  <button className="btn-ghost btn-sm" onClick={() => open(q._id)}>Tahrirlash</button>
                  <button className="btn-ghost btn-sm text-red-700" onClick={() => del(q)}>O'chirish</button>
                </div>
              </td>
            </tr>
          ))}
        </Table>
      )}
    </Section>
  );
}
