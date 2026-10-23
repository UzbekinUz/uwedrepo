import { Icon } from '../../components/Motion.jsx';
import { Hint, Section } from './kit.jsx';

const SECTIONS = [
  ['calendar', "Umumiy ko'rinish", 'overview', "Pilotga tayyorlik ro'yxati, asosiy ko'rsatkichlar, 30 kunlik grafiklar, voronka, eng talabgir fanlar, repetitori yo'q fanlar va tashrif manbalari.", "Har kuni ertalab 1 daqiqa: tasdiqni kutayotgan narsalar bormi, voronkada qayer yomonlashdi."],
  ['search', 'Tadqiqot', 'research', "So'rovnoma natijalari, izohlar, CSV eksport va bozor hajmi (TAM/SAM/SOM) kalkulyatori.", "Hisobot uchun raqam kerak bo'lganda."],
  ['person', 'Foydalanuvchilar', 'users', "Hamma akkauntlarni qidirish, batafsil ko'rish, bloklash, admin huquqi berish, CSV eksport.", "Shikoyat tushganda yoki spam akkaunt topilganda."],
  ['shield', 'Repetitorlar', 'tutors', "Anketalarni tasdiqlash, sabab yozib rad etish, tavsiya belgisi, katalogdan yashirish. Har bir repetitorning daromadi va reytingi.", "Yangi anketa kelganda (Telegram ulangan bo'lsa, sizga xabar keladi)."],
  ['book', 'Bronlar', 'bookings', "Barcha bronlar, filtrlar, qo'lda to'lovni tasdiqlash, darsni o'tgan deb belgilash, bekor qilish, CSV.", "Pilotda to'lov qo'lda bo'lgani uchun: talaba to'lagach «Qo'lda to'langan» ni bosasiz."],
  ['card', 'Moliya', 'finance', "Oylik aylanma va komissiya, repetitorlarga berilishi kerak bo'lgan summalar, «o'tkazildi» belgisi, CSV.", "Haftada bir marta: repetitorlarga pul o'tkazib, shu yerda belgilaysiz."],
  ['star', 'Sharhlar', 'reviews', "Sharhlarni ko'rish, qoidabuzarlarini yashirish yoki o'chirish (reyting o'zi qayta hisoblanadi).", "Shikoyat tushganda."],
  ['file', 'Kontent', 'content', "Fanlar, rasmiy nazorat sanalari, Telegram guruh havolalari va talabalar yuborgan materiallarni tekshirish.", "Semestr boshida va yangi material kelganda."],
  ['telegram', 'Xabarlar', 'messages', "Telegram orqali barcha, faqat talabalar yoki faqat repetitorlar uchun e'lon yuborish va tarixini ko'rish.", "Muhim o'zgarish bo'lganda: sana ko'chdi, yangi fan qo'shildi."],
  ['lock', 'Sozlamalar', 'settings', "Komissiya, chegirma, bekor qilish muddati, ro'yxatdan o'tishni yopish, saytning yuqori xabari, tizim holati, parolni almashtirish.", "Bir marta sozlab qo'yiladi; qoida o'zgarganda qaytiladi."],
  ['clock', 'Jurnal', 'audit', "Adminlar bajargan har bir amalning o'chirib bo'lmaydigan tarixi.", "Nimadir o'zgarib qolsa, sababini topish uchun."],
];

const DAILY = [
  "Umumiy ko'rinishni oching: sariq «tasdiqni kutayotgan» blok bormi?",
  "Yangi repetitor anketalarini o'qing: tasdiqlang yoki sabab yozib rad eting.",
  "Yangi materiallarni havolasini ochib tekshiring va tasdiqlang.",
  "Bronlar: «To'lov kutilmoqda» da uzoq turib qolganlar yoki shikoyatlar bormi?",
];
const WEEKLY = [
  "Moliya: repetitorlarga berilishi kerak summalarni o'tkazing va «O'tkazildi» ni bosing.",
  "Voronkani ko'ring: kirganlar ko'p-u ro'yxatdan o'tganlar kam bo'lsa, kirish sahifasini yaxshilash kerak.",
  "Repetitori yo'q fanlar ro'yxatiga qarab, shu fanlar bo'yicha repetitor qidiring.",
  "CSV eksportlarni zaxira uchun saqlab qo'ying.",
];

export default function Guide({ go }) {
  return (
    <Section title="Admin yo'riqnomasi"
      intro={<p>Bu sahifa admin panel nima qila olishini, qaysi bo'limda nima borligini va odatiy ishlar tartibini tushuntiradi. Har bir bo'limning yuqorisida ham «Bu bo'lim nima qiladi» izohi bor, raqam yonidagi <b>ⓘ</b> belgisi esa uning qanday hisoblanishini aytadi.</p>}>
      <div className="grid gap-3 md:grid-cols-2">
        {SECTIONS.map(([icon, title, tab, what, when]) => (
          <button key={tab} onClick={() => go(tab)} className="card-link flex gap-4 p-5 text-left">
            <span className="mt-0.5 shrink-0 text-brand-700"><Icon name={icon} size={30} /></span>
            <span><span className="block text-lg font-extrabold">{title}</span><span className="mt-1 block text-slate-700">{what}</span><span className="mt-2 block text-sm font-medium text-brand-700">Qachon: {when}</span></span>
          </button>
        ))}
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="bg-white p-5"><h3 className="text-lg font-extrabold">Har kuni (5 daqiqa)</h3><ul className="mt-3 space-y-2">{DAILY.map((x) => <li key={x} className="flex gap-2"><span className="mt-0.5 shrink-0 text-brand-600"><Icon name="check" size={20} /></span>{x}</li>)}</ul></div>
        <div className="bg-white p-5"><h3 className="text-lg font-extrabold">Haftada bir marta</h3><ul className="mt-3 space-y-2">{WEEKLY.map((x) => <li key={x} className="flex gap-2"><span className="mt-0.5 shrink-0 text-brand-600"><Icon name="check" size={20} /></span>{x}</li>)}</ul></div>
      </div>

      <div className="bg-white p-5 sm:p-6">
        <h3 className="text-xl font-extrabold">Atamalar</h3>
        <dl className="mt-3 grid gap-x-8 gap-y-3 md:grid-cols-2">
          {[
            ['Kutilmoqda', "Talaba bron yubordi, repetitor hali javob bermadi."],
            ["To'lov kutilmoqda", "Repetitor tasdiqladi, talaba hali to'lamagan."],
            ["To'langan", "Pul qabul qilingan, dars hali o'tmagan."],
            ["O'tgan", "Dars o'tdi: talaba baho berishi, repetitor ulushi hisoblanishi mumkin."],
            ['Komissiya', "Platformaning ulushi: to'lov summasining Sozlamalardagi foizi."],
            ["Repetitor ulushi", "To'lov summasidan komissiya ayirilgani. Dars o'tgach siz repetitorga o'tkazasiz."],
            ['Voronka', "Odamlar bosqichma-bosqich: kirdi, ro'yxatdan o'tdi, bron qildi, to'ladi. Qayerda eng ko'p to'xtashini ko'rsatadi."],
            ['Konversiya', "To'laganlar ÷ saytga kirganlar. Pilotda asosiy muvaffaqiyat ko'rsatkichi."],
          ].map(([k, v]) => <div key={k}><dt className="font-bold text-slate-900">{k}</dt><dd className="text-slate-700">{v}</dd></div>)}
        </dl>
      </div>

      <Hint kind="warn" title="Xavfsizlik qoidalari">
        <ul>
          <li>Admin parolini almashtiring va hech kimga bermang. Admin huquqini faqat ishongan odamga bering.</li>
          <li>Telegram kodi so'ralsa, hech kimga aytmang: UWEDRepo xodimlari ham so'ramaydi.</li>
          <li>Foydalanuvchi ma'lumotlari (telefon, Telegram) shaxsiy: CSV fayllarni begonalarga yubormang.</li>
          <li>Bloklash va sharh yashirish — odamga ta'sir qiladigan amallar: faqat qoida buzilganda va sababi aniq bo'lganda qiling.</li>
        </ul>
      </Hint>
    </Section>
  );
}
