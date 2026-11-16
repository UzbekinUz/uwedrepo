import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useApp } from '../context/App.jsx';
import PrefPicker from '../components/PrefPicker.jsx';
import { ExamRow, TutorCard } from '../components/Cards.jsx';
import { Accordion, CountUp, Icon, IconBadge, Item, Reveal, Stagger, StarField } from '../components/Motion.jsx';
import { HeroBg, Spinner, Tabs, useFetch } from '../components/ui.jsx';
import { qs } from '../api.js';
import { t } from '../lib/i18n.js';
import { daysLeft, dateLong, EXAM_LABEL, money } from '../lib/format.js';

const wrap = 'mx-auto max-w-6xl px-4 sm:px-6';
const h2 = 'text-[clamp(1.75rem,4.2vw,3.25rem)] font-extrabold leading-[1.04] tracking-[-0.03em]';

// Matnlar funksiya ichida: til almashganda qayta hisoblanadi
const features = () => [
  { icon: 'book', to: '/subjects', title: t('Kursingizga moslangan fanlar'), text: t("Fakultet va kursingizni tanlaysiz — sayt faqat sizning fanlaringizni ko'rsatadi: Hisoblash, Ekonomika, Rus tili va boshqalar. Keraksiz narsa yo'q."), cta: t("Fanlarni ko'rish") },
  { icon: 'person', to: '/tutors', title: t('Repetitorlarni taqqoslash'), text: t("Yuqori kurs talabalari va tajribali o'qituvchilar. Narx, dars tili, format (onlayn yoki offlayn), reyting va bo'sh vaqtlarni yonma-yon ko'rib, o'zingizga mosini tanlaysiz."), cta: t('Repetitor topish') },
  { icon: 'calendar', to: '/calendar', title: t('Nazoratlar kalendari'), text: t("Oraliq va yakuniy nazorat sanalari hamda «necha kun qoldi» hisoblagichi. Sanadan fanga, fandan repetitorga bir bosishda o'tasiz."), cta: t("Kalendarni ochish") },
  { icon: 'file', to: '/materials', title: t("O'quv materiallari"), text: t("Konspekt, test, video va imtihon savollari fanlar bo'yicha bir joyda. O'zingiz ham material ulashishingiz mumkin — admin tekshirgach hamma ko'radi."), cta: t('Materiallarni ochish') },
  { icon: 'telegram', to: '/subjects', title: t('Fan guruhlari'), text: t("Har bir fan uchun Telegram muhokama guruhi: savol bering, kursdoshlar bilan birga tayyorlaning. Guruh havolasi fan sahifasida turadi."), cta: t('Guruhlarni topish') },
  { icon: 'star', to: '/tutors', title: t('Haqiqiy baho va sharhlar'), text: t("Sharhni faqat shu repetitordan dars olgan talaba qoldira oladi — soxta sharh bo'lmaydi. Reyting har yangi bahodan keyin yangilanadi."), cta: t('Reytinglarni ko\'rish') },
];

const advantages = (meta) => [
  { icon: 'tag', title: t('Narxlar ochiq'), text: t("Har bir repetitorning soatlik narxi oldindan ko'rinadi. Kelishib o'tirish ham, yashirin to'lov ham yo'q.") },
  { icon: 'percent', title: t('Birinchi darsga {n}% chegirma', { n: meta.firstLessonDiscount }), text: t("Platformada birinchi marta dars olsangiz, narxdan chegirma bron paytida avtomatik hisoblanadi.") },
  { icon: 'shield', title: t('Tekshirilgan repetitorlar'), text: t("Har bir anketani admin ko'rib chiqadi. Tasdiqlanmagan profil katalogda ko'rinmaydi.") },
  { icon: 'lock', title: t('Parolsiz, xavfsiz kirish'), text: t("Telegram bot orqali bir martalik kod bilan kirasiz: parol eslab yurish ham, email tasdiqlash ham shart emas.") },
  { icon: 'globe', title: t("O'zbek tilida"), text: t("Repetitorlarni dars tili (o'zbek, rus, ingliz) bo'yicha filtrlaysiz. Sayt interfeysi ham uch tilda.") },
  { icon: 'clock', title: t('Vaqtingizni tejaydi'), text: t("Tarqoq kanallarda qidirish o'rniga hammasi bir yo'lda: fan, repetitor, bo'sh vaqt, bron.") },
];

const compare = () => [
  [t("Narxni oldindan ko'rish"), false, true],
  [t("Sharhlar faqat dars olganlardan"), false, true],
  [t("Bo'sh vaqt jadvalda ko'rinadi"), false, true],
  [t('Repetitorni admin tekshiradi'), false, true],
  [t('Fakultet va kursga moslash'), false, true],
  [t("Dars to'lovi va bekor qilish qoidalari aniq"), false, true],
];

const stepsStudent = (meta) => [
  { icon: 'book', title: t('Fakultet va kursni tanlang'), text: t("Birinchi sahifada tanlaysiz, keyin tanlov eslab qolinadi va hamma sahifa shunga moslashadi.") },
  { icon: 'telegram', title: t("Telegram orqali ro'yxatdan o'ting"), text: t("Botda Start tugmasini bosasiz, bot kod beradi, kodni saytga kiritasiz. Parol shart emas.") },
  { icon: 'search', title: t('Repetitorni tanlang, vaqtni belgilang'), text: t("Narx va reytingni taqqoslaysiz, bo'sh soatlardan birini tanlab bron yuborasiz.") },
  { icon: 'check', title: t('Repetitor tasdiqlaydi'), text: t("Tasdiqdan keyin Telegram aloqasi ochiladi va «To'lash» tugmasi chiqadi.") },
  { icon: 'card', title: t("To'laysiz va dars o'tadi"), text: t("To'lov platforma ichida. Dars o'tgach repetitor «Dars o'tdi» deb belgilaydi. Hozir pilot rejim: haqiqiy pul yechilmaydi.") },
  { icon: 'star', title: t('Baho berasiz'), text: t("Faqat o'tgan darsga baho va sharh qoldirish mumkin: reyting shunday halol bo'lib qoladi.") },
];
const stepsTutor = (meta) => [
  { icon: 'file', title: t("Anketani to'ldirasiz"), text: t("Fanlar, soatlik narx, dars tili, format va haftalik bo'sh vaqtlaringizni kiritasiz.") },
  { icon: 'shield', title: t('Admin tasdiqlaydi'), text: t("Tekshiruvdan keyin katalogda ko'rinasiz. Anketani istalgan vaqt yangilashingiz mumkin.") },
  { icon: 'calendar', title: t('Bronlarni qabul qilasiz'), text: t("Talaba tanlagan vaqt sizga keladi: tasdiqlaysiz yoki rad etasiz. Band vaqtga ikkinchi bron tushmaydi.") },
  { icon: 'card', title: t('Dars berasiz va daromad olasiz'), text: t("Har bir to'lovdan platforma {n}% komissiya oladi, qolgani sizniki. Talaba uchun foydalanish bepul.", { n: meta.commission }) },
];

const faq = (meta) => [
  [t('Sayt bepulmi?'), t("Talabalar uchun foydalanish bepul. Platforma faqat repetitor olgan to'lovdan {n}% komissiya oladi.", { n: meta.commission })],
  [t("To'lov haqiqiymi?"), t("Hozir pilot rejim: «To'lash» tugmasi bosilganda haqiqiy pul yechilmaydi, jarayon sinovdan o'tkazilmoqda. Click va Payme ulanganda bu haqda e'lon qilinadi.")],
  [t('Darsni bekor qila olamanmi?'), t("Ha. To'langan darsni boshlanishiga {h} soatdan ko'p qolganda bekor qilsangiz, to'lov qaytariladi; kamroq qolsa — qaytarilmaydi. Repetitor o'zi rad etsa, pul har doim qaytariladi.", { h: meta.cancelHours })],
  [t('Sharhlarga ishonsa bo\'ladimi?'), t("Sharhni faqat dars o'tgan bron egasi qoldiradi va bitta bronga faqat bitta sharh mumkin. Shuning uchun soxta sharh yozib bo'lmaydi.")],
  [t('Nega Telegram orqali kirish?'), t("Ko'p talaba Telegramdan foydalanadi. Kod bir martalik, parol kerak emas. Ismingiz va username'ingiz akkauntga ulanadi, telefon raqami esa ixtiyoriy.")],
  [t('Kontaktlarim kimga ko\'rinadi?'), t("Telegram username va telefon faqat tasdiqlangan bronda, shu bronning ikkinchi tomoniga ko'rinadi. Katalogda hech kimga ko'rsatilmaydi.")],
  [t("Repetitor bo'lish uchun nima kerak?"), t("Ro'yxatdan o'ting va «Repetitor bo'lish» sahifasidagi anketani to'ldiring. Admin tasdiqlagach katalogda ko'rinasiz.")],
  [t('Nazorat sanalari qayerdan olinadi?'), t("Sanalarni admin kiritadi. Hozircha demo sanalar turibdi; rasmiy jadval e'lon qilingach yangilanadi. Muhim sanani doim dekanat jadvali bilan solishtiring.")],
];

/** Ismning birinchi harfi (emoji va maxsus shrift harflari ham buzilmasin) */
const initial = (name = '') => Array.from(name.trim())[0] || '?';

/** Hero kartasi: nozik shaffof fon, yengil soya */
const glass = 'rounded-2xl bg-white/[0.06] p-5 ring-1 ring-white/10 backdrop-blur-sm sm:p-6';

/** Eng yaqin nazorat: kunlar sanab chiqadi */
function ExamCard({ exam }) {
  const left = Math.max(daysLeft(exam.date), 0);
  return (
    <Link to={`/subjects/${exam.subject?._id}`} className={`${glass} group flex items-center gap-5 transition hover:bg-white/[0.1]`}>
      <CountUp to={left} duration={1.6} className="text-6xl font-extrabold leading-none tracking-[-0.05em] text-brand-300 sm:text-7xl" />
      <div className="min-w-0">
        <div className="text-xs font-semibold uppercase tracking-wider text-brand-300">{t('kun qoldi')}</div>
        <div className="mt-1 truncate text-lg font-bold text-white">{exam.subject?.name}</div>
        <div className="text-sm text-slate-300">{EXAM_LABEL[exam.type]} · {dateLong(exam.date)}</div>
      </div>
    </Link>
  );
}

/** Mashq testi kartasi (nazorat sanasi bo'lmasa ham hero bo'sh qolmasin) */
function QuizCard({ quiz }) {
  return (
    <Link to={`/quizzes/${quiz._id}`} className={`${glass} group block transition hover:bg-white/[0.1]`}>
      <div className="flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-2 rounded-full bg-brand-300/15 px-3 py-1 text-xs font-semibold text-brand-300"><Icon name="check" size={14} />{t('Mashq testi')}</span>
        <span className="text-sm text-slate-300">{t('{n} ta savol', { n: quiz.count })}</span>
      </div>
      <div className="mt-3 line-clamp-2 text-lg font-bold leading-snug text-white">{quiz.title}</div>
      <div className="mt-1 text-sm text-slate-300">{quiz.subject?.name}</div>
      <div className="mt-4 flex items-center justify-between">
        <span className="text-sm text-slate-400">{quiz.attempts ? t('{n} marta yechilgan', { n: quiz.attempts }) : t('Birinchi bo\'lib yeching')}</span>
        <span className="font-semibold text-brand-300 transition group-hover:translate-x-1">{t('Yechish →')}</span>
      </div>
    </Link>
  );
}

/** Tavsiya etilgan repetitor (hero uchun ixcham) */
function TutorMini({ tutor }) {
  return (
    <Link to={`/tutors/${tutor._id}`} className="group block rounded-2xl glass p-5 text-slate-900 shadow-2xl shadow-black/30 transition hover:-translate-y-0.5 sm:p-6">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-600 text-lg font-bold text-white">{initial(tutor.user?.name)}</div>
        <div className="min-w-0 flex-1">
          <div className="truncate font-bold">{tutor.user?.name}</div>
          <div className="text-sm text-slate-600">{tutor.ratingCount ? `★ ${tutor.ratingAvg.toFixed(1)} (${tutor.ratingCount})` : t('Yangi repetitor')}</div>
        </div>
        {tutor.featured && <span className="chip bg-brand-100 text-brand-700">{t('Tavsiya')}</span>}
      </div>
      <p className="mt-3 line-clamp-2 text-sm text-slate-700">{tutor.headline}</p>
      <div className="mt-4 flex items-end justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">{tutor.subjects?.slice(0, 2).map((s) => <span key={s._id} className="chip bg-slate-100 text-slate-700">{s.name}</span>)}</div>
        <div className="shrink-0 text-right"><div className="font-extrabold text-brand-700">{money(tutor.pricePerHour)}</div><div className="text-xs text-slate-500">{t('soatiga')}</div></div>
      </div>
    </Link>
  );
}

/** Hero o'ng tomoni: haqiqiy ma'lumotdan kartalar. Ma'lumot yo'q bo'lsa karta chiqmaydi. */
function HeroCards({ exam, quiz, tutor, stats }) {
  const nums = stats && [[stats.tutors, 'repetitor'], [stats.subjects, 'fan'], [stats.quizzes, 'test']].filter(([n]) => n);
  return (
    <div className="relative space-y-4 lg:pl-6">
      {exam ? <ExamCard exam={exam} /> : quiz && <QuizCard quiz={quiz} />}
      {tutor && <div className="lg:-ml-10 lg:mr-6"><TutorMini tutor={tutor} /></div>}
      {nums?.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {nums.map(([n, l]) => <span key={l} className="rounded-full bg-white/[0.06] px-4 py-2 text-sm text-slate-200 ring-1 ring-white/10"><b className="text-white">{n}</b> {t(l)}</span>)}
        </div>
      )}
    </div>
  );
}

/** Repetitorlar avatarlari: ishonch belgisi */
function TutorFaces({ tutors, total }) {
  if (!tutors?.length) return null;
  return (
    <Link to="/tutors" className="mt-8 inline-flex items-center gap-3 text-sm text-slate-300 hover:text-white">
      <span className="flex -space-x-2">
        {tutors.slice(0, 5).map((x) => <span key={x._id} className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white ring-2 ring-field">{initial(x.user?.name)}</span>)}
      </span>
      <span>{t('{n} ta tekshirilgan repetitor', { n: total || tutors.length })}</span>
    </Link>
  );
}

export default function Home() {
  const { pref, meta } = useApp();
  const filter = qs({ faculty: pref?.faculty, year: pref?.year });
  const exams = useFetch(`/exams${filter}`);
  const tutors = useFetch(`/tutors${filter}`);
  const stats = useFetch('/stats');
  const quizzes = useFetch('/quizzes');
  const [who, setWho] = useState('student');
  const steps = who === 'student' ? stepsStudent(meta) : stepsTutor(meta);

  return (
    <>
      {/* 1. Hero */}
      <section className="relative overflow-hidden bg-field text-white">
        <HeroBg />
        <div className={`${wrap} relative grid gap-12 py-14 sm:py-20 lg:grid-cols-[1.35fr_1fr] lg:items-center lg:gap-14`}>
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/[0.08] px-3.5 py-1.5 text-sm font-medium text-brand-100 ring-1 ring-white/10">
              <span className="h-2 w-2 animate-pulse rounded-full bg-brand-300" />{t('Pilot · talabalar uchun bepul')}
            </span>
            <h1 className="mt-5 text-[clamp(2.25rem,4.6vw,3.4rem)] font-extrabold leading-[1.02] tracking-[-0.035em]">
              <span className="lg:whitespace-nowrap">{t('UWED talabalari uchun')}</span><br /><span className="text-brand-300">{t('repetitorlar va testlar')}</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg text-slate-300">{t("Repetitorlar, materiallar, nazoratlar kalendari va fan guruhlari. Kursingizga moslashtirilgan, narxlari ochiq, sharhlari haqiqiy.")}</p>
            <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-base text-white">
              {[t('Ro\'yxatdan o\'tish bepul'), t('Parol kerak emas'), t("Birinchi darsga chegirma")].map((x) => (
                <li key={x} className="flex items-center gap-2"><Icon name="check" size={20} className="text-brand-300" />{x}</li>
              ))}
            </ul>
            <div className="mt-8 max-w-xl rounded-2xl bg-white/[0.06] p-4 ring-1 ring-white/10">
              <div className="mb-2 text-sm font-medium text-slate-300">{t('Fakultet va kursingizni tanlang:')}</div>
              <div className="text-slate-900"><PrefPicker /></div>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/tutors" className="btn bg-brand-300 px-7 py-3 text-base text-slate-900 hover:bg-white">{t('Repetitor topish')}</Link>
              <Link to="/subjects" className="btn bg-white/10 px-7 py-3 text-base text-white hover:bg-white/20">{t("Fanlarimni ko'rish")}</Link>
            </div>
            <TutorFaces tutors={tutors.data} total={stats.data?.tutors} />
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}>
            {exams.loading || tutors.loading ? <Spinner /> : (
              <HeroCards exam={exams.data?.[0]} quiz={quizzes.data?.[0]} tutor={tutors.data?.[0]} stats={stats.data} />
            )}
          </motion.div>
        </div>
      </section>

      {/* 2. Haqiqiy raqamlar */}
      <section className="bg-brand-700 text-white">
        <Stagger className={`${wrap} grid grid-cols-2 gap-8 py-10 sm:py-12 lg:grid-cols-4`}>
          {[['subjects', 'Fanlar'], ['tutors', 'Repetitorlar'], ['materials', 'Materiallar'], ['quizzes', 'Mashq testlari']].map(([k, label]) => (
            <Item key={k}>
              <CountUp to={stats.data?.[k] || 0} className="block text-5xl font-extrabold tracking-[-0.04em] sm:text-6xl" />
              <div className="mt-1 text-base text-brand-100">{t(label)}</div>
            </Item>
          ))}
        </Stagger>
      </section>

      {/* 3. Sayt nima qila oladi */}
      <section className={`${wrap} mt-24 sm:mt-32`} id="imkoniyatlar">
        <Reveal><h2 className={`${h2} max-w-3xl`}>{t('UWEDRepo sizga nimalarni beradi')}</h2></Reveal>
        <Reveal delay={0.05}><p className="mt-4 max-w-2xl text-lg text-slate-600">{t("Ro'yxatdan o'tmasdan ham fanlar, nazorat sanalari va repetitorlarni ko'rishingiz mumkin. Bron va baho uchun kirish kerak.")}</p></Reveal>
        <Stagger className="mt-12 grid gap-4 md:grid-cols-2">
          {features().map((f, i) => (
            <Item key={f.title}>
              <Link to={f.to} className="card-link group flex h-full gap-5 p-6 sm:p-8">
                <IconBadge name={f.icon} delay={i * 0.25} />
                <div>
                  <h3 className="text-2xl font-extrabold leading-tight tracking-tight text-slate-900">{f.title}</h3>
                  <p className="mt-2 text-base leading-relaxed text-slate-700">{f.text}</p>
                  <span className="mt-4 inline-block text-base font-semibold text-brand-700 transition group-hover:translate-x-1">{f.cta} →</span>
                </div>
              </Link>
            </Item>
          ))}
        </Stagger>
      </section>

      {/* 4. Yaqin nazoratlar */}
      <section className={`${wrap} mt-24 sm:mt-32`}>
        {/* Sana bo'lmasa bo'sh blok o'rniga mashq testlari ko'rsatiladi */}
        {exams.data?.length || !quizzes.data?.length ? (
          <>
            <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
              <h2 className={h2}>{t('Yaqinlashayotgan nazoratlar')}</h2>
              <Link to="/calendar" className="text-base font-semibold text-brand-700 hover:underline">{t('Barchasi →')}</Link>
            </div>
            {exams.loading ? <Spinner /> : (
              <Stagger className="grid gap-3 md:grid-cols-2">
                {exams.data?.slice(0, 4).map((e) => <Item key={e._id}><ExamRow e={e} /></Item>)}
                {!exams.data?.length && <div className="card p-8 text-base text-slate-600 md:col-span-2">{t('Hozircha nazorat sanalari kiritilmagan.')}</div>}
              </Stagger>
            )}
          </>
        ) : (
          <>
            <div className="mb-8">
              <h2 className={h2}>{t('Nazoratga tayyorlaning')}</h2>
              <p className="mt-3 max-w-2xl text-lg text-slate-600">{t("Mashq testini yeching: natija darhol chiqadi, xato qilgan savollaringiz izohi bilan ko'rinadi.")}</p>
            </div>
            <Stagger className="grid gap-3 md:grid-cols-2">
              {quizzes.data.slice(0, 4).map((q) => (
                <Item key={q._id}>
                  <Link to={`/quizzes/${q._id}`} className="card-link group flex h-full items-center gap-5 p-6">
                    <IconBadge name="check" />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold text-brand-700">{q.subject?.name} · {t('{n} ta savol', { n: q.count })}</div>
                      <div className="mt-1 text-lg font-bold leading-snug text-slate-900">{q.title}</div>
                    </div>
                    <span className="shrink-0 font-semibold text-brand-700 transition group-hover:translate-x-1">{t('Yechish →')}</span>
                  </Link>
                </Item>
              ))}
            </Stagger>
          </>
        )}
      </section>

      {/* 5. Qanday ishlaydi */}
      <section className="mt-24 bg-brand-100 sm:mt-32" id="qanday">
        <div className={`${wrap} py-16 sm:py-24`}>
          <Reveal><h2 className={`${h2} max-w-3xl`}>{t('Qanday ishlaydi')}</h2></Reveal>
          <div className="mt-8"><Tabs tabs={[['student', t('Talaba uchun')], ['tutor', t('Repetitor uchun')]]} value={who} onChange={setWho} /></div>
          <AnimatePresence mode="wait">
            <motion.ol key={who} className="grid gap-x-12 gap-y-10 md:grid-cols-2 lg:grid-cols-3" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>
              {steps.map((s, i) => (
                <li key={s.title} className="flex gap-4">
                  <IconBadge name={s.icon} tone="light" delay={i * 0.2} />
                  <div>
                    <h3 className="text-xl font-bold leading-tight text-slate-900">{s.title}</h3>
                    <p className="mt-2 text-base leading-relaxed text-slate-700">{s.text}</p>
                  </div>
                </li>
              ))}
            </motion.ol>
          </AnimatePresence>
          <div className="mt-12">
            <Link to={who === 'student' ? '/register' : '/tutor'} className="btn-primary px-7 py-3 text-base">{who === 'student' ? t("Ro'yxatdan o'tish") : t("Repetitor bo'lish")}</Link>
          </div>
        </div>
      </section>

      {/* 6. Afzalliklar */}
      <section className="relative overflow-hidden bg-field text-white">
        <StarField opacity={0.06} />
        <div className={`${wrap} relative py-16 sm:py-24`}>
          <Reveal><h2 className={`${h2} max-w-3xl`}>{t('Nega aynan UWEDRepo')}</h2></Reveal>
          <Stagger className="mt-12 grid gap-x-10 gap-y-12 md:grid-cols-2 lg:grid-cols-3">
            {advantages(meta).map((a, i) => (
              <Item key={a.title} className="flex gap-4">
                <IconBadge name={a.icon} tone="dark" delay={i * 0.2} />
                <div>
                  <h3 className="text-xl font-bold leading-tight">{a.title}</h3>
                  <p className="mt-2 text-base leading-relaxed text-slate-300">{a.text}</p>
                </div>
              </Item>
            ))}
          </Stagger>
        </div>
      </section>

      {/* 7. Taqqoslash */}
      <section className={`${wrap} mt-24 sm:mt-32`}>
        <Reveal><h2 className={`${h2} max-w-3xl`}>{t('Telegram kanallari bilan solishtiring')}</h2></Reveal>
        <Reveal delay={0.05} className="relative mt-10 overflow-x-auto">
          <table className="w-full min-w-[34rem] text-left text-base">
            <thead>
              <tr className="bg-slate-100 text-slate-900">
                <th className="p-4 font-semibold sm:p-5" />
                <th className="p-4 text-center font-semibold sm:p-5">{t('Tarqoq kanallar')}</th>
                <th className="bg-brand-600 p-4 text-center font-bold text-white sm:p-5">UWEDRepo</th>
              </tr>
            </thead>
            <tbody>
              {compare().map(([row, other, us]) => (
                <tr key={row} className="even:bg-slate-50">
                  <td className="p-4 font-medium text-slate-900 sm:p-5">{row}</td>
                  <td className="p-4 text-center sm:p-5"><span className="inline-flex text-slate-400"><Icon name={other ? 'check' : 'cross'} size={24} /></span><span className="sr-only">{other ? t('Ha') : t("Yo'q")}</span></td>
                  <td className="p-4 text-center sm:p-5"><span className="inline-flex text-brand-600"><Icon name={us ? 'check' : 'cross'} size={26} /></span><span className="sr-only">{us ? t('Ha') : t("Yo'q")}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Reveal>
      </section>

      {/* 8. Repetitorlar */}
      <section className={`${wrap} mt-24 sm:mt-32`}>
        <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
          <h2 className={h2}>{t('Tavsiya etilgan repetitorlar')}</h2>
          <Link to="/tutors" className="text-base font-semibold text-brand-700 hover:underline">{t('Barchasi →')}</Link>
        </div>
        {tutors.loading ? <Spinner /> : (
          <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {tutors.data?.slice(0, 3).map((x) => <Item key={x._id}><motion.div whileHover={{ y: -6 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }} className="h-full"><TutorCard t={x} /></motion.div></Item>)}
            {!tutors.data?.length && <div className="card p-8 text-base text-slate-600 sm:col-span-3">{t("Bu kurs uchun repetitorlar hali yo'q.")} <Link to="/tutor" className="font-semibold text-brand-700 underline">{t("Birinchi bo'ling!")}</Link></div>}
          </Stagger>
        )}
      </section>

      {/* 9. Savol-javob */}
      <section className={`${wrap} mt-24 sm:mt-32`} id="savol">
        <Reveal><h2 className={`${h2} max-w-3xl`}>{t('Ko\'p beriladigan savollar')}</h2></Reveal>
        <Reveal delay={0.05} className="mt-10 max-w-3xl"><Accordion items={faq(meta)} /></Reveal>
      </section>

      {/* 10. Chaqiruv */}
      <section className={`${wrap} mt-24 sm:mt-32`}>
        <div className="relative overflow-hidden bg-field px-6 py-14 text-white sm:px-14 sm:py-20">
          <StarField opacity={0.08} />
          <Reveal className="relative">
            <h2 className="max-w-4xl text-[clamp(1.6rem,5vw,3.75rem)] font-extrabold leading-[1.02] tracking-[-0.03em]">{t("Bilimingizni daromadga aylantiring")}</h2>
            <p className="mt-5 max-w-xl text-lg text-slate-300">{t("Yuqori kurs talabasimisiz? Repetitor bo'ling: jadvalni o'zingiz belgilaysiz, to'lov platforma orqali keladi.")}</p>
            <Link to="/tutor" className="btn mt-8 bg-brand-300 px-7 py-3 text-base text-slate-900 hover:bg-white">{t("Repetitor bo'lish")}</Link>
          </Reveal>
        </div>
      </section>
    </>
  );
}
