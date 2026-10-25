import { useState } from 'react';
import { api } from '../../api.js';
import { useApp } from '../../context/App.jsx';
import { Spinner, ErrorBox, Select, Tabs } from '../../components/ui.jsx';
import { EXAM_LABEL, MATERIAL_LABEL, dateLong, tz } from '../../lib/format.js';
import { Chip, FField, Filters, Hint, Section, Table, useAct, useFetch } from './kit.jsx';

const ymd = (iso) => { const x = tz(iso); return `${x.y}-${String(x.m + 1).padStart(2, '0')}-${String(x.d).padStart(2, '0')}`; };
const toIso = (date) => new Date(`${date}T10:00:00+05:00`).toISOString();

/* ---------- Fanlar ---------- */
const emptySubject = (meta) => ({ name: '', faculty: meta.faculties[0].key, years: [1], category: 'core', description: '', telegramGroup: '' });

function YearPicker({ value, onChange }) {
  const toggle = (y) => onChange(value.includes(y) ? value.filter((x) => x !== y) : [...value, y].sort());
  return (
    <div>
      <span className="label">Qaysi kurslarda o'qitiladi</span>
      <div className="flex flex-wrap gap-2">
        {[1, 2, 3, 4].map((y) => (
          <label key={y} className={`choice ${value.includes(y) ? 'choice-on' : ''}`}>
            <input type="checkbox" className="sr-only" checked={value.includes(y)} onChange={() => toggle(y)} />{y}-kurs
          </label>
        ))}
      </div>
    </div>
  );
}

function Subjects() {
  const { meta } = useApp();
  const [n, setN] = useState(0);
  const { data, loading } = useFetch('/admin/subjects', [n]);
  const [mode, setMode] = useState('one'); // 'one' | 'many'
  const [f, setF] = useState(emptySubject(meta));
  const [editId, setEditId] = useState(null);
  const [many, setMany] = useState({ names: '', faculty: meta.faculties[0].key, years: [1], category: 'core' });
  const [filter, setFilter] = useState({ q: '', faculty: '' });
  const { run, err, msg, setMsg } = useAct();
  const fname = (k) => (k === 'all' ? 'Hamma fakultet' : meta.faculties.find((x) => x.key === k)?.name || k);
  const reload = () => setN((x) => x + 1);

  const save = (e) => {
    e.preventDefault();
    run(async () => {
      const body = { ...f, telegramGroup: f.telegramGroup || '', description: f.description || '' };
      await api(editId ? `/admin/subjects/${editId}` : '/admin/subjects', { method: editId ? 'PUT' : 'POST', body });
      setF(emptySubject(meta)); setEditId(null); reload();
    }, editId ? 'Saqlandi' : "Fan qo'shildi");
  };

  const lines = many.names.split('\n').map((x) => x.trim()).filter((x) => x.length >= 2);
  const saveMany = (e) => {
    e.preventDefault();
    run(async () => {
      const r = await api('/admin/subjects/bulk', { method: 'POST', body: { ...many, names: lines } });
      setMany({ ...many, names: '' }); reload();
      setMsg(`${r.added} ta fan qo'shildi${r.skipped.length ? `; ${r.skipped.length} tasi allaqachon bor edi: ${r.skipped.join(', ')}` : ''}`);
    });
  };

  const rows = (data || []).filter((s) => (!filter.faculty || s.faculty === filter.faculty) && (!filter.q || s.name.toLowerCase().includes(filter.q.toLowerCase())));
  const hiddenCount = (data || []).filter((s) => !s.active).length;

  return (
    <div className="space-y-6">
      <Hint title="Fanlarni siz boshqarasiz">
        <p>Talaba saytda faqat shu yerda kiritilgan fanlarni ko'radi. Fanni <b>qo'shish</b>, <b>tahrirlash</b>, <b>yashirish</b> yoki <b>o'chirish</b> mumkin. <b>Fakultet</b> «Hamma fakultet» bo'lsa, fan hamma talabaga chiqadi (masalan IELTS). <b>Telegram guruh havolasi</b> fan sahifasidagi «Guruhga qo'shilish» tugmasiga aylanadi.</p>
        <p><b>Yashirish</b> fanni talabalardan olib qo'yadi, lekin uning repetitorlari, sanalari va materiallari saqlanadi: semestr tugaganda qulay. <b>O'chirish</b> esa fanni va unga bog'liq nazorat sanalari bilan materiallarni butunlay yo'q qiladi.</p>
      </Hint>

      {!loading && data.length === 0 && (
        <div className="space-y-3 bg-white p-6">
          <h3 className="text-xl font-extrabold">Hali bitta ham fan yo'q</h3>
          <p className="text-slate-700">Quyidagi shakldan o'zingiz kiriting yoki hisobotdagi 8 ta namunaviy fanni (Hisoblash 1-2, Ekonomika, Rus tili 1-2, Iqtisodiyotda miqdoriy usullar, IELTS, Dasturlash) bir bosishda qo'shing. Keyin istalganini o'zgartirishingiz yoki o'chirishingiz mumkin.</p>
          <button className="btn-primary" onClick={() => run(async () => {
            const r = await api('/admin/subjects/starter', { method: 'POST' });
            reload(); setMsg(`${r.added} ta fan qo'shildi`);
          })}>Namuna fanlarni qo'shish (8 ta)</button>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <button className={`choice ${mode === 'one' ? 'choice-on' : ''}`} onClick={() => setMode('one')}>{editId ? 'Fanni tahrirlash' : 'Bitta fan qo\'shish'}</button>
        <button className={`choice ${mode === 'many' ? 'choice-on' : ''}`} disabled={!!editId} onClick={() => setMode('many')}>Bir nechta fan qo'shish</button>
      </div>

      {mode === 'one' || editId ? (
        <form onSubmit={save} className="space-y-4 bg-white p-5">
          <h3 className="text-lg font-extrabold">{editId ? 'Fanni tahrirlash' : "Yangi fan qo'shish"}</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <FField label="Nomi"><input className="input" required minLength={2} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></FField>
            <FField label="Fakultet"><Select value={f.faculty} onChange={(v) => setF({ ...f, faculty: v })}>{meta.faculties.map((x) => <option key={x.key} value={x.key}>{x.name}</option>)}<option value="all">Hamma fakultet (qo'shimcha fanlar)</option></Select></FField>
            <FField label="Turi"><Select value={f.category} onChange={(v) => setF({ ...f, category: v })}><option value="core">Asosiy</option><option value="extra">Qo'shimcha</option></Select></FField>
            <FField label="Telegram guruh havolasi"><input className="input" type="url" placeholder="https://t.me/..." value={f.telegramGroup} onChange={(e) => setF({ ...f, telegramGroup: e.target.value })} /></FField>
          </div>
          <FField label="Qisqa tavsif (ixtiyoriy)"><input className="input" maxLength={500} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></FField>
          <YearPicker value={f.years} onChange={(years) => setF({ ...f, years })} />
          <ErrorBox error={err} />{msg && <p className="text-sm font-medium text-emerald-700">{msg}</p>}
          <div className="flex gap-2"><button className="btn-primary" disabled={!f.years.length}>{editId ? 'Saqlash' : "Qo'shish"}</button>{editId && <button type="button" className="btn-ghost" onClick={() => { setEditId(null); setF(emptySubject(meta)); }}>Bekor</button>}</div>
        </form>
      ) : (
        <form onSubmit={saveMany} className="space-y-4 bg-white p-5">
          <h3 className="text-lg font-extrabold">Bir nechta fanni birdan qo'shish</h3>
          <p className="text-sm text-slate-600">Fakultet, kurs va turi hammasi uchun bir xil bo'ladi. Telegram guruh havolasi va tavsifni keyin har bir fan uchun alohida kiritasiz. Allaqachon bor nomlar o'tkazib yuboriladi.</p>
          <FField label="Fanlar ro'yxati: har bir qatorga bitta nom">
            <textarea className="input" rows={7} value={many.names} onChange={(e) => setMany({ ...many, names: e.target.value })} placeholder={'Mikroiqtisodiyot\nMakroiqtisodiyot\nStatistika\nXalqaro huquq asoslari'} />
          </FField>
          <div className="grid gap-3 sm:grid-cols-2">
            <FField label="Fakultet"><Select value={many.faculty} onChange={(v) => setMany({ ...many, faculty: v })}>{meta.faculties.map((x) => <option key={x.key} value={x.key}>{x.name}</option>)}<option value="all">Hamma fakultet (qo'shimcha fanlar)</option></Select></FField>
            <FField label="Turi"><Select value={many.category} onChange={(v) => setMany({ ...many, category: v })}><option value="core">Asosiy</option><option value="extra">Qo'shimcha</option></Select></FField>
          </div>
          <YearPicker value={many.years} onChange={(years) => setMany({ ...many, years })} />
          <ErrorBox error={err} />{msg && <p className="text-sm font-medium text-emerald-700">{msg}</p>}
          <button className="btn-primary" disabled={!lines.length || !many.years.length}>{lines.length ? `${lines.length} ta fanni qo'shish` : "Qo'shish"}</button>
        </form>
      )}

      <div className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h3 className="text-xl font-extrabold">Barcha fanlar {data && <span className="text-base font-normal text-slate-600">({data.length}{hiddenCount ? `, shundan ${hiddenCount} tasi yashirin` : ''})</span>}</h3>
          <Filters>
            <FField label="Qidirish"><input className="input" value={filter.q} onChange={(e) => setFilter({ ...filter, q: e.target.value })} placeholder="Fan nomi" /></FField>
            <FField label="Fakultet"><Select value={filter.faculty} onChange={(v) => setFilter({ ...filter, faculty: v })}><option value="">Hammasi</option>{meta.faculties.map((x) => <option key={x.key} value={x.key}>{x.name}</option>)}<option value="all">Hamma fakultet</option></Select></FField>
          </Filters>
        </div>
        {loading ? <Spinner /> : (
          <Table head={['Fan', 'Fakultet', 'Kurs', 'Guruh', 'Repetitor', 'Sana', 'Material', '']} empty={!rows.length && (data.length ? 'Filtrga mos fan yo\'q.' : "Hali fan yo'q.")}>
            {rows.map((s) => (
              <tr key={s._id} className={s.active ? '' : 'opacity-60'}>
                <td className="font-semibold">{s.name} {s.category === 'extra' && <Chip tone="brand">Qo'shimcha</Chip>} {!s.active && <Chip tone="amber">Yashirin</Chip>}</td>
                <td>{fname(s.faculty)}</td><td>{s.years.join(', ')}</td>
                <td>{s.telegramGroup ? <a className="text-brand-700 underline" href={s.telegramGroup} target="_blank" rel="noopener noreferrer">bor</a> : <span className="text-amber-700">yo'q</span>}</td>
                <td>{s.tutors === 0 ? <span className="text-amber-700">0</span> : s.tutors}</td>
                <td>{s.exams}</td><td>{s.materials}</td>
                <td><div className="flex flex-wrap gap-1.5">
                  <button className="btn-ghost btn-sm" onClick={() => { setMode('one'); setEditId(s._id); setMsg(''); setF({ name: s.name, faculty: s.faculty, years: s.years, category: s.category, description: s.description || '', telegramGroup: s.telegramGroup || '' }); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>Tahrirlash</button>
                  <button className="btn-ghost btn-sm" onClick={() => run(async () => { await api(`/admin/subjects/${s._id}/active`, { method: 'PATCH', body: { active: !s.active } }); reload(); })}>{s.active ? 'Yashirish' : "Ko'rsatish"}</button>
                  <button className="btn-ghost btn-sm text-red-700" onClick={() => confirm(`"${s.name}" butunlay o'chiriladi, shu bilan birga ${s.exams} ta nazorat sanasi va ${s.materials} ta material ham. Qaytarib bo'lmaydi. Ehtimol «Yashirish» yetarlidir. Baribir o'chiraymi?`) && run(async () => { await api(`/admin/subjects/${s._id}`, { method: 'DELETE' }); reload(); })}>O'chirish</button>
                </div></td>
              </tr>
            ))}
          </Table>
        )}
      </div>
    </div>
  );
}

/* ---------- Nazorat sanalari ---------- */
function Exams() {
  const [n, setN] = useState(0);
  const subjects = useFetch('/subjects');
  const { data, loading } = useFetch('/admin/exams', [n]);
  const [f, setF] = useState({ subject: '', type: 'oraliq', date: '', note: '' });
  const [edit, setEdit] = useState(null);
  const { run, err, msg } = useAct();
  const { meta } = useApp();
  const add = (e) => { e.preventDefault(); run(async () => { await api('/admin/exams', { method: 'POST', body: { ...f, date: toIso(f.date), note: f.note || '' } }); setF({ ...f, date: '', note: '' }); setN((x) => x + 1); }, "Sana qo'shildi"); };
  const saveEdit = () => run(async () => { await api(`/admin/exams/${edit._id}`, { method: 'PUT', body: { subject: edit.subject, type: edit.type, date: toIso(edit.date), note: edit.note || '' } }); setEdit(null); setN((x) => x + 1); }, 'Saqlandi');
  const demo = (data || []).filter((e) => /demo/i.test(e.note || '')).length;
  const now = Date.now();

  return (
    <div className="space-y-6">
      <Hint title="Nazorat sanalari">
        <p>Talabalar kalendarda va bosh sahifada «necha kun qoldi» hisoblagichini shu sanalardan ko'radi. Sana o'tib ketgach, ular talabaga ko'rinmay qoladi (bu yerda esa saqlanadi).</p>
        <p>Demo sanalarda <b>«Demo sana»</b> izohi bor. Rasmiy sana kiritilgach izohni o'chiring: qatordagi «Rasmiy» tugmasi buni bir bosishda qiladi.</p>
      </Hint>
      {demo > 0 && <Hint kind="warn" title={`${demo} ta sana hali «demo»`}><p>Sayt ularni talabaga «Demo sana» belgisi bilan ko'rsatmoqda. Pilotdan oldin rasmiy jadvalga almashtiring.</p></Hint>}
      <form onSubmit={add} className="space-y-3 bg-white p-5">
        <h3 className="text-lg font-extrabold">Yangi sana</h3>
        <Filters>
          <FField label="Fan"><Select value={f.subject} onChange={(v) => setF({ ...f, subject: v })} required><option value="">Tanlang</option>{subjects.data?.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}</Select></FField>
          <FField label="Turi"><Select value={f.type} onChange={(v) => setF({ ...f, type: v })}>{meta.examTypes.map((x) => <option key={x} value={x}>{EXAM_LABEL[x]}</option>)}</Select></FField>
          <FField label="Sana"><input className="input" type="date" required value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} /></FField>
          <FField label="Izoh (ixtiyoriy)"><input className="input" value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} placeholder="Masalan: 305-xona" /></FField>
          <button className="btn-primary" disabled={!f.subject}>Qo'shish</button>
        </Filters>
        <ErrorBox error={err} />{msg && <p className="text-sm font-medium text-emerald-700">{msg}</p>}
      </form>
      {loading ? <Spinner /> : (
        <Table head={['Fan', 'Turi', 'Sana', 'Izoh', '']} empty={!data.length && "Hali sana yo'q."}>
          {data.map((e) => edit?._id === e._id ? (
            <tr key={e._id}>
              <td>{e.subject?.name}</td>
              <td><Select value={edit.type} onChange={(v) => setEdit({ ...edit, type: v })}>{meta.examTypes.map((x) => <option key={x} value={x}>{EXAM_LABEL[x]}</option>)}</Select></td>
              <td><input className="input" type="date" value={edit.date} onChange={(ev) => setEdit({ ...edit, date: ev.target.value })} /></td>
              <td><input className="input" value={edit.note} onChange={(ev) => setEdit({ ...edit, note: ev.target.value })} /></td>
              <td><div className="flex gap-1.5"><button className="btn-primary btn-sm" onClick={saveEdit}>Saqlash</button><button className="btn-ghost btn-sm" onClick={() => setEdit(null)}>Bekor</button></div></td>
            </tr>
          ) : (
            <tr key={e._id} className={new Date(e.date) < now ? 'opacity-60' : ''}>
              <td className="font-semibold">{e.subject?.name}</td><td>{EXAM_LABEL[e.type]}</td>
              <td className="whitespace-nowrap">{dateLong(e.date)} {new Date(e.date) < now && <Chip>O'tgan</Chip>}</td>
              <td>{/demo/i.test(e.note || '') ? <Chip tone="amber">{e.note}</Chip> : e.note}</td>
              <td><div className="flex flex-wrap gap-1.5">
                {/demo/i.test(e.note || '') && <button className="btn-primary btn-sm" onClick={() => run(async () => { await api(`/admin/exams/${e._id}`, { method: 'PUT', body: { subject: e.subject._id, type: e.type, date: e.date, note: '' } }); setN((x) => x + 1); })}>Rasmiy</button>}
                <button className="btn-ghost btn-sm" onClick={() => setEdit({ _id: e._id, subject: e.subject._id, type: e.type, date: ymd(e.date), note: e.note || '' })}>Tahrirlash</button>
                <button className="btn-ghost btn-sm text-red-700" onClick={() => confirm("Sana o'chirilsinmi?") && run(async () => { await api(`/admin/exams/${e._id}`, { method: 'DELETE' }); setN((x) => x + 1); })}>O'chirish</button>
              </div></td>
            </tr>
          ))}
        </Table>
      )}
    </div>
  );
}

/* ---------- Materiallar ---------- */
function Materials() {
  const [status, setStatus] = useState('pending');
  const [n, setN] = useState(0);
  const { data, loading, error } = useFetch(`/admin/materials?status=${status}`, [n]);
  const { run, err } = useAct();
  const call = (fn) => run(async () => { await fn(); setN((x) => x + 1); });
  return (
    <div className="space-y-6">
      <Hint title="Materiallarni tekshirish">
        <p>Talabalar yuborgan havolalar avval shu yerga «Kutilmoqda» holatida tushadi. <b>Havolani ochib ko'ring</b>: u haqiqatan ham o'sha fanga tegishlimi, zararli yoki reklama emasmi. Faqat shundan keyin tasdiqlang.</p>
      </Hint>
      <div className="flex gap-2"><button className={`choice ${status === 'pending' ? 'choice-on' : ''}`} onClick={() => setStatus('pending')}>Kutilmoqda</button><button className={`choice ${status === 'approved' ? 'choice-on' : ''}`} onClick={() => setStatus('approved')}>Tasdiqlangan</button></div>
      <ErrorBox error={err || error} />
      {loading ? <Spinner /> : !data.length ? <div className="bg-white p-10 text-center text-slate-600">{status === 'pending' ? "Tekshiruvni kutayotgan material yo'q." : "Tasdiqlangan material yo'q."}</div> : (
        <div className="space-y-2">{data.map((m) => (
          <div key={m._id} className="flex flex-wrap items-center justify-between gap-3 bg-white p-4">
            <div className="min-w-0">
              <div className="font-semibold">{m.title} <Chip tone="brand">{MATERIAL_LABEL[m.type]}</Chip></div>
              <div className="text-sm text-slate-600">{m.subject?.name} · yuborgan: {m.author?.name || '—'} {m.author?.telegram || ''}</div>
              <a href={m.url} target="_blank" rel="noopener noreferrer nofollow" className="break-all text-sm text-brand-700 underline">{m.url}</a>
            </div>
            <div className="flex gap-2">
              {status === 'pending' ? <button className="btn-primary btn-sm" onClick={() => call(() => api(`/admin/materials/${m._id}`, { method: 'PATCH', body: { status: 'approved' } }))}>Tasdiqlash</button>
                : <button className="btn-ghost btn-sm" onClick={() => call(() => api(`/admin/materials/${m._id}`, { method: 'PATCH', body: { status: 'pending' } }))}>Yashirish</button>}
              <button className="btn-ghost btn-sm text-red-700" onClick={() => confirm("Material o'chiriladi. Davom etasizmi?") && call(() => api(`/admin/materials/${m._id}`, { method: 'DELETE' }))}>O'chirish</button>
            </div>
          </div>
        ))}</div>
      )}
    </div>
  );
}

export default function Content() {
  const [tab, setTab] = useState('subjects');
  return (
    <Section title="Kontent: fanlar, sanalar, materiallar" intro={<p>Sayt to'lmasa, talabaga ko'rsatadigan hech narsa bo'lmaydi. Eng muhim ish — <b>fanlarni</b>, <b>rasmiy nazorat sanalarini</b> va <b>Telegram guruh havolalarini</b> kiritish. Uchala bo'lim ham shu yerda.</p>}>
      <Tabs tabs={[['subjects', 'Fanlar'], ['exams', 'Nazorat sanalari'], ['materials', 'Materiallar']]} value={tab} onChange={setTab} />
      {tab === 'subjects' && <Subjects />}{tab === 'exams' && <Exams />}{tab === 'materials' && <Materials />}
    </Section>
  );
}
