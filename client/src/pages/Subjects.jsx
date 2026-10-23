import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/App.jsx';
import PrefPicker from '../components/PrefPicker.jsx';
import { Hint } from '../components/Motion.jsx';
import { Empty, ErrorBox, PageTitle, Spinner, useFetch } from '../components/ui.jsx';
import { qs } from '../api.js';
import { t } from '../lib/i18n.js';

export default function Subjects() {
  const { pref } = useApp();
  const [q, setQ] = useState('');
  const { data, loading, error } = useFetch(`/subjects${qs({ faculty: pref?.faculty, year: pref?.year, q })}`);

  return (
    <>
      <PageTitle title={t('Fanlar')} sub={t('Faqat tanlangan fakultet va kursga tegishli fanlar')} />
      <div className="mb-6 flex flex-wrap gap-3">
        <PrefPicker compact />
        <input className="input !w-auto min-w-[12rem] flex-1" placeholder={t("Fan nomi bo'yicha qidirish...")} value={q} onChange={(e) => setQ(e.target.value)} aria-label={t('Qidirish')} />
      </div>
      <Hint className="mb-8" title={t("Fanlar ro'yxati qanday tuziladi")}>
        <p>{t("Ro'yxat tanlagan fakultet va kursingizga qarab chiqadi. «Qo'shimcha» belgisi — hamma kurs uchun ochiq fanlar (masalan IELTS yoki Dasturlash).")}</p>
        <p>{t("Fan ichida repetitorlar, materiallar, nazorat sanalari va Telegram guruhi bor.")}</p>
      </Hint>
      <ErrorBox error={error} />
      {loading ? <Spinner /> : !data?.length ? (
        <Empty>{t("Bu kurs uchun fanlar hali kiritilmagan. Admin panel orqali qo'shiladi.")}</Empty>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((s) => (
            <Link key={s._id} to={`/subjects/${s._id}`} className="card-link flex min-h-[11rem] flex-col p-6">
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-2xl font-extrabold leading-tight tracking-tight text-slate-900">{s.name}</h3>
                {s.category === 'extra' && <span className="chip shrink-0 bg-brand-100 text-brand-700">{t("Qo'shimcha")}</span>}
              </div>
              {s.description && <p className="mt-2 text-base text-slate-700">{s.description}</p>}
              <div className="mt-auto pt-4 text-base"><span className="text-3xl font-extrabold tracking-tight text-brand-700">{s.tutorCount}</span> <span className="text-slate-600">{t('repetitor')}</span></div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
