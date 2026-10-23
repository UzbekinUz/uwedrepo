import { api } from '../../api.js';
import { Spinner, ErrorBox } from '../../components/ui.jsx';
import { useState } from 'react';
import { CsvButton, Hint, Section, Stat, StatGrid, Table, money, useAct, useFetch } from './kit.jsx';

export default function Finance() {
  const [n, setN] = useState(0);
  const fin = useFetch('/admin/finance', [n]);
  const pay = useFetch('/admin/payouts', [n]);
  const { run, err, msg, busy } = useAct();
  if (fin.loading || pay.loading) return <Spinner />;
  const { months, refunds, totals } = fin.data;
  const settle = (p) => confirm(`${p.name} ga ${money(p.owed)} o'tkazib berdingizmi? ${p.owedCount} ta dars «o'tkazilgan» deb belgilanadi.`) &&
    run(async () => { const r = await api(`/admin/payouts/${p._id}/settle`, { method: 'POST' }); setN(n + 1); return r; }, "Belgilandi");
  const maxG = Math.max(1, ...months.map((m) => m.gross));

  return (
    <Section title="Moliya va repetitorlarga hisob"
      intro={<>
        <p>Talaba to'lagan pul repetitorga qanday yetib borishini kuzatasiz. Pul uch bosqichdan o'tadi:</p>
        <ul>
          <li><b>Kutilmoqda</b> — talaba to'lagan, lekin dars hali o'tmagan. Repetitorga hali berilmaydi.</li>
          <li><b>O'tkazib berilishi kerak</b> — dars o'tdi, repetitor ulushini (summadan komissiya ayirilgan qismi) olishi kerak.</li>
          <li><b>O'tkazilgan</b> — siz repetitorga pulni bergansiz va «O'tkazildi» tugmasini bosgansiz.</li>
        </ul>
        <p>Pul o'tkazmasini bu sayt qilmaydi: siz uni o'zingiz (bank ilovasi orqali) o'tkazasiz, keyin shu yerda belgilaysiz.</p>
      </>}>
      <StatGrid>
        <Stat label="Repetitorlarga berilishi kerak" value={money(totals.owed)} warn={totals.owed > 0} tip="Dars o'tgan, ammo ulushi hali o'tkazilmagan bronlar: summa − komissiya." />
        <Stat label="Kutilmoqda (dars o'tmagan)" value={money(totals.held)} tip="To'langan, ammo dars hali o'tmagan bronlarning repetitor ulushi. Dars bekor bo'lsa, qaytariladi." />
        <Stat label="Avval o'tkazilgan" value={money(totals.paidOut)} />
        <Stat label="Qaytarilgan to'lovlar" value={`${refunds.n} ta`} hint={money(refunds.sum)} tip="Bekor qilingan to'langan bronlar. Pulni talabaga qaytarishni o'zingiz bajarasiz." />
      </StatGrid>
      <ErrorBox error={err} />
      {msg && <p className="text-sm font-medium text-emerald-700">{msg}</p>}

      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="text-xl font-extrabold">Repetitorlar bo'yicha hisob</h3><CsvButton path="/admin/export/payouts.csv" name="repetitor-hisob.csv" /></div>
        <Table head={['Repetitor', 'Aloqa', "O'tkazilishi kerak", 'Kutilmoqda', "O'tkazilgan", '']} empty={!pay.data.length && "Hali to'lov bo'lmagan."}>
          {pay.data.map((p) => (
            <tr key={p._id}>
              <td className="font-semibold">{p.name}</td>
              <td className="text-slate-700">{p.telegram || '—'}{p.phone ? ` · ${p.phone}` : ''}</td>
              <td><b className={p.owed > 0 ? 'text-amber-800' : ''}>{money(p.owed)}</b>{p.owedCount > 0 && <div className="text-xs text-slate-500">{p.owedCount} ta dars</div>}</td>
              <td>{money(p.held)}</td>
              <td>{money(p.paidOut)}</td>
              <td>{p.owed > 0 && <button className="btn-primary btn-sm" disabled={busy} onClick={() => settle(p)}>O'tkazildi</button>}</td>
            </tr>
          ))}
        </Table>
      </div>

      <div className="space-y-3">
        <h3 className="text-xl font-extrabold">Oylik daromad</h3>
        <Hint kind="info">Komissiya — platformaning daromadi. Oy to'lov qilingan sana bo'yicha hisoblanadi (Toshkent vaqti).</Hint>
        <Table head={['Oy', 'Aylanma', 'Komissiya (sizniki)', 'Repetitorlarga', 'Bronlar', '']} empty={!months.length && "Hali to'lov bo'lmagan."}>
          {months.map((m) => (
            <tr key={m._id}>
              <td className="font-semibold">{m._id}</td><td>{money(m.gross)}</td><td><b>{money(m.commission)}</b></td><td>{money(m.payout)}</td><td>{m.n}</td>
              <td className="w-40"><div className="h-2 bg-slate-100"><div className="h-2 bg-brand-600" style={{ width: `${(m.gross / maxG) * 100}%` }} /></div></td>
            </tr>
          ))}
        </Table>
      </div>
    </Section>
  );
}
