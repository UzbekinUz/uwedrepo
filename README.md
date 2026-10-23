# UWEDRepo

UWED talabalari uchun repetitorlar, o'quv materiallari, nazoratlar kalendari va fan guruhlari platformasi.
Stek: **React (Vite) + Tailwind CSS · Node.js + Express · MongoDB (Mongoose)**.

Hisobot tahlili va kamchiliklar ro'yxati: [HISOBOT_TAHLILI.md](HISOBOT_TAHLILI.md)

## Ishga tushirish

```bash
npm run install:all     # root, server va client paketlari
npm run dev             # API: http://localhost:5000, sayt: http://localhost:5173
```

`server/.env` (namuna: `server/.env.example`). `MONGODB_URI` bo'sh bo'lsa, ma'lumotlar `server/.mongo-data` papkasida saqlanadigan lokal MongoDB ishga tushadi (o'rnatish shart emas, birinchi ishga tushishda mongod yuklab olinadi). Production uchun MongoDB Atlas havolasini kiriting va `JWT_SECRET` ni o'zgartiring.

Birinchi ishga tushganda demo ma'lumotlar yoziladi (fanlar, 4 repetitor, nazoratlar). To'liq qayta yozish: `npm run seed`.

| Rol | Email | Parol |
|-----|-------|-------|
| Admin | `admin@uwedrepo.uz` | `Admin12345` (`.env` da o'zgartiring) |
| Demo repetitor | `aziza@demo.uz` | `Demo12345` |

> Demo ma'lumotlar (nazorat sanalari, materiallar, repetitorlar) — namuna. Pilotdan oldin admin paneldan haqiqiylarini kiriting.

## Telegram orqali ro'yxatdan o'tish va kirish

Foydalanuvchi parol o'rniga Telegram bot orqali kirishadi: saytda «Telegram orqali kod olish» → bot ochiladi → **Start** → bot 6 xonali kod yuboradi → kod saytga kiritiladi. Telegram ismi, username va (ixtiyoriy, bot tugmasi orqali) telefon raqami akkauntga ulanadi.

1. Telegramda [@BotFather](https://t.me/BotFather) ga `/newbot` yuboring, nom va username bering, tokenni oling.
2. `server/.env` ga qo'shing: `TELEGRAM_BOT_TOKEN=123456:ABC...` va serverni qayta ishga tushiring. Server ishga tushganda `[telegram] bot ishlayapti: @...` yozuvi chiqadi.
3. Token bo'sh bo'lsa, sayt avtomatik email bilan ro'yxatdan o'tishga qaytadi. Admin va demo repetitorlar email/parol bilan kirishda davom etadi («Email bilan kirish»).

Bot long polling bilan ishlaydi (webhook va ochiq domen kerak emas). Bir vaqtda faqat bitta server nusxasi botni tinglashi mumkin. Kod 10 daqiqa amal qiladi, bir marta ishlatiladi, 5 ta noto'g'ri urinishdan keyin bloklanadi.

## Yo'riqnoma

Ishlatish bo'yicha oddiy tilda qo'llanma (sinash, joylashtirish, admin va kundalik ishlar): [YORIQNOMA.md](YORIQNOMA.md).

## Joylashtirish (Render)

Qadamma-qadam qo'llanma: [DEPLOY.md](DEPLOY.md). `render.yaml` Blueprint ham tayyor.

## Admin panel

`/admin` (faqat admin roli). 12 bo'lim: umumiy ko'rinish (pilotga tayyorlik ro'yxati, grafiklar, voronka), foydalanuvchilar (bloklash), repetitorlar (tasdiqlash yoki sabab bilan rad etish), bronlar (qo'lda to'lov), moliya (repetitorlarga hisob), sharhlar, kontent (fan, sana, material), Telegram e'lonlari, tadqiqot (so'rovnoma), sozlamalar (komissiya, chegirma, bekor qilish muddati, saytning yuqori xabari, parol), faoliyat jurnali va yo'riqnoma. Har bir bo'limning tepasida «bu bo'lim nima qiladi» izohi bor.

Pilotda to'lov qo'lda: talaba repetitorga to'laydi, admin «Bronlar» bo'limida «Qo'lda to'langan» belgilaydi. Click/Payme ulangach `server/src/payments.js` almashtiriladi.

Havolalarga `?ref=nomi` qo'shsangiz (masalan `/?ref=0-9a-guruh`), tashrif manbasi (chat yoki kanal) adminda ko'rinadi.

## Testlar

```bash
cd server && npm test
```

Testlar vaqtinchalik (xotiradagi) bazada ishlaydi, sizning ma'lumotingizga tegmaydi. Kamchiliklar va ochiq masalalar: [KAMCHILIKLAR_HISOBOTI.md](KAMCHILIKLAR_HISOBOTI.md).


## Tillar (uz / ru / en)

Til almashtirgich sarlavhada. Matnlar `client/src/lib/dict.js` da: kalit — o'zbekcha matn, qiymat — `[ruscha, inglizcha]`; kodda `t('...')` ishlatiladi. Yangi matn qo'shsangiz, lug'atga ham yozing (yo'q bo'lsa, o'zbekcha ko'rinadi). Admin panel faqat o'zbekcha. Fan nomlari, repetitor tavsiflari va materiallar — foydalanuvchi kiritgan kontent, tarjima qilinmaydi.

## Tuzilma

```
server/src
  models/index.js     barcha Mongoose modellari
  routes/             auth, catalog (fan/nazorat/material), tutors, bookings, admin, public (so'rovnoma, tashrif)
  lib.js              bo'sh slotlar, narx/komissiya hisobi
  payments.js         to'lov provayderi (hozir mock; Click/Payme shu yerga ulanadi)
client/src
  pages/              Home, Subjects, Tutors, TutorDetail, Calendar, Materials, MyLessons, TutorDashboard, Admin, Survey
  components/         Layout, Cards, PrefPicker, ui
```

## Asosiy qoidalar (serverda majburiy)

- Bron faqat repetitorning bo'sh slotiga; band vaqtga qayta bron — 409.
- To'lov faqat repetitor tasdiqlagach; baho faqat o'tgan darsdan keyin, bron bo'yicha 1 marta.
- Birinchi dars — `FIRST_LESSON_DISCOUNT`%; komissiya — `COMMISSION_PERCENT`%.
- To'langan darsni talaba 24 soatdan kam qolganda bekor qila olmaydi; repetitor rad etsa — to'lov qaytariladi.
- Telegram kontaktlari faqat tasdiqlangan bronda ko'rinadi.
- Yangi repetitor va materiallar admin tasdig'isiz ommaviy ko'rinmaydi.

## Hozircha mock

To'lov (Click/Payme/karta) — **haqiqiy pul yechilmaydi**. Haqiqiy ulash uchun merchant shartnomasi kerak; `server/src/payments.js` ni almashtiring.
