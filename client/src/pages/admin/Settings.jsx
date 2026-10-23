import { useEffect, useState } from 'react';
import { api } from '../../api.js';
import { Spinner, ErrorBox, Select } from '../../components/ui.jsx';
import { Chip, FField, Hint, Section, useAct, useFetch } from './kit.jsx';

function Row({ label, ok, text }) {
  return <li className="flex flex-wrap items-center justify-between gap-2 py-2"><span className="font-medium">{label}</span><span className="flex items-center gap-2 text-sm text-slate-700">{text}<Chip tone={ok ? 'green' : 'amber'}>{ok ? 'Ulangan' : 'Ulanmagan'}</Chip></span></li>;
}

function System() {
  const { data, loading } = useFetch('/admin/system');
  if (loading) return <Spinner />;
  return (
    <div className="bg-white p-5 sm:p-6">
      <h3 className="text-xl font-extrabold">Tizim holati</h3>
      <ul className="mt-2 divide-y-0">
        <Row label="Ma'lumotlar bazasi" ok={data.db} text="MongoDB" />
        <Row label="Telegram bot" ok={!!data.bot} text={data.bot ? `@${data.bot}` : "TELEGRAM_BOT_TOKEN yo'q"} />
        <Row label="To'lov tizimi" ok={data.paymentMode !== 'mock'} text={data.paymentMode === 'mock' ? "Mock: pul yechilmaydi" : data.paymentMode} />
      </ul>
      <p className="mt-3 text-sm text-slate-600">Rejim: <b>{data.env}</b> · Node {data.node} · server {data.uptimeHours} soat ishlayapti · havolalar uchun manzil: {data.clientOrigin}</p>
      {data.env === 'development' && <p className="mt-1 text-sm text-slate-600">Telegram xabarlaridagi havolalar to'g'ri ochilishi uchun deploydan keyin <code>CLIENT_ORIGIN</code> ni haqiqiy sayt manziliga o'zgartiring.</p>}
    </div>
  );
}

function Password() {
  const [f, setF] = useState({ current: '', next: '' });
  const { run, err, msg, busy } = useAct();
  return (
    <form onSubmit={(e) => { e.preventDefault(); run(async () => { await api('/admin/me/password', { method: 'POST', body: f }); setF({ current: '', next: '' }); }, "Parol almashtirildi"); }} className="space-y-3 bg-white p-5 sm:p-6">
      <h3 className="text-xl font-extrabold">Parolni almashtirish</h3>
      <p className="text-sm text-slate-600">Faqat email va parol bilan kirgan adminlar uchun. Yangi parol kamida 10 belgi bo'lsin. Standart paroldan (<code>Admin12345</code>) albatta voz keching.</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <FField label="Joriy parol"><input className="input" type="password" autoComplete="current-password" required value={f.current} onChange={(e) => setF({ ...f, current: e.target.value })} /></FField>
        <FField label="Yangi parol"><input className="input" type="password" autoComplete="new-password" required minLength={10} value={f.next} onChange={(e) => setF({ ...f, next: e.target.value })} /></FField>
      </div>
      <ErrorBox error={err} />{msg && <p className="text-sm font-medium text-emerald-700">{msg}</p>}
      <button className="btn-primary" disabled={busy}>Almashtirish</button>
    </form>
  );
}

export default function Settings() {
  const { data, loading, error } = useFetch('/admin/settings');
  const [f, setF] = useState(null);
  const { run, err, msg, busy } = useAct();
  useEffect(() => { if (data) setF(data); }, [data]);
  if (loading || !f) return <Spinner />;
  if (error) return <ErrorBox error={error} />;
  const num = (k) => (e) => setF({ ...f, [k]: e.target.value === '' ? '' : Number(e.target.value) });
  const save = (e) => { e.preventDefault(); run(async () => setF(await api('/admin/settings', { method: 'PUT', body: { ...f, commission: Number(f.commission), firstLessonDiscount: Number(f.firstLessonDiscount), cancelHours: Number(f.cancelHours) } })), "Saqlandi: o'zgarish darhol kuchga kirdi"); };

  return (
    <Section title="Sozlamalar"
      intro={<p>Sayt qoidalarini kod o'zgartirmasdan shu yerda boshqarasiz. O'zgarish <b>yangi bronlarga</b> ta'sir qiladi; allaqachon yaratilgan bronlarning narxi o'zgarmaydi.</p>}>
      <System />
      <form onSubmit={save} className="space-y-6 bg-white p-5 sm:p-6">
        <h3 className="text-xl font-extrabold">Pul va qoidalar</h3>
        <div className="grid gap-5 sm:grid-cols-3">
          <div><FField label="Komissiya, %"><input className="input" type="number" min="0" max="50" step="0.5" value={f.commission} onChange={num('commission')} /></FField><p className="mt-1 text-sm text-slate-600">Platforma har to'lovdan oladigan ulush. Qolgani repetitorga. 0–50.</p></div>
          <div><FField label="Birinchi dars chegirmasi, %"><input className="input" type="number" min="0" max="90" value={f.firstLessonDiscount} onChange={num('firstLessonDiscount')} /></FField><p className="mt-1 text-sm text-slate-600">Talabaning platformadagi birinchi to'lanadigan darsiga. Chegirma narxdan ayriladi, komissiya va repetitor ulushi chegirmali summadan hisoblanadi (ikkalangiz ham mutanosib kamroq olasiz).</p></div>
          <div><FField label="Bekor qilish muddati, soat"><input className="input" type="number" min="0" max="168" value={f.cancelHours} onChange={num('cancelHours')} /></FField><p className="mt-1 text-sm text-slate-600">Dars boshlanishiga shuncha soatdan ko'p qolganda talaba to'langan darsni bekor qilsa, pul qaytariladi. Saytdagi matnlarda ham shu raqam ko'rinadi.</p></div>
        </div>

        <div className="space-y-2">
          <h3 className="text-xl font-extrabold">Ro'yxatdan o'tish</h3>
          <label className="flex items-start gap-3"><input type="checkbox" className="mt-1 h-5 w-5" checked={f.registrationOpen} onChange={(e) => setF({ ...f, registrationOpen: e.target.checked })} /><span><b>Yangi foydalanuvchilar ro'yxatdan o'ta oladi</b><br /><span className="text-sm text-slate-600">O'chirsangiz, yangi odam kira olmaydi (mavjudlar kiraveradi). Spam yoki ommaviy hujum bo'lganda foydali.</span></span></label>
        </div>

        <div className="space-y-3">
          <h3 className="text-xl font-extrabold">Saytning yuqori xabari</h3>
          <p className="text-sm text-slate-600">Hamma sahifaning tepasida ko'rinadigan qisqa xabar: masalan «Pilot rejim: to'lov hozircha sinov uchun» yoki «Ertaga 02:00 da texnik ish».</p>
          <div className="grid gap-3 sm:grid-cols-[1fr_12rem]">
            <FField label="Matn (200 belgigacha)"><input className="input" maxLength={200} value={f.banner.text} onChange={(e) => setF({ ...f, banner: { ...f.banner, text: e.target.value } })} /></FField>
            <FField label="Turi"><Select value={f.banner.kind} onChange={(v) => setF({ ...f, banner: { ...f.banner, kind: v } })}><option value="info">Ma'lumot (firuza)</option><option value="warn">Ogohlantirish (sariq)</option></Select></FField>
          </div>
          <label className="flex items-center gap-3"><input type="checkbox" className="h-5 w-5" checked={f.banner.active} onChange={(e) => setF({ ...f, banner: { ...f.banner, active: e.target.checked } })} />Xabarni saytda ko'rsatish</label>
          {f.banner.text && <div className={`px-4 py-2 text-center text-sm font-medium ${f.banner.kind === 'warn' ? 'bg-amber-100 text-amber-950' : 'bg-brand-100 text-slate-900'}`}>{f.banner.text}</div>}
        </div>

        <ErrorBox error={err} />{msg && <p className="text-sm font-medium text-emerald-700">{msg}</p>}
        <button className="btn-primary px-8" disabled={busy}>Saqlash</button>
      </form>
      <Password />
      <Hint title="Bu yerda yo'q narsalar">
        <p>Telegram bot tokeni, ma'lumotlar bazasi manzili va to'lov kalitlari xavfsizlik uchun saytdan emas, <code>server/.env</code> faylidan o'zgartiriladi.</p>
      </Hint>
    </Section>
  );
}
