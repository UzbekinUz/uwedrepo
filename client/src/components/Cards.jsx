import { Link } from 'react-router-dom';
import { Stars } from './ui.jsx';
import { t } from '../lib/i18n.js';
import { money, FORMAT_LABEL, LANG_LABEL, EXAM_LABEL, dateLong, daysLeft } from '../lib/format.js';

export function TutorCard({ t: tutor }) {
  return (
    <Link to={`/tutors/${tutor._id}`} className="card-link flex flex-col gap-4 p-6">
      <div className="flex items-start gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-600 text-lg font-bold text-white">
          {tutor.user?.name?.[0] || '?'}
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-lg font-bold text-slate-900">{tutor.user?.name}</h3>
            {tutor.featured && <span className="chip bg-brand-100 text-brand-700">{t('Tavsiya')}</span>}
          </div>
          <Stars value={tutor.ratingAvg} count={tutor.ratingCount} size="text-sm" />
        </div>
      </div>
      <p className="line-clamp-2 text-base text-slate-800">{tutor.headline}</p>
      <div className="flex flex-wrap gap-1.5">
        {tutor.subjects?.slice(0, 3).map((s) => <span key={s._id} className="chip bg-slate-100 text-slate-700">{s.name}</span>)}
        {tutor.subjects?.length > 3 && <span className="chip bg-slate-100 text-slate-600">+{tutor.subjects.length - 3}</span>}
      </div>
      <div className="mt-auto flex items-end justify-between pt-2">
        <div className="text-sm text-slate-600">
          {tutor.formats.map((f) => FORMAT_LABEL[f]).join(' · ')}<br />{tutor.languages.map((l) => LANG_LABEL[l]).join(', ')}
        </div>
        <div className="text-right"><div className="text-2xl font-extrabold tracking-tight text-brand-700">{money(tutor.pricePerHour)}</div><div className="text-sm text-slate-600">{t('soatiga')}</div></div>
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
