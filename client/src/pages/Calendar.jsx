import { useApp } from '../context/App.jsx';
import PrefPicker from '../components/PrefPicker.jsx';
import { ExamRow } from '../components/Cards.jsx';
import { Hint } from '../components/Motion.jsx';
import { Empty, ErrorBox, PageTitle, Spinner, useFetch } from '../components/ui.jsx';
import { qs } from '../api.js';
import { MONTHS, tz } from '../lib/format.js';
import { t } from '../lib/i18n.js';

export default function Calendar() {
  const { pref } = useApp();
  const { data, loading, error } = useFetch(`/exams${qs({ faculty: pref?.faculty, year: pref?.year })}`);

  const groups = [];
  (data || []).forEach((e) => {
    const x = tz(e.date);
    const key = `${x.y}-${x.m}`;
    let g = groups.find((y) => y.key === key);
    if (!g) groups.push((g = { key, label: `${MONTHS[x.m]} ${x.y}`, items: [] }));
    g.items.push(e);
  });

  return (
    <>
      <PageTitle title={t('Nazoratlar kalendari')} sub={t('Oraliq va yakuniy nazorat sanalari, necha kun qolgani')} />
      <div className="mb-6"><PrefPicker compact /></div>
      <div className="mb-10 grid gap-4 md:grid-cols-2">
        <Hint title={t('Ranglar nimani bildiradi')}>
          <ul>
            <li>{t('Qizil — 7 kun yoki kamroq qoldi')}</li>
            <li>{t('Sariq — 8 dan 21 kungacha')}</li>
            <li>{t("Yashil — 21 kundan ko'p vaqt bor")}</li>
          </ul>
        </Hint>
        <Hint kind="warn" title={t('Sanalarni tekshirib turing')}>
          <p>{t("Hozircha ba'zi sanalar «Demo sana» deb belgilangan. Muhim sanani doim dekanat e'lon qilgan rasmiy jadval bilan solishtiring.")}</p>
        </Hint>
      </div>
      <ErrorBox error={error} />
      {loading ? <Spinner /> : !groups.length ? <Empty>{t('Nazorat sanalari topilmadi.')}</Empty> : (
        <div className="space-y-14">
          {groups.map((g) => (
            <section key={g.key}>
              <h2 className="mb-4 text-3xl font-extrabold capitalize tracking-[-0.02em] text-slate-900 sm:text-4xl">{g.label}</h2>
              <div className="grid gap-3 md:grid-cols-2">{g.items.map((e) => <ExamRow key={e._id} e={e} />)}</div>
            </section>
          ))}
        </div>
      )}
    </>
  );
}
