import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api.js';
import { Spinner, ErrorBox } from '../../components/ui.jsx';
import QuizEditor from '../../components/QuizEditor.jsx';
import { Chip, Section, Table, useAct, useFetch } from './kit.jsx';

const TONE = { pending: ['amber', 'Kutilmoqda'], approved: ['green', "Ko'rinadi"], hidden: ['slate', 'Yashirilgan'] };

export default function Quizzes() {
  const [status, setStatus] = useState('');
  const [n, setN] = useState(0);
  const [edit, setEdit] = useState(null); // null | 'new' | to'liq test
  const { data, loading } = useFetch(`/admin/quizzes${status ? `?status=${status}` : ''}`, [n]);
  const subjects = useFetch('/admin/subjects');
  const { run, err, msg } = useAct();
  const reload = () => setN((x) => x + 1);
  const setSt = (id, s) => run(async () => { await api(`/admin/quizzes/${id}`, { method: 'PATCH', body: { status: s } }); reload(); });
  const del = (q) => window.confirm(`«${q.title}» testi, uning natijalari va AI izohlari o'chiriladi. Davom etasizmi?`) && run(async () => { await api(`/admin/quizzes/${q._id}`, { method: 'DELETE' }); reload(); }, "O'chirildi");
  const open = (id) => run(async () => setEdit(await api(`/quizzes/${id}/full`)));

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
      <div className="flex flex-wrap gap-2">
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
