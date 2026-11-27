import { useState } from 'react';
import { useSeo } from '../lib/seo.js';
import { Link } from 'react-router-dom';
import { useApp } from '../context/App.jsx';
import PrefPicker from '../components/PrefPicker.jsx';
import { Empty, ErrorBox, PageTitle, Spinner, useFetch } from '../components/ui.jsx';
import { qs } from '../api.js';
import { t } from '../lib/i18n.js';

const Pill = ({ on, onClick, children }) => (
  <button type="button" onClick={onClick} aria-pressed={on}
    className={`snap-start whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition ${on ? 'bg-slate-900 text-white shadow-sm' : 'bg-white/60 text-slate-700 ring-1 ring-white/80 backdrop-blur-md hover:bg-white hover:ring-brand-300'}`}>
    {children}
  </button>
);

/** Barcha tasdiqlangan mashq testlari: tanlangan fakultet/kurs fanlari bo'yicha */
export default function Quizzes() {
  const { pref, user } = useApp();
  useSeo("UWED mashq testlari: fanlar bo'yicha onlayn test", "UWED talabalari uchun fanlar bo'yicha mashq testlari: yeching, xatolaringiz izohini ko'ring va nazoratga tayyorlaning.");
  const [subject, setSubject] = useState('');
  const [all, setAll] = useState(false);
  const quizzes = useFetch('/quizzes');
  const mine = useFetch(`/subjects${qs({ faculty: pref?.faculty, year: pref?.year })}`);

  const mineIds = new Set((mine.data || []).map((s) => String(s._id)));
  const pool = (quizzes.data || []).filter((q) => all || !pref || mineIds.has(String(q.subject?._id)));
  // Faqat testi bor fanlar tugma bo'lib chiqadi
  const subjects = [...new Map(pool.filter((q) => q.subject).map((q) => [String(q.subject._id), q.subject])).values()];
  const list = subject ? pool.filter((q) => String(q.subject?._id) === subject) : pool;

  return (
    <>
      <PageTitle title={t('Testlar')} sub={t("Nazoratga tayyorlanish uchun mashq testlari: yeching, natijani ko'ring, tushunmaganingizni tahlil qiling")} />
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <PrefPicker compact />
        {pref && (
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <input type="checkbox" checked={all} onChange={(e) => { setAll(e.target.checked); setSubject(''); }} />
            {t("Boshqa kurslar testlarini ham ko'rsatish")}
          </label>
        )}
      </div>
      {subjects.length > 1 && (
        <div className="chip-row mb-8" role="group" aria-label={t('Fan')}>
          <Pill on={!subject} onClick={() => setSubject('')}>{t('Hammasi')}</Pill>
          {subjects.map((s) => <Pill key={s._id} on={subject === String(s._id)} onClick={() => setSubject(String(s._id))}>{s.name}</Pill>)}
        </div>
      )}
      {user && (
        <Link to="/mistakes" className="card-link mb-6 flex items-center justify-between gap-3 p-5">
          <div>
            <div className="font-bold text-slate-900">★ {t('Mening xatolarim')}</div>
            <div className="text-sm text-slate-600">{t("Barcha testlarda xato qilgan savollaringiz to'g'ri javob va izoh bilan")}</div>
          </div>
          <span className="shrink-0 text-sm font-semibold text-brand-700">{t('Ochish →')}</span>
        </Link>
      )}
      <ErrorBox error={quizzes.error} />
      {quizzes.loading || mine.loading ? <Spinner /> : !list.length ? (
        <Empty>{pref && !all ? t("Sizning fanlaringiz bo'yicha hali test yo'q. «Boshqa kurslar testlarini ham ko'rsatish»ni belgilab ko'ring.") : t("Hali test qo'shilmagan.")}</Empty>
      ) : (
        <div className="space-y-2">
          {list.map((q) => (
            <Link key={q._id} to={`/quizzes/${q._id}`} className="card-link flex flex-col items-start gap-3 p-5 sm:flex-row sm:items-center sm:gap-5">
              <span className="flex shrink-0 flex-wrap gap-1.5"><span className="chip bg-brand-100 text-brand-700">{t('{n} ta savol', { n: q.count })}</span>{q.timeLimit > 0 && <span className="chip bg-amber-100 text-amber-800">⏱ {t('{n} daqiqa', { n: q.timeLimit })}</span>}</span>
              <div className="min-w-0 flex-1">
                <div className="break-words text-lg font-bold text-slate-900">{q.title}</div>
                <div className="text-sm text-slate-600">
                  {q.subject?.name}
                  {q.attempts ? ` · ${t('{n} marta yechilgan', { n: q.attempts })}` : ''}
                  {q.byTutor && <span className="chip ml-2 bg-emerald-100 text-emerald-800">{t('Repetitor tuzgan')}</span>}
                </div>
              </div>
              <span className="shrink-0 text-sm font-semibold text-brand-700">{t('Yechish →')}</span>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
