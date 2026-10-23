import { useState } from 'react';
import { api } from '../../api.js';
import { Spinner, ErrorBox, Select, Stars } from '../../components/ui.jsx';
import { Chip, FField, Filters, Pager, Section, dateTime, useAct, useList } from './kit.jsx';

export default function Reviews() {
  const [f, setF] = useState({ hidden: '', rating: '' });
  const list = useList('/admin/reviews', f);
  const { run, err, busy } = useAct();
  const act = (fn) => run(async () => { await fn(); list.reload(); });

  return (
    <Section title="Sharhlar"
      intro={<><p>Talabalar dars o'tgandan keyin qoldirgan baho va sharhlar. Haqoratli, spam yoki shaxsiy ma'lumot bor sharhni <b>yashirishingiz</b> mumkin: u saytdan va reytingdan chiqadi, lekin bazada qoladi (keyin qaytarsa bo'ladi).</p><p>Faqat qoidabuzarlikni yashiring. Shunchaki yoqmagan sharhni yashirish ishonchni buzadi, chunki reyting halol bo'lishi kerak.</p></>}>
      <Filters>
        <FField label="Ko'rsatish"><Select value={f.hidden} onChange={(v) => setF({ ...f, hidden: v })}><option value="">Hammasi</option><option value="1">Faqat yashirilganlar</option></Select></FField>
        <FField label="Baho"><Select value={f.rating} onChange={(v) => setF({ ...f, rating: v })}><option value="">Hammasi</option>{[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n} yulduz</option>)}</Select></FField>
      </Filters>
      <ErrorBox error={err || list.error} />
      {list.loading ? <Spinner /> : !list.data.items.length ? <div className="bg-white p-10 text-center text-slate-600">Sharh yo'q.</div> : (
        <>
          <div className="space-y-2">
            {list.data.items.map((r) => (
              <div key={r._id} className={`flex flex-wrap items-start justify-between gap-3 p-4 ${r.hidden ? 'bg-slate-100' : 'bg-white'}`}>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2"><Stars value={r.rating} size="text-base" /><b>{r.student?.name}</b> → {r.tutor?.user?.name} {r.hidden && <Chip tone="amber">Yashirilgan</Chip>}<span className="text-xs text-slate-500">{dateTime(r.createdAt)}</span></div>
                  <p className="mt-1 break-words text-slate-800">{r.comment || <span className="text-slate-500">Matnsiz baho</span>}</p>
                </div>
                <div className="flex gap-2">
                  <button className="btn-ghost btn-sm" disabled={busy} onClick={() => act(() => api(`/admin/reviews/${r._id}`, { method: 'PATCH', body: { hidden: !r.hidden } }))}>{r.hidden ? 'Qaytarish' : 'Yashirish'}</button>
                  <button className="btn-ghost btn-sm text-red-700" disabled={busy} onClick={() => confirm("Sharh butunlay o'chiriladi. Davom etasizmi? (Yashirish xavfsizroq.)") && act(() => api(`/admin/reviews/${r._id}`, { method: 'DELETE' }))}>O'chirish</button>
                </div>
              </div>
            ))}
          </div>
          <Pager {...list.data} onPage={list.setPage} />
        </>
      )}
    </Section>
  );
}
