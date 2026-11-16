import { useState } from 'react';
import { api } from '../api.js';
import { ErrorBox, Field, Spinner, useFetch } from './ui.jsx';
import { t } from '../lib/i18n.js';

const LETTERS = 'ABCDEF';
const blankQ = () => ({ text: '', options: ['', '', '', ''], correct: 0, explanation: '' });

/**
 * Matndan savollarni o'qiydi. Format (har savol orasida bo'sh qator):
 *   1. Savol matni
 *   A) variant
 *   *B) to'g'ri variant   (yulduzcha — to'g'ri javob)
 *   Izoh: ixtiyoriy tushuntirish
 */
export function parseQuestions(text) {
  const blocks = text.replace(/\r/g, '').split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean);
  const out = [];
  const errors = [];
  blocks.forEach((b, n) => {
    const q = { text: '', options: [], correct: -1, explanation: '' };
    for (const raw of b.split('\n')) {
      const line = raw.trim();
      const opt = line.match(/^(\*)?\s*([A-Fa-f])[).]\s*(.+)$/);
      const exp = line.match(/^(izoh|пояснение|explanation)\s*:\s*(.*)$/i);
      if (opt && q.text) {
        if (opt[1]) q.correct = q.options.length;
        q.options.push(opt[3].trim());
      } else if (exp) q.explanation = exp[2].trim();
      else if (!q.options.length) q.text = `${q.text ? `${q.text}\n` : ''}${line.replace(/^\d+[).]\s*/, '')}`;
    }
    if (!q.text || q.options.length < 2 || q.correct < 0) errors.push(n + 1);
    else out.push({ ...q, options: q.options.slice(0, 6) });
  });
  return { questions: out, errors };
}

export default function QuizEditor({ subjects, initial, onSaved, onCancel }) {
  const [f, setF] = useState(() => ({
    subject: initial?.subject?._id || initial?.subject || subjects[0]?._id || '',
    title: initial?.title || '',
    description: initial?.description || '',
    questions: initial?.questions?.map(({ text, options, correct, explanation }) => ({ text, options: [...options], correct, explanation: explanation || '' })) || [blankQ()],
  }));
  const [paste, setPaste] = useState('');
  const [showPaste, setShowPaste] = useState(false);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const setQ = (i, patch) => setF((p) => ({ ...p, questions: p.questions.map((q, j) => (j === i ? { ...q, ...patch } : q)) }));
  const setOpt = (i, k, v) => setQ(i, { options: f.questions[i].options.map((o, j) => (j === k ? v : o)) });
  const removeOpt = (i, k) => {
    const q = f.questions[i];
    const options = q.options.filter((_, j) => j !== k);
    setQ(i, { options, correct: q.correct === k ? 0 : q.correct > k ? q.correct - 1 : q.correct });
  };

  const importText = () => {
    const { questions, errors } = parseQuestions(paste);
    if (!questions.length) { setErr(t("Savollar topilmadi. Namunadagi formatga qarang.")); return; }
    const keep = f.questions.filter((q) => q.text.trim());
    setF({ ...f, questions: [...keep, ...questions] });
    setPaste(''); setShowPaste(false);
    setErr(errors.length ? t("{n} ta savol qo'shildi. O'qib bo'lmagan bloklar: {e} (to'g'ri javob * bilan belgilanganmi?)", { n: questions.length, e: errors.join(', ') }) : '');
  };

  const submit = async (e) => {
    e.preventDefault(); setErr('');
    const questions = f.questions
      .filter((q) => q.text.trim())
      .map((q) => {
        const filled = q.options.map((o, k) => [o.trim(), k]).filter(([o]) => o);
        return { text: q.text.trim(), options: filled.map(([o]) => o), correct: Math.max(0, filled.findIndex(([, k]) => k === q.correct)), explanation: q.explanation.trim(), _bad: !filled.some(([, k]) => k === q.correct) };
      });
    const bad = questions.findIndex((q) => q._bad || q.options.length < 2);
    if (!questions.length) return setErr(t("Kamida bitta savol kiriting"));
    if (bad >= 0) return setErr(t("{n}-savolda kamida 2 ta variant bo'lsin va to'g'ri javob bo'sh bo'lmasin", { n: bad + 1 }));
    setBusy(true);
    try {
      const body = { subject: f.subject, title: f.title, description: f.description, questions: questions.map(({ _bad, ...q }) => q) };
      const saved = await api(initial?._id ? `/quizzes/${initial._id}` : '/quizzes', { method: initial?._id ? 'PUT' : 'POST', body });
      onSaved?.(saved);
    } catch (er) { setErr(er.message); } finally { setBusy(false); }
  };

  return (
    <form onSubmit={submit} className="card space-y-5 p-5 sm:p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Fan">
          <select className="input" required value={f.subject} onChange={(e) => setF({ ...f, subject: e.target.value })}>
            {!subjects.length && <option value="">{t("Fan yo'q")}</option>}
            {subjects.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
          </select>
        </Field>
        <Field label="Test nomi"><input className="input" required minLength={3} maxLength={140} placeholder={t("Masalan: Hisoblash 1 — limitlar, oraliq nazoratga tayyorlov")} value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></Field>
      </div>
      <Field label="Qisqa tavsif (ixtiyoriy)"><input className="input" maxLength={500} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></Field>

      <div className="space-y-2">
        <button type="button" className="btn-ghost btn-sm" onClick={() => setShowPaste(!showPaste)}>{showPaste ? t('Yopish') : t("Matndan ko'p savol qo'shish")}</button>
        {showPaste && (
          <div className="space-y-2 bg-slate-50 p-4">
            <p className="text-sm text-slate-600">{t("Har bir savol orasida bo'sh qator qoldiring. To'g'ri javob oldiga * qo'ying. Izoh ixtiyoriy.")}</p>
            <textarea className="input font-mono" rows={8} value={paste} onChange={(e) => setPaste(e.target.value)}
              placeholder={"1. lim (x→0) sin(x)/x = ?\nA) 0\n*B) 1\nC) ∞\nIzoh: Birinchi ajoyib limit\n\n2. (x²)' = ?\n*A) 2x\nB) x\nC) 2"} />
            <button type="button" className="btn-primary btn-sm" onClick={importText} disabled={!paste.trim()}>{t("Savollarni qo'shish")}</button>
          </div>
        )}
      </div>

      <div className="space-y-4">
        {f.questions.map((q, i) => (
          <fieldset key={i} className="space-y-3 border-l-4 border-brand-600 bg-slate-50 p-4">
            <div className="flex items-center justify-between gap-2">
              <legend className="font-bold">{t('{n}-savol', { n: i + 1 })}</legend>
              {f.questions.length > 1 && <button type="button" className="text-sm text-red-600" onClick={() => setF({ ...f, questions: f.questions.filter((_, j) => j !== i) })}>{t("O'chirish")}</button>}
            </div>
            <textarea className="input" rows={2} maxLength={2000} placeholder={t('Savol matni')} value={q.text} onChange={(e) => setQ(i, { text: e.target.value })} />
            <div className="space-y-2">
              {q.options.map((o, k) => (
                <div key={k} className="flex items-center gap-2">
                  <label className="flex shrink-0 cursor-pointer items-center gap-1.5 text-sm font-semibold" title={t("To'g'ri javob")}>
                    <input type="radio" name={`correct-${i}`} checked={q.correct === k} onChange={() => setQ(i, { correct: k })} />{LETTERS[k]}
                  </label>
                  <input className="input" maxLength={500} placeholder={t('Variant {l}', { l: LETTERS[k] })} value={o} onChange={(e) => setOpt(i, k, e.target.value)} />
                  {q.options.length > 2 && <button type="button" className="text-slate-500" aria-label={t("O'chirish")} onClick={() => removeOpt(i, k)}>✕</button>}
                </div>
              ))}
              {q.options.length < 6 && <button type="button" className="text-sm font-semibold text-brand-700" onClick={() => setQ(i, { options: [...q.options, ''] })}>{t("+ Variant qo'shish")}</button>}
              <p className="text-xs text-slate-500">{t("Doirachani bosib to'g'ri javobni belgilang.")}</p>
            </div>
            <input className="input" maxLength={2000} placeholder={t("Izoh: nega bu javob to'g'ri (ixtiyoriy, talabaga natijada ko'rinadi)")} value={q.explanation} onChange={(e) => setQ(i, { explanation: e.target.value })} />
          </fieldset>
        ))}
        <button type="button" className="btn-ghost btn-sm" onClick={() => setF({ ...f, questions: [...f.questions, blankQ()] })}>{t("+ Savol qo'shish")}</button>
      </div>

      <ErrorBox error={err} />
      <div className="flex flex-wrap gap-2">
        <button className="btn-primary" disabled={busy || !f.subject}>{initial?._id ? t('Saqlash') : t('Testni yaratish')}</button>
        {onCancel && <button type="button" className="btn-ghost" onClick={onCancel}>{t('Bekor qilish')}</button>}
      </div>
    </form>
  );
}

/** Muallifning testlari ro'yxati + tahrirlash (repetitor paneli uchun) */
export function MyQuizzes({ subjects, note }) {
  const [n, setN] = useState(0);
  const [edit, setEdit] = useState(null); // null | 'new' | to'liq test
  const [err, setErr] = useState('');
  const { data: list, loading, error } = useFetch('/quizzes/mine', [n]);
  const reload = () => setN((x) => x + 1);
  const open = async (id) => { setErr(''); try { setEdit(await api(`/quizzes/${id}/full`)); } catch (e) { setErr(e.message); } };
  const remove = async (id) => {
    if (!window.confirm(t("Test butunlay o'chiriladi. Davom etasizmi?"))) return;
    try { await api(`/quizzes/${id}`, { method: 'DELETE' }); reload(); } catch (e) { setErr(e.message); }
  };
  const STATUS_TXT = { pending: ['bg-amber-100 text-amber-800', 'Tekshiruvda'], approved: ['bg-emerald-100 text-emerald-800', "Talabalarga ko'rinadi"], hidden: ['bg-slate-200 text-slate-700', 'Yashirilgan'] };

  if (edit) return <QuizEditor subjects={subjects} initial={edit === 'new' ? null : edit} onSaved={() => { setEdit(null); reload(); }} onCancel={() => setEdit(null)} />;
  return (
    <div className="space-y-4">
      {note}
      <ErrorBox error={error || err} />
      {loading && <Spinner />}
      <button className="btn-primary" onClick={() => setEdit('new')} disabled={!subjects.length}>{t('+ Yangi test')}</button>
      {list?.length === 0 && <div className="card p-6 text-sm text-slate-500">{t("Hali test tuzmagansiz.")}</div>}
      {list?.map((q) => (
        <div key={q._id} className="card flex flex-wrap items-center justify-between gap-3 p-4">
          <div>
            <div className="font-semibold">{q.title} <span className={`chip ml-1 ${STATUS_TXT[q.status][0]}`}>{t(STATUS_TXT[q.status][1])}</span></div>
            <div className="text-sm text-slate-500">{q.subject?.name} · {t('{n} ta savol', { n: q.questions.length })} · {t('{n} marta yechilgan', { n: q.attempts })}</div>
          </div>
          <div className="flex gap-2">
            <button className="btn-ghost btn-sm" onClick={() => open(q._id)}>{t('Tahrirlash')}</button>
            <button className="btn-ghost btn-sm text-red-600" onClick={() => remove(q._id)}>{t("O'chirish")}</button>
          </div>
        </div>
      ))}
    </div>
  );
}
