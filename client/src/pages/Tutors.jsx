import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useApp } from '../context/App.jsx';
import { Empty, ErrorBox, PageTitle, Spinner, useFetch, Field } from '../components/ui.jsx';
import { TutorCard } from '../components/Cards.jsx';
import { Hint } from '../components/Motion.jsx';
import { qs } from '../api.js';
import { FORMAT_LABEL, LANG_LABEL } from '../lib/format.js';
import { t } from '../lib/i18n.js';

export default function Tutors() {
  const { pref, meta } = useApp();
  const [sp] = useSearchParams();
  const [f, setF] = useState({ q: '', subject: sp.get('subject') || '', format: '', language: '', minPrice: '', maxPrice: '', sort: 'rating', mine: !!pref });
  const [debounced, setDebounced] = useState(f);
  useEffect(() => { const id = setTimeout(() => setDebounced(f), 300); return () => clearTimeout(id); }, [f]);

  const subjects = useFetch(`/subjects${qs({ faculty: pref?.faculty, year: pref?.year })}`);
  const d = debounced;
  const path = `/tutors${qs({ q: d.q, subject: d.subject, format: d.format, language: d.language, minPrice: d.minPrice, maxPrice: d.maxPrice, sort: d.sort, ...(d.mine && !d.subject && { faculty: pref?.faculty, year: pref?.year }) })}`;
  const { data, loading, error } = useFetch(path);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });

  return (
    <>
      <PageTitle title={t('Repetitorlar')} sub={t("Narx, til va format bo'yicha taqqoslang")} />
      <div className="grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-[17rem_minmax(0,1fr)]">
        <aside className="card h-fit space-y-4 p-4">
          <Field label="Qidirish"><input className="input" placeholder={t('Ism yoki mavzu')} value={f.q} onChange={set('q')} /></Field>
          <Field label="Fan">
            <select className="input" value={f.subject} onChange={set('subject')}>
              <option value="">{t('Barcha fanlar')}</option>
              {subjects.data?.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Narx dan"><input className="input" type="number" min="0" step="10000" placeholder="0" value={f.minPrice} onChange={set('minPrice')} /></Field>
            <Field label="Narx gacha"><input className="input" type="number" min="0" step="10000" placeholder="∞" value={f.maxPrice} onChange={set('maxPrice')} /></Field>
          </div>
          <Field label="Format"><select className="input" value={f.format} onChange={set('format')}><option value="">{t('Hammasi')}</option>{meta.formats.map((x) => <option key={x} value={x}>{FORMAT_LABEL[x]}</option>)}</select></Field>
          <Field label="Dars tili"><select className="input" value={f.language} onChange={set('language')}><option value="">{t('Hammasi')}</option>{meta.languages.map((x) => <option key={x} value={x}>{LANG_LABEL[x]}</option>)}</select></Field>
          <Field label="Saralash">
            <select className="input" value={f.sort} onChange={set('sort')}>
              <option value="rating">{t("Reyting bo'yicha")}</option><option value="priceAsc">{t('Narx: arzondan')}</option>
              <option value="priceDesc">{t('Narx: qimmatdan')}</option><option value="lessons">{t("Ko'p dars o'tgan")}</option>
            </select>
          </Field>
          {pref && <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.mine} onChange={set('mine')} className="rounded" />{t('Faqat mening kursim fanlari')}</label>}
        </aside>
        <section>
          <Hint className="mb-6" title={t('Narx va reytingni qanday tushunish kerak')}>
            <p>{t("Narx — bir soatlik dars uchun. Birinchi darsingizga {n}% chegirma bron paytida avtomatik qo'shiladi.", { n: meta.firstLessonDiscount })}</p>
            <p>{t("Reyting faqat dars o'tgan talabalar bahosidan hisoblanadi. «Hali baho yo'q» — repetitor yangi degani, yomon degani emas.")}</p>
          </Hint>
          <ErrorBox error={error} />
          {loading ? <Spinner /> : !data?.length ? <Empty>{t("Mos repetitor topilmadi. Filtrlarni o'zgartirib ko'ring.")}</Empty> : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{data.map((x) => <TutorCard key={x._id} t={x} />)}</div>
          )}
        </section>
      </div>
    </>
  );
}
