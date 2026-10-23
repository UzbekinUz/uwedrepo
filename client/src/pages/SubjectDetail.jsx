import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api.js';
import { useApp } from '../context/App.jsx';
import { ErrorBox, Empty, PageTitle, Spinner, Tabs, useFetch, Field } from '../components/ui.jsx';
import { ExamRow, TutorCard } from '../components/Cards.jsx';
import { MATERIAL_LABEL } from '../lib/format.js';
import { t } from '../lib/i18n.js';

export function MaterialList({ items }) {
  if (!items.length) return <Empty>{t("Hozircha material yo'q. Birinchi bo'lib yuklang!")}</Empty>;
  return (
    <div className="space-y-2">
      {items.map((m) => (
        <a key={m._id} href={m.url} target="_blank" rel="noopener noreferrer nofollow" className="card-link flex flex-col items-start gap-3 p-5 sm:flex-row sm:items-center sm:gap-5">
          <span className="chip shrink-0 bg-brand-100 text-brand-700">{MATERIAL_LABEL[m.type]}</span>
          <div className="min-w-0 flex-1">
            <div className="break-words text-lg font-bold text-slate-900">{m.title}</div>
            {(m.description || m.subject?.name) && <div className="text-sm text-slate-600">{m.subject?.name} {m.description}</div>}
          </div>
          <span className="shrink-0 text-sm font-semibold text-brand-700">{t('Ochish ↗')}</span>
        </a>
      ))}
    </div>
  );
}

export function MaterialForm({ subjectId, subjects, onDone }) {
  const { user, meta } = useApp();
  const [f, setF] = useState({ subject: subjectId || '', title: '', type: 'konspekt', url: '', description: '' });
  const [msg, setMsg] = useState({ ok: '', err: '' });
  if (!user) return <p className="text-sm text-slate-500"><Link className="text-brand-600 underline" to="/login">{t('Kiring')}</Link> {t('va material ulashing.')}</p>;
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const submit = async (e) => {
    e.preventDefault();
    setMsg({ ok: '', err: '' });
    try {
      await api('/materials', { method: 'POST', body: f });
      setMsg({ ok: "Yuborildi! Admin tekshirgach ro'yxatda ko'rinadi.", err: '' });
      setF({ ...f, title: '', url: '', description: '' });
      onDone?.();
    } catch (er) { setMsg({ ok: '', err: er.message }); }
  };
  return (
    <form onSubmit={submit} className="card space-y-3 p-5">
      <h3 className="font-semibold">{t('Material ulashish')}</h3>
      <div className="grid gap-3 sm:grid-cols-2">
        {subjects && <Field label="Fan"><select className="input" required value={f.subject} onChange={set('subject')}><option value="">{t('Tanlang')}</option>{subjects.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}</select></Field>}
        <Field label="Turi"><select className="input" value={f.type} onChange={set('type')}>{meta.materialTypes.map((x) => <option key={x} value={x}>{MATERIAL_LABEL[x]}</option>)}</select></Field>
        <Field label="Sarlavha"><input className="input" required minLength={3} maxLength={140} value={f.title} onChange={set('title')} /></Field>
        <Field label="Havola (Google Drive, YouTube...)"><input className="input" type="url" required placeholder="https://" value={f.url} onChange={set('url')} /></Field>
      </div>
      <Field label="Izoh (ixtiyoriy)"><input className="input" maxLength={500} value={f.description} onChange={set('description')} /></Field>
      <ErrorBox error={msg.err} />
      {msg.ok && <p className="text-sm text-emerald-600">{t(msg.ok)}</p>}
      <button className="btn-primary">{t('Yuborish')}</button>
    </form>
  );
}

export default function SubjectDetail() {
  const { id } = useParams();
  const [tab, setTab] = useState('tutors');
  const [reload, setReload] = useState(0);
  const { data, loading, error } = useFetch(`/subjects/${id}`, [reload]);

  if (loading) return <Spinner />;
  if (error) return <ErrorBox error={error} />;
  const { subject, tutors, materials, exams } = data;
  const tabs = [['tutors', `${t('Repetitorlar')} (${tutors.length})`], ['materials', `${t('Materiallar')} (${materials.length})`], ['exams', `${t('Nazoratlar')} (${exams.length})`]];

  return (
    <>
      <Link to="/subjects" className="mb-6 inline-block text-sm font-semibold text-brand-700 hover:underline">← {t('Fanlar')}</Link>
      <PageTitle title={subject.name} sub={subject.description || subject.years.map((y) => t('{n}-kurs', { n: y })).join(', ')}>
        {subject.telegramGroup ? (
          <a href={subject.telegramGroup} target="_blank" rel="noopener noreferrer" className="btn-primary">{t("Telegram guruhga qo'shilish")}</a>
        ) : <span className="chip bg-slate-100 text-slate-500">{t("Telegram guruh hali yo'q")}</span>}
      </PageTitle>
      <Tabs tabs={tabs} value={tab} onChange={setTab} />
      {tab === 'tutors' && (tutors.length ? <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{tutors.map((x) => <TutorCard key={x._id} t={x} />)}</div> : <Empty>{t("Bu fandan repetitor yo'q.")} <Link to="/tutor" className="text-brand-600 underline">{t("Repetitor bo'ling")}</Link></Empty>)}
      {tab === 'materials' && <div className="space-y-6"><MaterialList items={materials} /><MaterialForm subjectId={subject._id} onDone={() => setReload((n) => n + 1)} /></div>}
      {tab === 'exams' && (exams.length ? <div className="grid gap-3 md:grid-cols-2">{exams.map((e) => <ExamRow key={e._id} e={{ ...e, subject }} />)}</div> : <Empty>{t('Nazorat sanalari hali kiritilmagan.')}</Empty>)}
    </>
  );
}
