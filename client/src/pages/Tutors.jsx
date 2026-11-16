import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useApp } from '../context/App.jsx';
import { Empty, ErrorBox, PageTitle, Spinner, useFetch } from '../components/ui.jsx';
import { TutorCard } from '../components/Cards.jsx';
import { qs } from '../api.js';
import { t } from '../lib/i18n.js';

const SORTS = [['rating', "Reyting bo'yicha"], ['priceAsc', 'Narx: arzondan'], ['priceDesc', 'Narx: qimmatdan']];

/** Tugma ko'rinishidagi tanlov (chip) */
const Pill = ({ on, onClick, children }) => (
  <button type="button" onClick={onClick} aria-pressed={on}
    className={`snap-start whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition ${on ? 'bg-slate-900 text-white shadow-sm' : 'bg-white/60 text-slate-700 ring-1 ring-white/80 backdrop-blur-md hover:bg-white hover:ring-brand-300'}`}>
    {children}
  </button>
);

export default function Tutors() {
  const { pref, meta } = useApp();
  const [sp, setSp] = useSearchParams();
  const subject = sp.get('subject') || '';
  const [sort, setSort] = useState('rating');

  // Fanlar: avvalo talabaning kursiga tegishlilari; havola orqali boshqa fan tanlangan bo'lsa — hammasi
  const mine = useFetch(`/subjects${qs({ faculty: pref?.faculty, year: pref?.year })}`);
  const all = useFetch('/subjects');
  const list = subject && mine.data && !mine.data.some((s) => s._id === subject) ? all.data : mine.data;
  const pick = (id) => setSp(id ? { subject: id } : {}, { replace: true });

  const path = `/tutors${qs({ subject, sort, ...(!subject && pref && { faculty: pref.faculty, year: pref.year }) })}`;
  const { data, loading, error } = useFetch(path);

  return (
    <>
      <PageTitle title={t('Repetitorlar')} sub={t("Narx, til va format bo'yicha taqqoslang")} />

      <div className="mb-8 space-y-4">
        {/* Telefonda: ikki qatorli karusel (yonga suriladi); kattaroq ekranda: pastga qarab o'raladi */}
        <div className="no-scrollbar -mx-4 grid snap-x auto-cols-max grid-flow-col grid-rows-2 gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex sm:flex-wrap sm:overflow-visible sm:px-0" role="group" aria-label={t('Fan')}>
          <Pill on={!subject} onClick={() => pick('')}>{pref ? t('Mening fanlarim') : t('Barcha fanlar')}</Pill>
          {list?.map((s) => <Pill key={s._id} on={subject === s._id} onClick={() => pick(s._id)}>{s.name}</Pill>)}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex rounded-full bg-white/50 p-1 ring-1 ring-white/70 backdrop-blur-md" role="group" aria-label={t('Saralash')}>
            {SORTS.map(([k, l]) => (
              <button key={k} type="button" onClick={() => setSort(k)} aria-pressed={sort === k}
                className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${sort === k ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}>{t(l)}</button>
            ))}
          </div>
          <p className="text-sm text-slate-600">{t("Narx — 1 soatlik dars uchun · birinchi darsga {n}% chegirma", { n: meta.firstLessonDiscount })}</p>
        </div>
      </div>

      <ErrorBox error={error} />
      {loading ? <Spinner /> : !data?.length ? <Empty>{t("Bu fandan hali repetitor yo'q.")}</Empty> : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{data.map((x) => <TutorCard key={x._id} t={x} />)}</div>
      )}
    </>
  );
}
