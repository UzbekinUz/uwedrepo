import { useState } from 'react';
import { api } from '../../api.js';
import { Spinner, ErrorBox, Select } from '../../components/ui.jsx';
import { Chip, CsvButton, FField, Filters, Hint, Pager, Section, StatusChip, Table, dateTime, money, useAct, useList } from './kit.jsx';
import { qs } from '../../api.js';

const PAY = { click: 'Click', payme: 'Payme', card: 'Karta', manual: "Qo'lda" };

export default function Bookings() {
  const [f, setF] = useState({ status: '', q: '', from: '', to: '' });
  const list = useList('/admin/bookings', f);
  const { run, err, busy } = useAct();
  const act = (b, action, ask) => (!ask || confirm(ask)) && run(async () => { await api(`/admin/bookings/${b._id}/${action}`, { method: 'POST' }); list.reload(); });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  return (
    <Section title="Bronlar"
      intro={<>
        <p>Platformadagi barcha dars bronlari. Odatda hamma narsani talaba va repetitor o'zlari qiladi; bu yerda siz <b>nizoli yoki qotib qolgan</b> holatlarni qo'lda hal qilasiz.</p>
        <ul>
          <li><b>Qo'lda to'langan</b> — pilotda talaba repetitorga to'g'ridan-to'g'ri (naqd yoki o'tkazma) to'lasa, to'lovni siz tasdiqlaysiz. Faqat «To'lov kutilmoqda» holatidagi bron uchun.</li>
          <li><b>Dars o'tdi</b> — repetitor belgilashni unutsa, siz belgilaysiz: shundan keyin talaba baho bera oladi va repetitorga ulushi hisoblanadi.</li>
          <li><b>Bekor qilish</b> — to'langan bron bekor qilinsa, «qaytariladi» deb belgilanadi (pulni o'zingiz qaytarasiz).</li>
        </ul>
      </>}
      actions={<CsvButton path={`/admin/export/bookings.csv${qs(f)}`} name="bronlar.csv" />}>
      <Hint kind="warn" title="Amallar qaytarilmaydi">Har bir amal faoliyat jurnaliga yoziladi va tegishli odamga Telegram orqali xabar boradi (bot ulangan bo'lsa).</Hint>
      <Filters>
        <FField label="Holat"><Select value={f.status} onChange={(v) => setF({ ...f, status: v })}><option value="">Hammasi</option><option value="pending">Kutilmoqda</option><option value="confirmed">To'lov kutilmoqda</option><option value="paid">To'langan</option><option value="completed">O'tgan</option><option value="cancelled">Bekor qilingan</option></Select></FField>
        <FField label="Talaba yoki repetitor"><input className="input" value={f.q} onChange={set('q')} placeholder="Ism" /></FField>
        <FField label="Dars sanasi: dan"><input className="input" type="date" value={f.from} onChange={set('from')} /></FField>
        <FField label="gacha"><input className="input" type="date" value={f.to} onChange={set('to')} /></FField>
      </Filters>
      <ErrorBox error={err || list.error} />
      {list.loading ? <Spinner /> : (
        <>
          <Table head={['Dars vaqti', 'Talaba', 'Repetitor', 'Fan', 'Summa', 'Holat', 'Amallar']} empty={!list.data.items.length && 'Bron topilmadi.'}>
            {list.data.items.map((b) => (
              <tr key={b._id}>
                <td className="whitespace-nowrap font-medium">{dateTime(b.startsAt)}</td>
                <td>{b.student?.name}<div className="text-xs text-slate-500">{b.student?.telegram}</div></td>
                <td>{b.tutor?.user?.name}<div className="text-xs text-slate-500">{b.tutor?.user?.telegram}</div></td>
                <td>{b.subject?.name}</td>
                <td className="whitespace-nowrap"><b>{money(b.total)}</b>{b.discount > 0 && <div className="text-xs text-emerald-700">chegirma −{money(b.discount)}</div>}<div className="text-xs text-slate-500">komissiya {money(b.commission)}</div></td>
                <td><StatusChip s={b.status} />{b.paymentMethod && <div className="mt-1 text-xs text-slate-600">{PAY[b.paymentMethod]}</div>}{b.refunded && <div className="mt-1"><Chip tone="blue">Qaytariladi</Chip></div>}{b.payoutPaid && <div className="mt-1"><Chip tone="green">Repetitorga berilgan</Chip></div>}</td>
                <td>
                  <div className="flex flex-wrap gap-1.5">
                    {b.status === 'confirmed' && <button className="btn-primary btn-sm" disabled={busy} onClick={() => act(b, 'mark-paid', `${money(b.total)} to'lov qabul qilingani tasdiqlansinmi?`)}>Qo'lda to'langan</button>}
                    {b.status === 'paid' && <button className="btn-primary btn-sm" disabled={busy} onClick={() => act(b, 'complete', "Dars o'tgan deb belgilansinmi?")}>Dars o'tdi</button>}
                    {['pending', 'confirmed', 'paid'].includes(b.status) && <button className="btn-ghost btn-sm text-red-700" disabled={busy} onClick={() => act(b, 'cancel', b.status === 'paid' ? "Bron bekor qilinadi va to'lov qaytariladigan deb belgilanadi. Davom etasizmi?" : 'Bron bekor qilinsinmi?')}>Bekor qilish</button>}
                  </div>
                </td>
              </tr>
            ))}
          </Table>
          <Pager {...list.data} onPage={list.setPage} />
        </>
      )}
    </Section>
  );
}
