import { Fragment, useState } from 'react';
import { api } from '../../api.js';
import { Spinner, ErrorBox, Select } from '../../components/ui.jsx';
import { Chip, CsvButton, FField, Filters, Pager, Section, StatusChip, Table, dateTime, money, useAct, useFetch, useList } from './kit.jsx';

const ROLE = { student: ['slate', 'Talaba'], tutor: ['brand', 'Repetitor'], admin: ['amber', 'Admin'] };

function Detail({ id, onChanged, meId }) {
  const { data, loading, error } = useFetch(`/admin/users/${id}`);
  const { run, err, busy } = useAct();
  if (loading) return <Spinner />;
  if (error) return <ErrorBox error={error} />;
  const { user: u, bookings, tutor, reviews } = data;
  const patch = (body, ok) => run(async () => { await api(`/admin/users/${id}`, { method: 'PATCH', body }); onChanged(); }, ok);
  return (
    <div className="space-y-4 bg-slate-50 p-4">
      <div className="grid gap-x-8 gap-y-1 text-sm sm:grid-cols-2">
        <div><b>Telegram:</b> {u.telegram || '—'} {u.telegramId && <span className="text-slate-500">(id {u.telegramId})</span>}</div>
        <div><b>Telefon:</b> {u.phone || '—'}</div>
        <div><b>Email:</b> {u.email || '—'}</div>
        <div><b>Fakultet/kurs:</b> {u.faculty || '—'} {u.year ? `· ${u.year}-kurs` : ''}</div>
        <div><b>Ro'yxatdan o'tgan:</b> {dateTime(u.createdAt)}</div>
        <div><b>Sharhlar:</b> {reviews} ta{tutor ? ` · repetitor anketasi: ${tutor.status}, ${money(tutor.pricePerHour)}/soat` : ''}</div>
      </div>
      {bookings.length > 0 && (
        <div>
          <div className="mb-1 text-sm font-semibold">Oxirgi bronlari</div>
          <ul className="space-y-1 text-sm">{bookings.map((b) => <li key={b._id} className="flex flex-wrap items-center gap-2"><StatusChip s={b.status} /> {b.subject?.name} · {b.tutor?.user?.name} · {dateTime(b.startsAt)} · {money(b.total)}</li>)}</ul>
        </div>
      )}
      <ErrorBox error={err} />
      <div className="flex flex-wrap gap-2">
        {u.role !== 'admin' && <button className="btn-ghost btn-sm" disabled={busy} onClick={() => confirm(`${u.name} ga admin huquqi beriladi: u barcha ma'lumotni ko'radi va o'zgartiradi. Davom etasizmi?`) && patch({ role: 'admin' })}>Admin qilish</button>}
        {u.role === 'admin' && String(u._id) !== String(meId) && <button className="btn-ghost btn-sm" disabled={busy} onClick={() => confirm("Adminlik huquqi olinadi. Davom etasizmi?") && patch({ role: 'student' })}>Adminlikdan olish</button>}
        {String(u._id) !== String(meId) && (u.blocked
          ? <button className="btn-primary btn-sm" disabled={busy} onClick={() => patch({ blocked: false })}>Blokdan chiqarish</button>
          : <button className="btn-danger btn-sm" disabled={busy} onClick={() => confirm(`${u.name} bloklansinmi? U saytga kira olmaydi va bron qila olmaydi.`) && patch({ blocked: true })}>Bloklash</button>)}
      </div>
    </div>
  );
}

export default function Users({ me }) {
  const [f, setF] = useState({ q: '', role: '', blocked: '' });
  const [open, setOpen] = useState(null);
  const list = useList('/admin/users', f);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === 'checkbox' ? (e.target.checked ? '1' : '') : e.target.value });

  return (
    <Section title="Foydalanuvchilar"
      intro={<><p>Saytda ro'yxatdan o'tgan hamma odam shu yerda. Qidirish, rol bo'yicha saralash, batafsil ko'rish, <b>bloklash</b> (bloklangan odam kira olmaydi) va boshqa odamga admin huquqini berish mumkin.</p><p>Foydalanuvchini o'chirish yo'q: bloklash yetarli, chunki o'chirsak, uning bronlari va sharhlari hisobi buziladi.</p></>}
      actions={<CsvButton path={`/admin/export/users.csv${f.role ? `?role=${f.role}` : ''}`} name="foydalanuvchilar.csv" />}>
      <Filters>
        <FField label="Qidirish (ism, @username, telefon)"><input className="input" value={f.q} onChange={set('q')} placeholder="Masalan: Ali" /></FField>
        <FField label="Rol"><Select value={f.role} onChange={(v) => setF({ ...f, role: v })}><option value="">Hammasi</option><option value="student">Talaba</option><option value="tutor">Repetitor</option><option value="admin">Admin</option></Select></FField>
        <label className="flex items-center gap-2 pb-2 text-sm"><input type="checkbox" checked={!!f.blocked} onChange={set('blocked')} />Faqat bloklanganlar</label>
      </Filters>
      <ErrorBox error={list.error} />
      {list.loading ? <Spinner /> : (
        <>
          <Table head={['Ism', 'Rol', 'Aloqa', "Bronlar", "Ro'yxatdan o'tgan", '']} empty={!list.data.items.length && 'Hech kim topilmadi.'}>
            {list.data.items.map((u) => (
              <Fragment key={u._id}>
                <tr>
                  <td className="font-semibold">{u.name} {u.blocked && <Chip tone="red">Bloklangan</Chip>}</td>
                  <td><Chip tone={ROLE[u.role][0]}>{ROLE[u.role][1]}</Chip></td>
                  <td className="text-slate-700">{u.telegram || u.email || '—'}{u.phone ? ` · ${u.phone}` : ''}</td>
                  <td>{u.bookings}</td>
                  <td className="whitespace-nowrap">{dateTime(u.createdAt)}</td>
                  <td><button className="btn-ghost btn-sm" onClick={() => setOpen(open === u._id ? null : u._id)}>{open === u._id ? 'Yopish' : 'Batafsil'}</button></td>
                </tr>
                {open === u._id && <tr><td colSpan={6} className="!p-0"><Detail id={u._id} meId={me.id} onChanged={list.reload} /></td></tr>}
              </Fragment>
            ))}
          </Table>
          <Pager {...list.data} onPage={list.setPage} />
        </>
      )}
    </Section>
  );
}
