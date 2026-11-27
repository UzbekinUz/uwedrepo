import { useCallback, useEffect, useRef, useState } from 'react';
import { useSeo } from '../lib/seo.js';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api.js';
import { useApp } from '../context/App.jsx';
import { ErrorBox, PageTitle, Spinner, useFetch } from '../components/ui.jsx';
import { TutorCard } from '../components/Cards.jsx';
import { Hint } from '../components/Motion.jsx';
import { Inline } from '../components/MathText.jsx';
import { t, getLang } from '../lib/i18n.js';

const LETTERS = 'ABCDEF';

/** Xato javob uchun AI izohi */
function Explain({ quizId, question, chosen, onUsed }) {
  const { user } = useApp();
  const [state, setState] = useState({ text: '', err: '', busy: false, left: null });
  if (!user) return <p className="text-sm text-slate-600"><Link to="/login" className="font-semibold text-brand-700 underline">{t('Kiring')}</Link> {t("va AI'dan nega xato qilganingizni so'rang.")}</p>;
  const ask = async () => {
    setState({ ...state, busy: true, err: '' });
    try {
      const r = await api(`/quizzes/${quizId}/explain`, { method: 'POST', body: { questionId: question._id, chosen, lang: getLang() } });
      setState({ text: r.text, err: '', busy: false, left: r.left });
      onUsed?.();
    } catch (e) { setState({ ...state, busy: false, err: e.message, limit: e.status === 429 }); }
  };
  if (state.text) {
    return (
      <div className="space-y-1 rounded-md bg-sky-50 p-4">
        <div className="text-sm font-bold text-sky-900">{t('AI izohi')}</div>
        <p className="whitespace-pre-line text-sm leading-relaxed text-slate-800">{state.text}</p>
        <p className="text-xs text-slate-500">{t("AI ba'zan xato qilishi mumkin. Shubha bo'lsa, repetitordan so'rang.")}{state.left != null && ` ${t('Bugun yana {n} ta izoh olishingiz mumkin.', { n: state.left })}`}</p>
      </div>
    );
  }
  return (
    <div className="space-y-2">
      <button type="button" className="btn-ghost btn-sm" onClick={ask} disabled={state.busy}>{state.busy ? t('AI yozmoqda…') : t("Nega noto'g'ri? AI izohi")}</button>
      <ErrorBox error={state.err} />
      {state.limit && !(user.premiumUntil && new Date(user.premiumUntil) > new Date()) && <Link to="/premium" className="inline-block text-sm font-semibold text-amber-800 underline">★ {t("Premium bilan kuniga ko'proq AI izohi")}</Link>}
    </div>
  );
}

/** Natijadan keyin: shu fan repetitorlari */
function TutorCta({ subject }) {
  const { data } = useFetch(`/tutors?subject=${subject._id}`);
  return (
    <section className="space-y-4 bg-brand-50 p-5 sm:p-6">
      <div>
        <h2 className="text-2xl font-extrabold text-slate-900">{t('Bu mavzuni repetitor bilan o\'tish')}</h2>
        <p className="mt-1 text-slate-700">{t("Xato qilgan savollaringizni repetitor bilan bir darsda tushunib oling. Birinchi darsga chegirma bor.")}</p>
      </div>
      {data?.length ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">{data.slice(0, 3).map((x) => <TutorCard key={x._id} t={x} />)}</div>
      ) : data && <p className="text-sm text-slate-600">{t("Bu fandan hali repetitor yo'q.")}</p>}
      <Link to={`/tutors?subject=${subject._id}`} className="btn-primary">{t('{s} repetitorlarini ko\'rish', { s: subject.name })}</Link>
    </section>
  );
}

const mmss = (sec) => `${Math.floor(sec / 60)}:${String(Math.max(0, sec) % 60).padStart(2, '0')}`;
const store = {
  get: (k) => { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch { return null; } },
  set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* xotira yopiq */ } },
  del: (k) => { try { localStorage.removeItem(k); } catch { /* xotira yopiq */ } },
};

export default function Quiz() {
  useSeo("Mashq testi", '', { noindex: true });
  const { id } = useParams();
  const { user } = useApp();
  const { data: quiz, loading, error } = useFetch(`/quizzes/${id}`);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [session, setSession] = useState(null); // { sessionId, startedAt (ms), offset (server − mijoz soati) }
  const [now, setNow] = useState(Date.now());
  const sending = useRef(false);
  const autoSent = useRef(false); // vaqt tugaganda faqat bir marta avtomatik topshiriladi

  const timed = (quiz?.timeLimit || 0) > 0;
  const startKey = `quiz-start-${id}`;
  const ansKey = session ? `quiz-ans-${session.sessionId}` : null;

  const begin = useCallback(async () => {
    setErr('');
    try {
      const r = await api(`/quizzes/${id}/start`, { method: 'POST' });
      const s = { sessionId: r.sessionId, startedAt: new Date(r.startedAt).getTime(), offset: new Date(r.now).getTime() - Date.now() };
      setSession(s);
      store.set(startKey, r.sessionId);
      setAnswers(store.get(`quiz-ans-${r.sessionId}`) || {});
    } catch (e) { setErr(e.message); }
  }, [id, startKey]);

  // Vaqtsiz test: vaqt jimgina hisoblanadi. Vaqtli test: avval boshlangan bo'lsa (sahifa yangilandi) davom etadi.
  useEffect(() => {
    if (!quiz || !user || quiz.status !== 'approved' || session || result) return;
    if (!timed || store.get(startKey)) begin();
  }, [quiz, user, timed, session, result, begin, startKey]);

  useEffect(() => { if (ansKey && !result) store.set(ansKey, answers); }, [ansKey, answers, result]);

  const left = timed && session ? quiz.timeLimit * 60 - Math.floor((now + session.offset - session.startedAt) / 1000) : null;

  const submit = useCallback(async (auto = false) => {
    if (sending.current) return;
    const answered = Object.keys(answers).length;
    if (!auto && answered < quiz.questions.length && !window.confirm(t("{n} ta savolga javob bermadingiz. Baribir tekshirilsinmi?", { n: quiz.questions.length - answered }))) return;
    sending.current = true; setBusy(true); setErr('');
    try {
      setResult({ ...(await api(`/quizzes/${id}/attempt`, { method: 'POST', body: { answers: quiz.questions.map((_, i) => answers[i] ?? -1) } })), auto });
      store.del(startKey); if (ansKey) store.del(ansKey);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e) { setErr(e.message); } finally { sending.current = false; setBusy(false); }
  }, [answers, quiz, id, startKey, ansKey]);

  // Taymer: har soniyada yangilanadi, vaqt tugasa javoblar o'zi topshiriladi
  useEffect(() => {
    if (!timed || !session || result) return undefined;
    const h = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(h);
  }, [timed, session, result]);
  useEffect(() => { if (left != null && left <= 0 && !result && !sending.current && !autoSent.current) { autoSent.current = true; submit(true); } }, [left, result, submit]);

  if (loading) return <Spinner />;
  if (error) return <ErrorBox error={error} />;

  const answered = Object.keys(answers).length;
  const retry = () => { autoSent.current = false; setAnswers({}); setResult(null); setSession(null); store.del(startKey); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const pct = result ? Math.round((result.score / result.total) * 100) : 0;
  const waiting = timed && !session && !result; // vaqtli test hali boshlanmagan

  return (
    <div className={timed && session && !result ? 'pb-24' : ''}>
      <PageTitle back={{ to: `/subjects/${quiz.subject._id}`, label: quiz.subject.name }} title={quiz.title} sub={quiz.description || t('{n} ta savol', { n: quiz.questions.length })}>
        {quiz.byTutor && <span className="chip bg-emerald-100 text-emerald-800">{t('Repetitor tuzgan')}</span>}
        {timed && <span className="chip bg-amber-100 text-amber-800">⏱ {t('{n} daqiqa', { n: quiz.timeLimit })}</span>}
      </PageTitle>
      {quiz.status && quiz.status !== 'approved' && <div className="mb-6 rounded-md bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">{t("Ko'rib chiqish rejimi: bu test hali talabalarga ko'rinmaydi.")}</div>}

      {waiting && (
        <div className="card max-w-2xl space-y-4 p-6 sm:p-8">
          <h2 className="text-2xl font-extrabold text-slate-900">{t('Testni boshlashdan oldin')}</h2>
          <ul className="list-disc space-y-1.5 pl-5 text-slate-700">
            <li>{t('{n} ta savol, ishlash vaqti — {m} daqiqa.', { n: quiz.questions.length, m: quiz.timeLimit })}</li>
            <li>{t("«Boshlash» tugmasini bosganingizdan keyin taymer to'xtamaydi, sahifani yangilasangiz ham vaqt davom etadi.")}</li>
            <li>{t("Vaqt tugasa, belgilagan javoblaringiz avtomatik topshiriladi.")}</li>
            {quiz.hideReview && <li>{t("Natijada faqat to'g'ri va noto'g'ri javoblar soni ko'rsatiladi.")}</li>}
          </ul>
          <ErrorBox error={err} />
          <button className="btn-primary px-8" onClick={begin}>{t('Testni boshlash')}</button>
        </div>
      )}

      {result && (
        <div className={`mb-8 flex flex-wrap items-center justify-between gap-4 p-5 sm:p-6 ${pct >= 80 ? 'bg-emerald-50' : pct >= 50 ? 'bg-amber-50' : 'bg-red-50'}`}>
          <div className="space-y-2">
            <div className="text-4xl font-extrabold text-slate-900">{result.score} / {result.total} <span className="text-2xl text-slate-600">({pct}%)</span></div>
            <div className="flex flex-wrap gap-2 text-sm font-semibold">
              <span className="chip bg-emerald-100 text-emerald-800">✓ {t("To'g'ri: {n}", { n: result.score })}</span>
              <span className="chip bg-red-100 text-red-800">✕ {t("Noto'g'ri: {n}", { n: result.wrong ?? result.total - result.score })}</span>
              {result.unanswered > 0 && <span className="chip bg-slate-200 text-slate-700">{t('Javobsiz: {n}', { n: result.unanswered })}</span>}
              {result.durationSec != null && <span className="chip bg-white text-slate-700">⏱ {t('Sarflangan vaqt: {v}', { v: mmss(result.durationSec) })}</span>}
            </div>
            {result.auto && <p className="text-sm font-medium text-amber-800">{t("Vaqt tugadi: javoblaringiz avtomatik topshirildi.")}</p>}
            {!result.hidden && <p className="text-slate-700">{pct === 100 ? t("Ajoyib! Hammasi to'g'ri.") : t("Quyida xato qilgan savollaringiz va to'g'ri javoblar.")}</p>}
          </div>
          <button className="btn-ghost" onClick={retry}>{t('Qayta yechish')}</button>
        </div>
      )}

      {!waiting && !(result?.hidden) && (
        <ol className="space-y-5">
          {quiz.questions.map((q, i) => {
            const r = result?.results?.[i];
            return (
              <li key={q._id} className={`card space-y-3 p-5 sm:p-6 ${r ? (r.ok ? 'border-l-4 border-emerald-500' : 'border-l-4 border-red-500') : ''}`}>
                <div className="flex gap-3">
                  <span className="font-extrabold text-slate-400">{i + 1}.</span>
                  <p className="whitespace-pre-line text-lg font-semibold leading-relaxed text-slate-900"><Inline text={q.text} /></p>
                </div>
                <div className="grid gap-2">
                  {q.options.map((o, k) => {
                    const picked = (r ? r.chosen : answers[i]) === k;
                    const tone = r ? (k === r.correct ? 'bg-emerald-100 text-emerald-900' : picked ? 'bg-red-100 text-red-900' : 'bg-slate-50 text-slate-700') : picked ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-800 hover:bg-slate-100';
                    return (
                      <label key={k} className={`flex cursor-pointer items-start gap-3 rounded-md px-4 py-3 transition ${tone} ${r ? 'cursor-default' : ''}`}>
                        <input type="radio" className="sr-only" name={`q-${i}`} disabled={!!result} checked={picked} onChange={() => setAnswers({ ...answers, [i]: k })} />
                        <b>{LETTERS[k]})</b><span className="whitespace-pre-line leading-relaxed"><Inline text={o} /></span>
                        {r && k === r.correct && <span className="ml-auto text-sm font-semibold">✓ {t("To'g'ri javob")}</span>}
                        {r && picked && !r.ok && <span className="ml-auto text-sm font-semibold">{t('Sizning javobingiz')}</span>}
                      </label>
                    );
                  })}
                </div>
                {r && !r.ok && r.chosen < 0 && <p className="text-sm font-medium text-amber-700">{t('Javob berilmagan')}</p>}
                {r?.explanation && <p className="text-sm leading-relaxed text-slate-700"><b>{t('Izoh')}:</b> <Inline text={r.explanation} /></p>}
                {r && !r.ok && r.chosen >= 0 && quiz.ai && <Explain quizId={quiz._id} question={q} chosen={r.chosen} />}
              </li>
            );
          })}
        </ol>
      )}

      {!waiting && <ErrorBox error={err} />}
      {!waiting && !result && !timed && (
        <div className="mt-8 flex flex-wrap items-center gap-4">
          <button className="btn-primary px-8" onClick={() => submit(false)} disabled={busy || !answered}>{t('Javoblarni tekshirish')}</button>
          <span className="text-sm text-slate-600">{t('{a} / {n} ta savolga javob berildi', { a: answered, n: quiz.questions.length })}</span>
        </div>
      )}
      {timed && session && !result && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 shadow-lg backdrop-blur print:hidden">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-3">
            <span className={`text-2xl font-extrabold tabular-nums ${left <= 300 ? 'text-red-700' : 'text-slate-900'}`} aria-live="polite">⏱ {mmss(Math.max(0, left))}</span>
            <span className="text-sm text-slate-600">{t('{a} / {n} ta savolga javob berildi', { a: answered, n: quiz.questions.length })}</span>
            <button className="btn-primary ml-auto px-6" onClick={() => submit(false)} disabled={busy}>{busy ? t('Topshirilmoqda…') : t('Testni yakunlash')}</button>
          </div>
        </div>
      )}
      {result && !result.hidden && pct < 100 && <div className="mt-10"><TutorCta subject={quiz.subject} /></div>}
      {!result && !timed && quiz.ai && !quiz.hideReview && <div className="mt-8"><Hint title={t('AI izohlari haqida')}>{t("Test tugagach, xato javob yonidagi tugma orqali AI'dan qisqa tushuntirish olasiz. Nazorat kuni shu fan bo'yicha AI izohlari o'chadi.")}</Hint></div>}
    </div>
  );
}
