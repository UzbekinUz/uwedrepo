# UWEDRepo — umumiy kamchiliklar hisoboti

Sana: 2026-10-23. Asos: kodni o'qib chiqish, `npm audit`, avtomatik testlar (`cd server && npm test`, 11 ta) va brauzerda qo'lda tekshirish.
Belgilar: ✅ shu bosqichda tuzatildi · 🟡 qisman · ⛔ ochiq.

## 1. Xulosa

Loyiha pilot uchun ishlaydigan holatda: katalog, bron, to'lov oqimi (mock), baho, Telegram orqali kirish, uch tilli interfeys va to'liq admin panel bor. Pilotni boshlashga to'sqinlik qiladigan **uchta narsa** (kodga bog'liq emas): haqiqiy bot tokeni, haqiqiy kontent (fanlar, rasmiy sanalar, repetitorlar) va saytni ochiq manzilga joylashtirish. Haqiqiy pul qabul qilish uchun esa yana yuridik va to'lov shartnomalari kerak.

Shu bosqichda **jiddiy xavfsizlik va to'g'rilik xatolari** topilib tuzatildi (2-bo'lim). Qolgan ochiq masalalar 3-bo'limda, ustuvorlik tartibida.

## 2. Topilgan va shu bosqichda tuzatilgan kamchiliklar

| # | Daraja | Kamchilik | Oqibat | Tuzatish va tekshiruv |
|---|--------|-----------|--------|-----------------------|
| 1 | Jiddiy | **NoSQL operator in'ektsiyasi:** `?subject[$ne]=x` kabi so'rov Mongo operatoriga aylanardi | Ommaviy filtrlarni aylanib o'tish, kutilmagan so'rovlar | ✅ Express `query parser = simple`; testda tekshirilgan |
| 2 | Jiddiy | **Ikki marta bron:** bir vaqtda kelgan ikki so'rov bir slotni olishi mumkin edi (faqat dastur darajasida tekshiruv) | Bitta vaqtga ikki talaba | ✅ MongoDB'da noyob qisman indeks `(repetitor, vaqt)`; poyga testida bittasi 201, ikkinchisi 409 |
| 3 | Jiddiy | **Ikki marta to'lash/holat o'zgartirish poygasi:** «To'lash» ikki marta bosilsa ikkalasi o'tishi mumkin edi | Haqiqiy tizimda ikki marta pul yechilishi | ✅ holat o'tishlari atomik (`findOneAndUpdate` holat sharti bilan); testda tekshirilgan |
| 4 | Jiddiy | **Productionda demo ma'lumot:** baza bo'sh bo'lsa ma'lum parolli (`Demo12345`) demo repetitorlar yozilardi | Ochiq saytda tanilgan parolli akkauntlar | ✅ productionda demo yozilmaydi (faqat `SEED_DEMO=true`); `ADMIN_PASSWORD` productionda majburiy va standart bo'lmasligi shart |
| 5 | Yuqori | **Email orqali ro'yxatdan o'tish ochiq qolgan:** Telegram yoqilsa ham API orqali spam akkaunt ochish mumkin edi | Soxta akkauntlar | ✅ bot ishlayotganda email-ro'yxat yopiq; admin ro'yxatni butunlay yopa oladi |
| 6 | Yuqori | **Bloklash yo'q:** buzg'unchi foydalanuvchini to'xtatib bo'lmasdi | Spam, haqorat | ✅ bloklangan foydalanuvchi kira olmaydi va hech narsa qila olmaydi (server tomonida) |
| 7 | Yuqori | **Admin harakatlari jurnali yo'q** | Kim nima qilgani noma'lum | ✅ o'chirib bo'lmaydigan faoliyat jurnali |
| 8 | Yuqori | **Repetitor bron haqida bilmasdi** (faqat saytga kirsa ko'rardi) | Bronlar javobsiz qolishi, talaba kutib qolishi | 🟡 Telegram bildirishnomalari (yangi bron, tasdiq, rad, bekor, to'lov, dars o'tdi, anketa natijasi). **Haqiqiy Telegramda sinalmagan**, soxta Telegram serveri bilan sinalgan |
| 9 | O'rta | Komissiya, chegirma, bekor qilish muddati faqat `.env` da, o'zgartirish uchun qayta ishga tushirish kerak | Qoidani tez o'zgartirib bo'lmaydi | ✅ admin paneldan; yangi bronlarga darhol ta'sir qiladi |
| 10 | O'rta | **Repetitorlarga to'lov hisobi yo'q** | Kimga qancha berish kerakligini qo'lda sanash | ✅ «Moliya» bo'limi: kutilmoqda / berilishi kerak / berilgan, CSV |
| 11 | O'rta | Ochiq GET so'rovlari (fanlar, nazoratlar) 15 daqiqada 120 tagacha cheklangan edi | Oddiy foydalanuvchilar 429 xatosini olishi | ✅ (oldingi bosqich) cheklov faqat yozuvchi yo'llarga |
| 12 | O'rta | Hech qanday avtomatik test yo'q | Har o'zgarish xavfli | ✅ API uchun 11 ta test (poyga holatlari, pul oqimi, huquqlar, CSV himoyasi) |
| 13 | O'rta | CSV eksportda Excel formulasi in'ektsiyasi xavfi (`=...` bilan boshlanuvchi matn) | Admin Excel'da zararli formula ochishi | ✅ xavfli belgilar bilan boshlangan matn apostrof bilan himoyalangan; testda tekshirilgan |
| 14 | Past | Tashrif manbasini bilib bo'lmasdi | Qaysi chat odam keltirgani noma'lum | ✅ `?ref=nomi` bilan hisoblanadi, adminda ko'rinadi |

## 3. Ochiq kamchiliklar (ustuvorlik tartibida)

### Pilotdan oldin hal qilinishi shart
| # | Daraja | Masala | Nima qilish kerak |
|---|--------|--------|-------------------|
| A1 | ⛔ Yuqori | **Versiyalash (git) yo'q.** Loyiha hech qayerda saqlanmagan: kompyuter buzilsa, hammasi yo'qoladi | `git init`, GitHub'da yopiq repozitoriy. `.env` fayli allaqachon `.gitignore` da |
| A2 | ⛔ Yuqori | **Joylashtirish (deploy) tayyor emas:** Express `client/dist` ni tarqatmaydi, Dockerfile yo'q, HTTPS yo'q. Telegram havolalari `CLIENT_ORIGIN` ga bog'liq | Hosting tanlash, HTTPS, `NODE_ENV=production`, MongoDB Atlas, `CLIENT_ORIGIN` |
| A3 | ⛔ Yuqori | **Zaxira nusxa va monitoring yo'q** | Atlas avtomatik backup; xatolar uchun jurnal/ogohlantirish (masalan UptimeRobot) |
| A4 | ⛔ Yuqori | **Yuridik hujjatlar yo'q:** ommaviy oferta, maxfiylik siyosati, foydalanish shartlari. Telegram ID va telefon raqamlari yig'iladi | Yurist bilan tayyorlang va saytga havola qo'ying; ro'yxatdan o'tishda rozilik bandi |
| A5 | ⛔ Yuqori | Admin paroli standart (`Admin12345`) | Sozlamalar bo'limidan almashtiring; productionda majburiy talab qilinadi |
| A6 | ⛔ O'rta | **Kontent demo:** barcha sanalar «Demo sana», materiallar `example.com`, 2 ta fakultetda fan yo'q | Admin paneldagi «Pilotga tayyorlik» ro'yxati buni ko'rsatib turadi |
| A7 | ⛔ O'rta | Telegram bot haqiqiy Telegramda sinalmagan | Token qo'yib, o'zingiz bir marta to'liq oqimni o'tkazing (kirish, bron, bildirishnoma, e'lon) |

### Haqiqiy pul uchun
| # | Daraja | Masala | Izoh |
|---|--------|--------|------|
| B1 | ⛔ | To'lov hozir **mock**: pul yechilmaydi | Click/Payme merchant shartnomasi, sandbox kalitlari va ochiq HTTPS manzil kerak. Kod ishi har biri uchun taxminan 2–4 ish kuni, shartnoma muddatini ularning menejeri aytadi |
| B2 | ⛔ | Repetitorga pul o'tkazish qo'lda (bank orqali) | Platforma buni avtomatlashtirmaydi; ko'paysa, to'lov provayderining alohida mahsuloti kerak bo'ladi |
| B3 | ⛔ | Soliq va fiskal chek talablari ko'rib chiqilmagan | Buxgalter bilan tekshiring |

### Mahsulot va foydalanuvchi tajribasi
| # | Daraja | Masala |
|---|--------|--------|
| C1 | ⛔ O'rta | **Profil sahifasi yo'q:** foydalanuvchi ismi, kursi, Telegram username'ini saytdan o'zgartira olmaydi; akkauntni o'chirish yoki ma'lumotni yuklab olish yo'q |
| C2 | ⛔ O'rta | Bronni ko'chirib bo'lmaydi (faqat bekor qilib qayta bron), dars davomiyligi qat'iy 1 soat, repetitor alohida kunni yopa olmaydi (faqat haftalik jadval) |
| C3 | ⛔ O'rta | Chat va fayl yuklash yo'q: materiallar faqat tashqi havola, zararli havolalarni avtomatik tekshirish yo'q (admin qo'lda ko'radi) |
| C4 | ⛔ O'rta | Repetitor o'z daromadi va sharhlarini ko'ra olmaydi; sharhga javob berish va «shikoyat qilish» tugmasi yo'q |
| C5 | ⛔ O'rta | Username'siz Telegram foydalanuvchiga yozib bo'lmaydi (telefon ulashgan bo'lsa ko'rinadi) |
| C6 | ⛔ Past | Katalogda sahifalash yo'q (repetitorlar 100 tagacha, materiallar 200 tagacha); qidiruv oddiy regex, ko'p ma'lumotda sekinlashadi |
| C7 | ⛔ Past | Nazorat sanalarini fayldan (CSV) ommaviy yuklash yo'q: har biri qo'lda kiritiladi |

### Texnik qarz
| # | Daraja | Masala |
|---|--------|--------|
| D1 | ⛔ O'rta | JWT `localStorage` da, amal qilish muddati 14 kun, hamma qurilmadan chiqarish yo'q (bloklangan foydalanuvchi baribir to'xtatiladi, lekin o'g'irlangan token muddatigacha ishlaydi) |
| D2 | ⛔ O'rta | Telegram bot bitta server nusxasida polling qiladi; bir nechta nusxa ishga tushsa, to'qnashadi. Kattalashganda webhook kerak |
| D3 | ⛔ O'rta | Barcha adminlar bir xil to'liq huquqda (moderator/moliyachi kabi rollar yo'q); jurnal ma'lumotlar bazasi darajasida o'zgarmas emas |
| D4 | ⛔ O'rta | Rate-limit xotirada: server qayta ishga tushsa nolga tushadi, bir nechta nusxada ishlamaydi |
| D5 | ⛔ O'rta | `react-router-dom` 6.x da 2 ta o'rtacha xavfli ogohlantirish (`npm audit`): biz foydalanuvchi bergan manzilga yo'naltirmaymiz va SSR ishlatmaymiz, shuning uchun xavf past; v7 ga o'tish keyinroq |
| D6 | ⛔ Past | UI avtotestlari, ESLint/Prettier va CI yo'q (faqat API testlari bor) |
| D7 | ⛔ Past | SEO: sahifalar uchun alohida sarlavha/OG teglar, sitemap yo'q (ijtimoiy tarmoqda havola ko'rinishi oddiy) |
| D8 | ⛔ Past | Admin panel faqat o'zbekcha; foydalanuvchi kiritgan kontent (fan nomlari, repetitor tavsiflari) tarjima qilinmaydi; ba'zi server xabarlari faqat o'zbekcha |
| D9 | ⛔ Past | Maxsus imkoniyatlar: tablar uchun klaviatura strelkalari, to'liq ekran o'quvchi sinovi o'tkazilmagan |

## 4. Nimalar qanday tekshirildi

- **Avtomatik (11 ta, `npm test`):** huquqlar (401/403), NoSQL in'ektsiya, bir vaqtdagi ikki bron, ikki marta to'lash, to'liq pul oqimi (bron → tasdiq → to'lov → admin «dars o'tdi» → repetitor hisobi → o'tkazish), sharh yashirilganda reyting qayta hisoblanishi, bloklash, o'zini bloklab bo'lmasligi, sozlamalar narxga ta'siri, yopiq ro'yxatdan o'tish, e'lon (bot yo'q), CSV himoyasi, jurnal, parol almashtirish. Test alohida vaqtinchalik bazada ishlaydi, sizning ma'lumotingizga tegmaydi.
- **Brauzerda qo'lda:** admin panelning 12 bo'limi namunaviy ma'lumot bilan ochildi (xato yo'q); repetitor anketasini sabab bilan rad etish: saqlandi, jurnalga yozildi, repetitorga Telegram xabari ketdi (soxta Telegram serverida).
- **Tekshirilmagan:** haqiqiy Telegram bot, haqiqiy to'lov, katta ekran maketida admin panel, ruscha/inglizcha admin (u o'zbekcha), yuklama ostida ishlash.

## 5. Tavsiya etilgan keyingi qadamlar

1. **Hoziroq (bu hafta):** git, `@BotFather` dan token, admin parolini almashtirish, Click va Payme'ga ariza berish (eng uzoq jarayon).
2. **Pilotgacha (1–2 hafta):** fanlar va rasmiy sanalarni kiritish, 8–10 repetitor, hosting + HTTPS, oferta va maxfiylik siyosati, profil sahifasi.
3. **Pilot davomida:** to'lov qo'lda (admin «Qo'lda to'langan» belgilaydi), har hafta «Moliya» da hisob-kitob, voronka va so'rovnomaga qarab qaror qabul qilish.
4. **Pilotdan keyin:** Click/Payme integratsiyasi, bronni ko'chirish, repetitor kabineti (daromad, sharhlar), webhook'ga o'tish, admin rollari.
