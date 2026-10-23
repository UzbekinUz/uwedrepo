import { useState } from 'react';
import { api } from '../../api.js';
import { Spinner, ErrorBox } from '../../components/ui.jsx';
import { DAYS_SHORT } from '../../lib/format.js';
import { Chip, FField, Filters, Section, StatusChip, money, useAct, useFetch } from './kit.jsx';

function Card({ t, reload }) {
  const { run, err, busy } = useAct();
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState('');
  const patch = (body) => run(async () => { await api(`/admin/tutors/${t._id}`, { method: 'PATCH', body }); setRejecting(false); reload(); });
  return (
    <div className="space-y-3 bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="text-lg font-extrabold">{t.user?.name} <StatusChip s={t.status} /> {t.featured && <Chip tone="brand">Tavsiya</Chip>} {t.user?.blocked && <Chip tone="red">Bloklangan</Chip>}</div>
          <div className="text-sm text-slate-600">{t.user?.telegram || t.telegram || 'Telegram yo\'q'}{t.user?.phone ? ` · ${t.user.phone}` : ''}{t.user?.email ? ` · ${t.user.email}` : ''}</div>
        </div>
        <div className="text-right text-sm"><div className="text-xl font-extrabold text-brand-700">{money(t.pricePerHour)}</div>soatiga</div>
      </div>
      <p className="font-medium">{t.headline}</p>
      {t.bio && <p className="text-sm text-slate-700">{t.bio}</p>}
      <div className="flex flex-wrap gap-1.5">{t.subjects.map((s) => <Chip key={s._id}>{s.name}</Chip>)}</div>
      <div className="grid gap-1 text-sm text-slate-700 sm:grid-cols-2">
        <div><b>Format:</b> {t.formats.join(', ')} · <b>Til:</b> {t.languages.join(', ')}</div>
        <div><b>Tajriba:</b> {t.experience || '—'}</div>
        <div><b>Vaqtlari:</b> {t.availability.map((a) => `${DAYS_SHORT[a.day]} ${a.from}–${a.to}`).join(', ') || <span className="text-red-700">kiritilmagan: talaba bron qila olmaydi</span>}</div>
        <div><b>Natija:</b> {t.lessonsCount} dars · reyting {t.ratingAvg || '—'} ({t.ratingCount}) · daromadi {money(t.revenue)}</div>
      </div>
      {t.status === 'rejected' && t.rejectReason && <p className="text-sm text-red-700"><b>Rad etish sababi:</b> {t.rejectReason}</p>}
      <ErrorBox error={err} />
      {rejecting ? (
        <div className="space-y-2">
          <FField label="Rad etish sababi (repetitorga Telegram orqali yuboriladi)"><textarea className="input" rows={2} maxLength={300} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Masalan: Tajriba haqida ma'lumot yetarli emas, anketani to'ldirib qayta yuboring." /></FField>
          <div className="flex gap-2"><button className="btn-danger btn-sm" disabled={busy || reason.trim().length < 5} onClick={() => patch({ status: 'rejected', rejectReason: reason.trim() })}>Rad etish</button><button className="btn-ghost btn-sm" onClick={() => setRejecting(false)}>Bekor</button></div>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {t.status !== 'approved' && <button className="btn-primary btn-sm" disabled={busy} onClick={() => patch({ status: 'approved' })}>Tasdiqlash</button>}
          {t.status !== 'rejected' && <button className="btn-ghost btn-sm text-red-700" onClick={() => setRejecting(true)}>Rad etish…</button>}
          {t.status === 'approved' && <button className="btn-ghost btn-sm" disabled={busy} onClick={() => patch({ featured: !t.featured })}>{t.featured ? 'Tavsiyadan olish' : 'Tavsiya etish'}</button>}
          {t.status === 'approved' && <button className="btn-ghost btn-sm text-red-700" disabled={busy} onClick={() => confirm('Repetitor katalogdan yashiriladi (anketasi «kutilmoqda» holatiga qaytadi). Davom etasizmi?') && patch({ status: 'pending' })}>Katalogdan yashirish</button>}
        </div>
      )}
    </div>
  );
}

export default function Tutors() {
  const [status, setStatus] = useState('pending');
  const [q, setQ] = useState('');
  const [n, setN] = useState(0);
  const list = useFetch(`/admin/tutors?status=${status}&q=${encodeURIComponent(q)}&_=${n}`, []);
  const counts = list.data?.counts || {};
  const tabs = [['pending', 'Kutilmoqda'], ['approved', 'Tasdiqlangan'], ['rejected', 'Rad etilgan'], ['', 'Hammasi']];

  return (
    <Section title="Repetitorlar"
      intro={<><p>Repetitor anketasini yuborsa, u <b>«Kutilmoqda»</b> holatida tushadi va katalogda ko'rinmaydi. Siz anketani o'qib chiqib <b>tasdiqlaysiz</b> yoki <b>sababini yozib rad etasiz</b>, sabab repetitorga Telegram orqali boradi.</p><p>Tasdiqlashdan oldin tekshiring: vaqtlari kiritilganmi (aks holda bron qilib bo'lmaydi), narx o'rinlimi, Telegram username bormi.</p></>}>
      <Filters>
        <div className="flex flex-wrap gap-2">{tabs.map(([k, l]) => <button key={k} className={`choice ${status === k ? 'choice-on' : ''}`} onClick={() => setStatus(k)}>{l}{k ? ` (${counts[k] || 0})` : ''}</button>)}</div>
        <FField label="Qidirish"><input className="input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ism yoki sarlavha" /></FField>
      </Filters>
      <ErrorBox error={list.error} />
      {list.loading ? <Spinner /> : !list.data.items.length ? <div className="bg-white p-10 text-center text-slate-600">Bu holatda anketa yo'q.</div> : (
        <div className="grid gap-3 lg:grid-cols-2">{list.data.items.map((t) => <Card key={t._id} t={t} reload={() => setN(n + 1)} />)}</div>
      )}
    </Section>
  );
}
