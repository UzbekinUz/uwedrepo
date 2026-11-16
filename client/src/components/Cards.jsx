import { Link } from 'react-router-dom';
import { Stars } from './ui.jsx';
import { t } from '../lib/i18n.js';
import { money, FORMAT_LABEL, LANG_LABEL, EXAM_LABEL, dateLong, daysLeft } from '../lib/format.js';

export function TutorCard({ t: tutor }) {
  const name = tutor.user?.name?.trim() || '?';
  return (
    <Link to={`/tutors/${tutor._id}`} className="card-link relative flex h-full flex-col gap-4 p-6">
      {tutor.featured && <span className="chip absolute right-4 top-4 bg-brand-100 text-brand-700">{t('Tavsiya')}</span>}
      <div className={`flex items-center gap-3 ${tutor.featured ? 'pr-20' : ''}`}>
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-600 text-lg font-bold text-white">{Array.from(name)[0]}</div>
        <div className="min-w-0">
          <h3 className="truncate text-lg font-bold leading-tight text-slate-900" title={name}>{name}</h3>
          {tutor.ratingCount
            ? <Stars value={tutor.ratingAvg} count={tutor.ratingCount} size="text-sm" />
            : <div className="mt-0.5 text-sm text-slate-500">{t('Yangi repetitor')} · {t("Hali baho yo'q")}</div>}
        </div>
      </div>
      <p className="line-clamp-2 text-base text-slate-800">{tutor.headline}</p>
      <div className="flex flex-wrap gap-1.5">
        {tutor.subjects?.slice(0, 3).map((s) => <span key={s._id} className="chip bg-slate-100 text-slate-700">{s.name}</span>)}
        {tutor.subjects?.length > 3 && <span className="chip bg-slate-100 text-slate-600">+{tutor.subjects.length - 3}</span>}
      </div>
      <div className="mt-auto flex items-end justify-between gap-3 border-t border-slate-100 pt-4">
        <div className="min-w-0 text-sm leading-snug text-slate-600">
          <div>{tutor.formats.map((f) => FORMAT_LABEL[f]).join(' · ')}</div>
          <div>{tutor.languages.map((l) => LANG_LABEL[l]).join(', ')}</div>
        </div>
        <div className="shrink-0 text-right">
          <div className="whitespace-nowrap text-xl font-extrabold tracking-tight text-brand-700">{money(tutor.pricePerHour)}</div>
          <div className="text-xs text-slate-500">{t('soatiga')}</div>
        </div>
      </div>
    </Link>
  );
}

export function ExamRow({ e }) {
  const left = daysLeft(e.date);
  const tone = left <= 7 ? 'text-red-700' : left <= 21 ? 'text-amber-700' : 'text-brand-700';
  return (
    <Link to={`/subjects/${e.subject?._id}`} className="card-link flex items-center gap-5 p-5 sm:p-6">
      <div className={`w-24 shrink-0 text-center ${tone}`}>
        <div className="text-5xl font-extrabold leading-none tracking-[-0.04em]">{Math.max(left, 0)}</div>
        <div className="mt-1 text-sm font-medium">{t('kun')}</div>
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-lg font-bold text-slate-900">{e.subject?.name}</div>
        <div className="text-sm text-slate-700">{EXAM_LABEL[e.type]} · {dateLong(e.date)}</div>
        {e.note && <div className="text-sm text-slate-600">{t(e.note)}</div>}
      </div>
      <span className="hidden text-sm font-semibold text-brand-700 sm:inline">{t('Tayyorlanish →')}</span>
    </Link>
  );
}
