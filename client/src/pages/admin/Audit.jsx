import { useState } from 'react';
import { Spinner, ErrorBox, Select } from '../../components/ui.jsx';
import { FField, Filters, Pager, Section, Table, dateTime, useList } from './kit.jsx';

const LABEL = {
  'user.block': 'Foydalanuvchini blokladi', 'user.unblock': 'Blokdan chiqardi', 'user.role': "Rolni o'zgartirdi",
  'tutor.approved': 'Repetitorni tasdiqladi', 'tutor.rejected': 'Repetitorni rad etdi', 'tutor.pending': 'Repetitorni katalogdan yashirdi', 'tutor.featured': 'Tavsiya belgisini o\'zgartirdi',
  'booking.mark-paid': "Qo'lda to'langan deb belgiladi", 'booking.complete': "Darsni o'tgan deb belgiladi", 'booking.cancel': 'Bronni bekor qildi',
  'payout.settle': "Repetitorga o'tkazilganini belgiladi", 'review.hide': 'Sharhni yashirdi', 'review.show': 'Sharhni qaytardi', 'review.delete': "Sharhni o'chirdi",
  'subject.create': "Fan qo'shdi", 'subject.update': 'Fanni tahrirladi', 'subject.delete': "Fanni o'chirdi",
  'subject.bulk': "Bir nechta fan qo'shdi", 'subject.starter': "Namunaviy fanlarni qo'shdi", 'subject.hide': 'Fanni yashirdi', 'subject.show': "Fanni qaytardi",
  'exam.create': "Sana qo'shdi", 'exam.update': "Sanani o'zgartirdi", 'exam.delete': "Sanani o'chirdi",
  'material.approved': 'Materialni tasdiqladi', 'material.pending': 'Materialni yashirdi', 'material.delete': "Materialni o'chirdi",
  'settings.update': "Sozlamalarni o'zgartirdi", 'announcement.send': "E'lon yubordi", 'admin.password': 'Parolni almashtirdi',
};

export default function Audit() {
  const [action, setAction] = useState('');
  const list = useList('/admin/audit', { action });
  return (
    <Section title="Faoliyat jurnali"
      intro={<p>Adminlar bajargan har bir muhim amal shu yerda yoziladi: kim, qachon, nima qilgan. O'chirib bo'lmaydi. Nimadir noto'g'ri bo'lsa (masalan, sharh yo'qolgan yoki narx o'zgargan), sababini shu yerdan topasiz. Bir necha admin bo'lsa, ayniqsa kerak.</p>}>
      <Filters>
        <FField label="Amal turi"><Select value={action} onChange={setAction}><option value="">Hammasi</option><option value="user">Foydalanuvchilar</option><option value="tutor">Repetitorlar</option><option value="booking">Bronlar</option><option value="payout">Repetitorga to'lovlar</option><option value="review">Sharhlar</option><option value="subject">Fanlar</option><option value="exam">Sanalar</option><option value="material">Materiallar</option><option value="settings">Sozlamalar</option><option value="announcement">E'lonlar</option></Select></FField>
      </Filters>
      <ErrorBox error={list.error} />
      {list.loading ? <Spinner /> : (
        <>
          <Table head={['Vaqt', 'Kim', 'Nima qildi', 'Kimga / nimaga']} empty={!list.data.items.length && "Hali yozuv yo'q."}>
            {list.data.items.map((a) => (
              <tr key={a._id}>
                <td className="whitespace-nowrap">{dateTime(a.createdAt)}</td><td className="font-semibold">{a.adminName}</td>
                <td>{LABEL[a.action] || a.action}</td>
                <td className="max-w-md break-words text-slate-700">{a.target}{a.meta && Object.keys(a.meta).length ? <div className="text-xs text-slate-500">{JSON.stringify(a.meta)}</div> : null}</td>
              </tr>
            ))}
          </Table>
          <Pager {...list.data} onPage={list.setPage} />
        </>
      )}
    </Section>
  );
}
