import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSeo } from '../lib/seo.js';
import { Empty, ErrorBox, PageTitle, Spinner, useFetch } from '../components/ui.jsx';
import { dateTime } from '../lib/format.js';
import { t } from '../lib/i18n.js';

/** «Mening xatolarim» (Premium): har bir testning oxirgi urinishidagi xato javoblar — to'g'ri javob va izoh bilan */
export default function Mistakes() {
  useSeo('Mening xatolarim', '', { noindex: true });
  const { data, loading, error } = useFetch('/quizzes/mistakes');
  const [subject, setSubject] = useState('');
  const [shown, setShown] = useState(() => new Set());

  if (loading) return <Spinner />;
  const items = data?.items || [];
  const subjects = [...new Set(items.map((x) => x.subject).filter(Boolean))];
  const list = subject ? items.filter((x) => x.subject === subject) : items;
  const toggle = (id) => setShown((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });

  return (
    <>
      <PageTitle title={t('Mening xatolarim')} sub={t("Testlarda xato qilgan savollaringiz bir joyda: avval o'zingiz javob bering, keyin to'g'ri javob va izohni oching.")} back={{ to: '/quizzes', label: t('Testlar') }} />
      <ErrorBox error={error} />

      {data?.locked ? (
        <div className="card p-8 text-center">
          <div className="text-4xl">★</div>
          <div className="mt-2 text-xl font-extrabold text-slate-900">{t("{n} ta xato savolingiz to'plangan", { n: data.count })}</div>
          <p className="mx-auto mt-2 max-w-md text-slate-600">{t("«Mening xatolarim» — Premium imkoniyati. Barcha testlardagi xatolaringizni to'g'ri javob va izoh bilan bir joyda takrorlang.")}</p>
          <Link to="/premium" className="btn-primary mt-5">{t('Premiumni ko\'rish')}</Link>
        </div>
      ) : !items.length ? (
        <Empty>{t("Hozircha xato yo'q. Testlarni yeching — xato qilgan savollaringiz shu yerda to'planadi.")}</Empty>
      ) : (
        <>
          {subjects.length > 1 && (
            <div className="chip-row mb-6">
              <button type="button" className={`choice ${!subject ? 'choice-on' : ''}`} onClick={() => setSubject('')}>{t('Hammasi')} ({items.length})</button>
              {subjects.map((s) => <button key={s} type="button" className={`choice ${subject === s ? 'choice-on' : ''}`} onClick={() => setSubject(s)}>{s}</button>)}
            </div>
          )}
          <div className="space-y-3">
            {list.map((x) => {
              const key = `${x.quiz._id}:${x.question}`;
              const open = shown.has(key);
              return (
                <div key={key} className="card p-5">
                  <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span className="chip bg-brand-100 text-brand-700">{x.subject}</span>
                    <Link to={`/quizzes/${x.quiz._id}`} className="font-semibold text-brand-700 hover:underline">{x.quiz.title}</Link>
                    <span>· {dateTime(x.attemptAt)}</span>
                  </div>
                  <div className="whitespace-pre-line font-semibold text-slate-900">{x.text}</div>
                  <ul className="mt-3 space-y-1.5">
                    {x.options.map((o, i) => {
                      const cls = !open ? 'bg-white/60 text-slate-700' : i === x.correct ? 'bg-emerald-100 text-emerald-900 font-semibold' : i === x.chosen ? 'bg-red-100 text-red-800 line-through' : 'bg-white/60 text-slate-500';
                      return <li key={i} className={`rounded-lg px-3 py-2 text-sm ${cls}`}>{String.fromCharCode(65 + i)}. {o}{open && i === x.chosen && ` — ${t('sizning javobingiz')}`}</li>;
                    })}
                  </ul>
                  {open && x.chosen < 0 && <p className="mt-2 text-sm text-slate-500">{t('Bu savolga javob bermagansiz.')}</p>}
                  {open && x.explanation && <p className="mt-3 rounded-lg bg-slate-50 p-3 text-sm text-slate-700">{x.explanation}</p>}
                  <button type="button" className="btn-ghost btn-sm mt-3" onClick={() => toggle(key)}>{open ? t('Yashirish') : t("To'g'ri javobni ko'rsatish")}</button>
                </div>
              );
            })}
          </div>
        </>
      )}
    </>
  );
}
