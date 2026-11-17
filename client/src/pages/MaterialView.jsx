import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ErrorBox, PageTitle, Spinner, useFetch } from '../components/ui.jsx';
import Notes, { headings, noteStats } from '../components/Notes.jsx';
import { Icon } from '../components/Motion.jsx';
import { t } from '../lib/i18n.js';
import { useSeo } from '../lib/seo.js';

/* O'zlashtirilgan mavzular shu brauzerda saqlanadi (hisob talab qilinmaydi) */
const KEY = 'konspekt-done';
const readDone = () => { try { return new Set(JSON.parse(localStorage.getItem(KEY) || '[]')); } catch { return new Set(); } };
const writeDone = (set) => { try { localStorage.setItem(KEY, JSON.stringify([...set])); } catch { /* xotira yopiq */ } };

/** Sahifa tepasidagi o'qish jarayoni chizig'i */
function ReadingBar() {
  const [p, setP] = useState(0);
  useEffect(() => {
    const on = () => { const h = document.documentElement; const max = h.scrollHeight - h.clientHeight; setP(max > 0 ? Math.min(1, h.scrollTop / max) : 0); };
    on(); window.addEventListener('scroll', on, { passive: true }); window.addEventListener('resize', on);
    return () => { window.removeEventListener('scroll', on); window.removeEventListener('resize', on); };
  }, []);
  return <div className="fixed inset-x-0 top-0 z-50 h-1 bg-transparent"><div className="h-full origin-left bg-brand-300 transition-[width] duration-150" style={{ width: `${p * 100}%` }} /></div>;
}

/** Hozir o'qilayotgan bo'limni kuzatish (mundarijada ajratib ko'rsatish uchun) */
function useActive(ids) {
  const [active, setActive] = useState(ids[0]);
  useEffect(() => {
    if (!ids.length || typeof IntersectionObserver === 'undefined') return undefined;
    const io = new IntersectionObserver((es) => { es.forEach((e) => { if (e.isIntersecting) setActive(e.target.id); }); }, { rootMargin: '-15% 0px -70% 0px' });
    ids.forEach((id) => { const el = document.getElementById(id); if (el) io.observe(el); });
    return () => io.disconnect();
  }, [ids.join('|')]);
  return active;
}

/** Saytning o'zida o'qiladigan konspekt (mavzu tushunchasi, misollar, test) */
export default function MaterialView() {
  const { id } = useParams();
  const { data: m, loading, error } = useFetch(`/materials/${id}`, [id]);
  const subj = m?.subject?.name;
  useSeo(m && `${m.title}${subj ? `: ${subj}` : ''} konspekti`, m && (m.description || `${subj ? `${subj} fanidan ` : ''}${m.title} mavzusi bo'yicha UWED talabalari uchun konspekt, misollar va formulalar.`));
  const [done, setDone] = useState(readDone);
  const toc = useMemo(() => headings(m?.body || ''), [m?.body]);
  const stats = useMemo(() => noteStats(m?.body || ''), [m?.body]);
  const active = useActive(toc.map((h) => h.id));

  useEffect(() => { window.scrollTo(0, 0); }, [id]);

  if (loading) return <Spinner />;
  if (error) return <ErrorBox error={error} />;
  if (m.url) { window.location.href = m.url; return <Spinner />; }

  const sib = m.siblings || [];
  const at = sib.findIndex((x) => x._id === m._id);
  const prev = at > 0 ? sib[at - 1] : null;
  const next = at >= 0 && at < sib.length - 1 ? sib[at + 1] : null;
  const subjectId = m.subject?._id;
  const isDone = done.has(m._id);
  const doneCount = sib.filter((x) => done.has(x._id)).length;
  const toggle = () => { const s = new Set(done); if (s.has(m._id)) s.delete(m._id); else s.add(m._id); writeDone(s); setDone(s); };
  const short = (title) => title.replace(/^\d+-mavzu\.\s*/, '');

  return (
    <>
      <ReadingBar />
      <PageTitle back={subjectId ? { to: `/subjects/${subjectId}`, label: m.subject.name } : { to: '/materials', label: t('Materiallar') }} title={short(m.title)}>
        <div className="flex w-full flex-wrap gap-2 text-sm font-semibold">
          {m.order > 0 && <span className="rounded-full bg-brand-300 px-3 py-1 text-slate-900">{m.order}-mavzu</span>}
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-white"><Icon name="clock" size={16} /> ≈ {stats.minutes} daqiqa</span>
          {stats.examples > 0 && <span className="rounded-full bg-white/10 px-3 py-1 text-white">{stats.examples} ta misol</span>}
          {stats.questions > 0 && <span className="rounded-full bg-white/10 px-3 py-1 text-white">{stats.questions} ta test savoli</span>}
          {isDone && <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-400/20 px-3 py-1 text-emerald-200"><Icon name="check" size={16} /> O'zlashtirilgan</span>}
        </div>
      </PageTitle>

      {/* Telefonda: mavzular qatori */}
      {sib.length > 1 && (
        <div className="no-scrollbar -mx-4 mb-6 flex gap-2 overflow-x-auto px-4 lg:hidden">
          {sib.map((x) => (
            <Link key={x._id} to={`/materials/${x._id}`}
              className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm font-semibold transition ${x._id === m._id ? 'bg-slate-900 text-white' : 'bg-white text-slate-700 ring-1 ring-slate-200'}`}>
              {done.has(x._id) && '✓ '}{x.order || ''}{x.order ? '. ' : ''}{short(x.title)}
            </Link>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_17rem]">
        <div className="min-w-0">
          <article className="rounded-3xl bg-white px-4 py-6 shadow-sm ring-1 ring-slate-200 sm:px-10 sm:py-10">
            <Notes text={m.body} />
          </article>

          {/* Yakun: o'zlashtirish, keyingi qadam */}
          <div className="mt-8 rounded-3xl bg-field p-6 text-white sm:p-8">
            <h2 className="text-2xl font-extrabold">{isDone ? 'Zo\'r! Mavzu o\'zlashtirilgan' : 'Mavzuni o\'zlashtirdingizmi?'}</h2>
            <p className="mt-2 text-slate-300">
              {isDone ? 'Keyingi mavzuga o\'ting yoki fandan mashq testini yechib, bilimingizni mustahkamlang.' : 'Misollarni o\'zingiz yechib, testdan o\'tgan bo\'lsangiz — belgilab qo\'ying. Jarayoningiz shu qurilmada saqlanadi.'}
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <button type="button" onClick={toggle} className={`btn px-5 py-2.5 ${isDone ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-brand-300 text-slate-900 hover:bg-white'}`}>
                {isDone ? 'Belgini olib tashlash' : '✓ O\'zlashtirdim'}
              </button>
              {next && <Link to={`/materials/${next._id}`} className="btn bg-white px-5 py-2.5 text-slate-900 hover:bg-brand-100">Keyingi: {short(next.title)} →</Link>}
            </div>
            <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 border-t border-white/10 pt-5 text-sm font-semibold">
              <Link to="/quizzes" className="text-brand-300 hover:text-white">Mashq testlari →</Link>
              {subjectId && <Link to={`/tutors?subject=${subjectId}`} className="text-brand-300 hover:text-white">Tushunmagan joyingiz bormi? Repetitor toping →</Link>}
            </div>
          </div>

          {(prev || next) && (
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {prev ? (
                <Link to={`/materials/${prev._id}`} className="card-link p-4">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">← Oldingi mavzu</div>
                  <div className="mt-1 font-bold text-slate-900">{short(prev.title)}</div>
                </Link>
              ) : <span />}
              {next && (
                <Link to={`/materials/${next._id}`} className="card-link p-4 text-right">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Keyingi mavzu →</div>
                  <div className="mt-1 font-bold text-slate-900">{short(next.title)}</div>
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Kompyuterda: mundarija va mavzular */}
        <aside className="hidden min-w-0 lg:block">
          <div className="sticky top-24 space-y-4">
            {toc.length > 1 && (
              <nav className="rounded-2xl bg-white p-4 ring-1 ring-slate-200" aria-label="Bu sahifada">
                <div className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Bu sahifada</div>
                <ul className="space-y-0.5">
                  {toc.map((h) => (
                    <li key={h.id}>
                      <a href={`#${h.id}`} className={`block rounded-lg border-l-2 px-3 py-1.5 text-sm transition ${active === h.id ? 'border-brand-500 bg-brand-50 font-semibold text-brand-700' : 'border-transparent text-slate-600 hover:text-slate-900'}`}>{h.text}</a>
                    </li>
                  ))}
                </ul>
              </nav>
            )}
            {sib.length > 1 && (
              <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
                <div className="mb-1 flex items-center justify-between text-xs font-bold uppercase tracking-wide text-slate-500">
                  <span>Mavzular</span><span className="text-brand-700">{doneCount}/{sib.length}</span>
                </div>
                <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-brand-500 transition-all" style={{ width: `${(doneCount / sib.length) * 100}%` }} /></div>
                <ol className="max-h-[50vh] space-y-0.5 overflow-y-auto pr-1">
                  {sib.map((x) => (
                    <li key={x._id}>
                      <Link to={`/materials/${x._id}`} className={`flex items-start gap-2 rounded-lg px-2 py-1.5 text-sm transition ${x._id === m._id ? 'bg-slate-900 font-semibold text-white' : 'text-slate-700 hover:bg-slate-50'}`}>
                        <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[0.7rem] font-bold ${done.has(x._id) ? 'bg-emerald-500 text-white' : x._id === m._id ? 'bg-white/15' : 'bg-slate-100 text-slate-500'}`}>{done.has(x._id) ? '✓' : x.order || '•'}</span>
                        <span>{short(x.title)}</span>
                      </Link>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        </aside>
      </div>
    </>
  );
}
