import { Link, useParams } from 'react-router-dom';
import { ErrorBox, PageTitle, Spinner, useFetch } from '../components/ui.jsx';
import Notes from '../components/Notes.jsx';
import { t } from '../lib/i18n.js';

/** Saytning o'zida o'qiladigan konspekt (mavzu tushunchasi va misollar) */
export default function MaterialView() {
  const { id } = useParams();
  const { data: m, loading, error } = useFetch(`/materials/${id}`, [id]);
  if (loading) return <Spinner />;
  if (error) return <ErrorBox error={error} />;
  if (m.url) { window.location.href = m.url; return <Spinner />; }

  const sib = m.siblings || [];
  const at = sib.findIndex((x) => x._id === m._id);
  const prev = at > 0 ? sib[at - 1] : null;
  const next = at >= 0 && at < sib.length - 1 ? sib[at + 1] : null;
  const subjectId = m.subject?._id;

  return (
    <>
      <PageTitle back={subjectId ? { to: `/subjects/${subjectId}`, label: m.subject.name } : { to: '/materials', label: t('Materiallar') }} title={m.title} sub={m.description} />
      <div className="grid gap-8 lg:grid-cols-[1fr_16rem]">
        <article className="card min-w-0 p-5 sm:p-8">
          <Notes text={m.body} />
        </article>
        {sib.length > 1 && (
          <aside className="order-first lg:order-none">
            <div className="card p-4 lg:sticky lg:top-24">
              <div className="mb-2 text-sm font-bold text-slate-900">{t('Mavzular')}</div>
              <ol className="no-scrollbar flex gap-2 overflow-x-auto lg:block lg:space-y-1">
                {sib.map((x) => (
                  <li key={x._id} className="shrink-0">
                    <Link to={`/materials/${x._id}`} className={`block rounded-lg px-3 py-1.5 text-sm transition ${x._id === m._id ? 'bg-slate-900 font-semibold text-white' : 'text-slate-700 hover:bg-white'}`}>{x.title}</Link>
                  </li>
                ))}
              </ol>
            </div>
          </aside>
        )}
      </div>
      {(prev || next) && (
        <div className="mt-8 flex flex-wrap justify-between gap-3">
          {prev ? <Link to={`/materials/${prev._id}`} className="btn-ghost">← {prev.title}</Link> : <span />}
          {next && <Link to={`/materials/${next._id}`} className="btn-primary">{next.title} →</Link>}
        </div>
      )}
    </>
  );
}
