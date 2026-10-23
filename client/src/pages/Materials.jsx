import { useState } from 'react';
import { useApp } from '../context/App.jsx';
import PrefPicker from '../components/PrefPicker.jsx';
import { Hint } from '../components/Motion.jsx';
import { ErrorBox, PageTitle, Spinner, useFetch } from '../components/ui.jsx';
import { MaterialForm, MaterialList } from './SubjectDetail.jsx';
import { qs } from '../api.js';
import { MATERIAL_LABEL } from '../lib/format.js';
import { t } from '../lib/i18n.js';

export default function Materials() {
  const { pref, meta } = useApp();
  const [type, setType] = useState('');
  const [subject, setSubject] = useState('');
  const [reload, setReload] = useState(0);
  const subjects = useFetch(`/subjects${qs({ faculty: pref?.faculty, year: pref?.year })}`);
  const { data, loading, error } = useFetch(`/materials${qs({ type, subject, faculty: pref?.faculty, year: pref?.year })}`, [reload]);

  return (
    <>
      <PageTitle title={t("O'quv materiallari")} sub={t("Konspekt, test, video va imtihon savollari — fanlar bo'yicha")} />
      <div className="mb-6 flex flex-wrap gap-3">
        <PrefPicker compact />
        <select className="input !w-auto" value={subject} onChange={(e) => setSubject(e.target.value)} aria-label={t('Fan')}>
          <option value="">{t('Barcha fanlar')}</option>{subjects.data?.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
        </select>
        <select className="input !w-auto" value={type} onChange={(e) => setType(e.target.value)} aria-label={t('Turi')}>
          <option value="">{t('Barcha turlar')}</option>{meta.materialTypes.map((x) => <option key={x} value={x}>{MATERIAL_LABEL[x]}</option>)}
        </select>
      </div>
      <div className="mb-8 grid gap-4 md:grid-cols-2">
        <Hint title={t('Materiallar qanday tekshiriladi')}>
          <p>{t("Siz yuborgan havola avval adminga tushadi. Tekshirilgach hamma ko'radi; tasdiqlanmaguncha ro'yxatda chiqmaydi.")}</p>
        </Hint>
        <Hint kind="warn" title={t('Nimani ulashish mumkin')}>
          <p>{t("Faqat o'zingiz tayyorlagan yoki tarqatishga ruxsat berilgan materiallarni yuboring. Parol yoki shaxsiy ma'lumot bor fayllarni ulashmang.")}</p>
        </Hint>
      </div>
      <ErrorBox error={error} />
      <div className="grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-[minmax(0,1fr)_24rem]">
        {loading ? <Spinner /> : <MaterialList items={data || []} />}
        <MaterialForm subjects={subjects.data || []} onDone={() => setReload((n) => n + 1)} />
      </div>
    </>
  );
}
