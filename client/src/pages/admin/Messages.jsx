import { useState } from 'react';
import { api } from '../../api.js';
import { Spinner, ErrorBox, Select } from '../../components/ui.jsx';
import { Chip, FField, Hint, Section, Table, dateTime, useAct, useFetch } from './kit.jsx';

const AUD = { all: 'Hamma', students: 'Talabalar', tutors: 'Repetitorlar' };

export default function Messages() {
  const [audience, setAudience] = useState('all');
  const [text, setText] = useState('');
  const [n, setN] = useState(0);
  const aud = useFetch(`/admin/announcements/audience?audience=${audience}`, []);
  const hist = useFetch('/admin/announcements', [n]);
  const { run, err, msg, busy } = useAct();
  const botOn = aud.data?.bot;

  const send = (e) => {
    e.preventDefault();
    if (!confirm(`Xabar ${aud.data?.count} kishiga yuboriladi va qaytarib bo'lmaydi. Matnni tekshirdingizmi?`)) return;
    run(async () => { await api('/admin/announcements', { method: 'POST', body: { text, audience } }); setText(''); setN((x) => x + 1); }, "Yuborish boshlandi: natija pastdagi tarixda ko'rinadi");
  };

  return (
    <Section title="Xabarlar (Telegram e'lonlari)"
      intro={<><p>Telegram boti orqali foydalanuvchilarga bir vaqtda xabar yuborasiz: yangi fan qo'shildi, nazorat sanasi o'zgardi, saytda texnik ish bor va hokazo. Xabar faqat <b>Telegram orqali kirgan</b> va botga Start bosgan odamlarga boradi.</p><ul><li>Faqat zarur xabar yuboring: ko'p yozsangiz, odamlar botni bloklaydi.</li><li>Xabar oddiy matn (rasm va havola preview'siz). Uzunligi — 1000 belgigacha.</li></ul></>}>
      {!aud.loading && !botOn && <Hint kind="warn" title="Telegram bot ulanmagan"><p>E'lon yuborish uchun <code>server/.env</code> ga <code>TELEGRAM_BOT_TOKEN</code> qo'shing va serverni qayta ishga tushiring.</p></Hint>}
      <form onSubmit={send} className="space-y-4 bg-white p-5 sm:p-6">
        <div className="grid gap-3 sm:grid-cols-[14rem_1fr] sm:items-end">
          <FField label="Kimga"><Select value={audience} onChange={setAudience}>{Object.entries(AUD).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</Select></FField>
          <p className="pb-2 text-sm text-slate-700">Qabul qiluvchilar: <b className="text-xl">{aud.data?.count ?? '…'}</b> kishi</p>
        </div>
        <FField label="Xabar matni"><textarea className="input" rows={5} maxLength={1000} value={text} onChange={(e) => setText(e.target.value)} placeholder="Masalan: Hisoblash 1 bo'yicha oraliq nazorat sanasi 12-noyabrga ko'chirildi." /></FField>
        <div className="flex items-center justify-between text-sm text-slate-600"><span>{text.length} / 1000</span></div>
        {text.trim().length >= 5 && <div className="bg-slate-100 p-4 text-sm"><div className="mb-1 font-semibold text-slate-600">Foydalanuvchi shunday ko'radi:</div><p className="whitespace-pre-wrap text-slate-900">{text}</p></div>}
        <ErrorBox error={err} />{msg && <p className="text-sm font-medium text-emerald-700">{msg}</p>}
        <button className="btn-primary" disabled={busy || !botOn || text.trim().length < 5 || !aud.data?.count}>Yuborish</button>
      </form>

      <div className="space-y-3">
        <h3 className="text-xl font-extrabold">Yuborilganlar tarixi</h3>
        {hist.loading ? <Spinner /> : (
          <Table head={['Vaqt', 'Kimga', 'Matn', 'Natija', 'Holat']} empty={!hist.data.length && "Hali e'lon yuborilmagan."}>
            {hist.data.map((a) => (
              <tr key={a._id}>
                <td className="whitespace-nowrap">{dateTime(a.createdAt)}<div className="text-xs text-slate-500">{a.by?.name}</div></td>
                <td>{AUD[a.audience]}</td><td className="max-w-md break-words">{a.text}</td>
                <td>{a.sent} / {a.total}{a.failed > 0 && <div className="text-xs text-red-700">{a.failed} ta yetmadi (botni bloklagan bo'lishi mumkin)</div>}</td>
                <td>{a.status === 'done' ? <Chip tone="green">Tugadi</Chip> : <Chip tone="amber">Yuborilmoqda…</Chip>}</td>
              </tr>
            ))}
          </Table>
        )}
        <button className="btn-ghost btn-sm" onClick={() => setN((x) => x + 1)}>Yangilash</button>
      </div>
    </Section>
  );
}
