# UWEDRepo: foydalanish yo'riqnomasi

Bu hujjat loyihani **noldan boshlab ishlatish** uchun yozilgan: kompyuterda sinash, internetga chiqarish (Render), admin sifatida sozlash va har kungi ishlar. Har bir qadamda nima qilish va qanday natija kutilishi yozilgan.

## Mundarija

1. [Loyiha nima va kim nima qiladi](#1-loyiha-nima-va-kim-nima-qiladi)
2. [Kompyuterda ishga tushirish (sinov uchun)](#2-kompyuterda-ishga-tushirish-sinov-uchun)
3. [Internetga chiqarish (Render)](#3-internetga-chiqarish-render)
4. [Birinchi marta sozlash (admin)](#4-birinchi-marta-sozlash-admin)
5. [Talaba qanday foydalanadi](#5-talaba-qanday-foydalanadi)
6. [Repetitor qanday foydalanadi](#6-repetitor-qanday-foydalanadi)
7. [Admin kundalik va haftalik ishlari](#7-admin-kundalik-va-haftalik-ishlari)
8. [Pul masalasi (pilot davrida)](#8-pul-masalasi-pilot-davrida)
9. [Kodni yangilash](#9-kodni-yangilash)
10. [Muammolar va yechimlari](#10-muammolar-va-yechimlari)
11. [Xavfsizlik qoidalari](#11-xavfsizlik-qoidalari)
12. [Atamalar lug'ati](#12-atamalar-lugati)

---

## 1. Loyiha nima va kim nima qiladi

UWEDRepo: UWED talabalari uchun **repetitorlar, o'quv materiallari, nazorat sanalari va fan guruhlari** bitta saytda.

| Kim | Nima qiladi |
|---|---|
| **Talaba** | Fakultet va kursini tanlaydi, repetitor topadi, dars bron qiladi, to'laydi, baho beradi |
| **Repetitor** | Anketa to'ldiradi, bronlarni qabul qiladi, dars beradi |
| **Admin (siz)** | Anketalarni tasdiqlaydi, kontent kiritadi, pulni hisoblaydi, sozlamalarni boshqaradi |

Loyiha uch qismdan iborat:

- `client/` — sayt (ko'rinadigan qism)
- `server/` — dastur miyasi (bronlar, kirish, admin)
- MongoDB — ma'lumotlar ombori (foydalanuvchilar, bronlar va hokazo)

---

## 2. Kompyuterda ishga tushirish (sinov uchun)

Bu qism saytni **o'z kompyuteringizda** sinab ko'rish uchun. Internetga chiqarish 3-bo'limda.

### 2.1. Kerak bo'ladi

- **Node.js** (22 yoki yangiroq). Tekshirish: terminalda `node -v` yozing, `v22...` chiqishi kerak.
- **Git** (ixtiyoriy, kodni GitHub'ga yuklash uchun).

### 2.2. Qadamlar

1. Loyiha papkasida terminal oching (`D:\AI\UWEDREPO`).
2. Paketlarni o'rnating (faqat birinchi marta):

   ```bash
   npm run install:all
   ```

3. Sozlama faylini tekshiring: `server/.env`. Eng muhim satrlar:

   | Satr | Ma'nosi |
   |---|---|
   | `PORT` | Server porti |
   | `MONGODB_URI` | Baza manzili. Bo'sh bo'lsa, vaqtinchalik lokal baza ishga tushadi |
   | `TELEGRAM_BOT_TOKEN` | Bot tokeni (bo'sh bo'lsa, Telegram orqali kirish o'chiq) |
   | `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Admin akkaunti |

4. Ishga tushiring:

   ```bash
   npm run dev
   ```

5. Brauzerda oching: **http://localhost:5173**

**Natija:** terminalda `[server] http://localhost:...` va `VITE ... ready` yozuvlari chiqadi, brauzerda sayt ochiladi.

### 2.3. Sinov uchun tayyor akkauntlar

Lokal ishga tushirganda demo ma'lumotlar yoziladi:

| Rol | Email | Parol |
|---|---|---|
| Admin | `admin@uwedrepo.uz` | `Admin12345` |
| Demo repetitor | `aziza@demo.uz` | `Demo12345` |

Kirish: **Kirish** → pastdagi **«Email bilan kirish»** havolasi.

> Bu akkauntlar **faqat lokal sinov uchun**. Internetdagi (production) saytda demo akkauntlar yaratilmaydi va `Admin12345` paroli qabul qilinmaydi.

### 2.4. Telegram orqali kirishni lokal sinash

1. [@BotFather](https://t.me/BotFather) da `/newbot` yuboring va sinov boti yarating.
2. Tokenni `server/.env` dagi `TELEGRAM_BOT_TOKEN=` dan keyin yozing.
3. Serverni qayta ishga tushiring (terminalda `Ctrl+C`, so'ng `npm run dev`).
4. Terminalda `[telegram] bot ishlayapti: @... (polling)` chiqishi kerak.
5. Saytda **Ro'yxatdan o'tish** → **Telegram orqali kod olish** → botda **Start** → kod keladi → saytga kiriting.

> Lokal uchun va internetdagi sayt uchun **ikki xil bot** ishlating. Bir tokenni ikki joyda ishlatsangiz, ular bir-birining ulanishini buzadi.

### 2.5. Testlarni ishga tushirish

```bash
cd server
npm test
```

14 ta test o'tishi kerak. Testlar vaqtinchalik bazada ishlaydi, ma'lumotlaringizga tegmaydi.

---

## 3. Internetga chiqarish (Render)

Maqsad: sayt hamma uchun ochiq manzilda ishlasin (masalan `https://uwedrepo.onrender.com`).

Kod GitHub'da: `UzbekinUz/uwedrepo`. Kerak bo'ladigan uchta xizmat: **GitHub** (kod), **MongoDB Atlas** (baza), **Render** (server).

### 3.1. MongoDB Atlas (baza) bilan ulanish satrini olish

Klasteringiz tayyor bo'lsa, quyidagilarni tekshiring:

1. **Database Access:** foydalanuvchi yaratilgan (nom + kuchli parol).
2. **Network Access:** `0.0.0.0/0` (hamma joydan) ruxsat berilgan.
3. **Connect → Drivers** dan ulanish satrini nusxalang. U shunday ko'rinadi:

   ```
   mongodb+srv://FOYDALANUVCHI:PAROL@cluster0.xxxxx.mongodb.net/uwedrepo?retryWrites=true&w=majority
   ```

4. **Juda muhim:** `.mongodb.net/` dan keyin `uwedrepo` (baza nomi) bo'lsin. `<password>` o'rniga **haqiqiy parolingizni** yozing (burchakli qavslarsiz).

### 3.2. Production uchun alohida bot oching

[@BotFather](https://t.me/BotFather) → `/newbot`. Tokenni saqlab qo'ying: Render'ga kiritiladi.

### 3.3. Render'da joylashtirish

1. [render.com](https://render.com) ga GitHub orqali kiring.
2. **New +** → **Blueprint**.
3. GitHub repozitoriyingizni tanlang (`uwedrepo`). Agar ko'rinmasa, **Configure account** orqali Render'ga repozitoriyga ruxsat bering.
4. Render `render.yaml` faylini topadi va quyidagi qiymatlarni so'raydi:

   | Maydon | Nima yozish |
   |---|---|
   | `MONGODB_URI` | 3.1 dagi ulanish satri |
   | `ADMIN_EMAIL` | O'zingizning email (admin kirishi uchun) |
   | `ADMIN_PASSWORD` | Kuchli parol, kamida 10 belgi. `Admin12345` **qabul qilinmaydi** |
   | `TELEGRAM_BOT_TOKEN` | 3.2 dagi production bot tokeni |

5. **Apply** tugmasini bosing. Birinchi qurilish 3–5 daqiqa oladi.

**Natija:** Render sahifasida `Live` yozuvi chiqadi va yuqorida sayt manzili ko'rinadi.

### 3.4. Joylashtirish to'g'ri o'tganini tekshirish

1. Render → xizmatingiz → **Logs**. Quyidagilar bo'lishi kerak:
   - `[db] ulandi`
   - `[telegram] bot ishlayapti: @... (webhook)`
   - `[server] http://localhost:...`
2. Brauzerda `https://SIZNING-MANZIL/api/health` oching. Javob: `{"ok":true}`.
3. Bosh sahifani oching: sayt chiqishi kerak. Hammasi 0 bo'lishi normal: kontentni siz kiritasiz (4-bo'lim).

### 3.5. Tarif haqida

- **Free:** 15 daqiqa hech kim kirmasa uxlaydi. Keyingi birinchi kirish 30–60 soniya sekin bo'ladi.
- **Starter (pullik):** uxlamaydi. **Pilot uchun tavsiya etiladi.** O'zgartirish: `render.yaml` da `plan: starter`, so'ng GitHub'ga yuklang. Narxni Render sahifasidan tekshiring.

---

## 4. Birinchi marta sozlash (admin)

Sayt ochilgach, hammasi bo'sh: fan ham, sana ham, repetitor ham yo'q. Hammasini admin boshqaradi. Quyidagilarni qiling.

### 4.1. Admin sifatida kirish

1. Saytda **Kirish** → **Email bilan kirish**.
2. `ADMIN_EMAIL` va `ADMIN_PASSWORD` ni kiriting.
3. Yuqori menyuda **Admin** chiqadi, bosing.

### 4.2. Yo'riqnomani o'qing

Admin panelda oxirgi bo'lim **«Yo'riqnoma»**: har bir bo'limning vazifasi va kunlik/haftalik ishlar tartibi yozilgan.

### 4.3. «Umumiy» bo'limidagi tayyorlik ro'yxatini bajaring

**Admin → Umumiy** da «Pilotga tayyorlik» ro'yxati bor. Har bir bajarilmagan punkt yonida **«O'tish»** tugmasi turadi. Tartib:

| Qadam | Qayerda | Nima qilish |
|---|---|---|
| 1 | Sozlamalar → Parolni almashtirish | Parolni almashtiring (agar oddiy parol qo'ygan bo'lsangiz) |
| 2 | Kontent → Fanlar | Boshqa fakultetlarning fanlarini qo'shing. Har bir fanga **Telegram guruh havolasini** kiriting |
| 3 | Kontent → Nazorat sanalari | **Rasmiy** oraliq va yakuniy sanalarni kiriting |
| 4 | Repetitorlar | Kelgan anketalarni tasdiqlang (maqsad: 8–10 ta repetitor) |
| 5 | Kontent → Materiallar | Birinchi o'quv materiallarini qo'shing/tasdiqlang |
| 6 | Tadqiqot | So'rovnoma havolasini tarqating (maqsad: kamida 30 ta javob) |

### 4.4. Fanlarni boshqarish (qo'shish, o'zgartirish, yashirish)

Talaba saytda **faqat siz kiritgan fanlarni** ko'radi. Hammasi **Admin → Kontent → Fanlar** bo'limida.

**Yangi fan qo'shish (bittadan):**

1. **Admin → Kontent → Fanlar** → **«Bitta fan qo'shish»**.
2. To'ldiring: **Nomi**, **Fakultet** (hamma talabaga chiqsin desangiz «Hamma fakultet»), **Turi** (asosiy yoki qo'shimcha), **Qaysi kurslarda o'qitiladi**. Telegram guruh havolasini va qisqa tavsifni ham kiritishingiz mumkin.
3. **«Qo'shish»** tugmasini bosing.

**Natija:** fan darhol saytdagi «Fanlar» sahifasida (tegishli fakultet va kurs talabalariga) ko'rinadi.

**Ko'p fanni birdan qo'shish:**

1. **«Bir nechta fan qo'shish»** tabini tanlang.
2. Maydonga fan nomlarini **har bir qatorga bittadan** yozing.
3. Fakultet, tur va kurslarni tanlang (hammasi uchun bir xil bo'ladi).
4. **«N ta fanni qo'shish»** ni bosing. Allaqachon bor nomlar o'zi o'tkazib yuboriladi, ekranda nechtasi qo'shilgani va qaysilari o'tkazilgani yoziladi.

Guruh havolasini keyin har bir fan uchun alohida kiritasiz (**Tahrirlash**).

**Mavjud fanni boshqarish** (ro'yxatdagi tugmalar):

| Tugma | Nima qiladi | Qachon |
|---|---|---|
| **Tahrirlash** | Nomi, fakulteti, kursi, guruh havolasini o'zgartiradi | Xato yoki yangi ma'lumot |
| **Yashirish** | Fanni talabalardan olib qo'yadi. Repetitorlari, sanalari va materiallari **saqlanadi** | Semestr tugadi, fan vaqtincha kerak emas |
| **Ko'rsatish** | Yashirilgan fanni qaytaradi | Yangi semestr |
| **O'chirish** | Fanni **va unga bog'liq sanalar bilan materiallarni** butunlay o'chiradi | Fan butunlay kerak emas (qaytarib bo'lmaydi) |

Ro'yxatda har bir fanning **repetitor, nazorat sanasi va material soni** ko'rinadi. **Repetitor soni 0** bo'lsa (sariq raqam), talaba bu fanni tanlasa hech kimni topolmaydi: shu fanga repetitor qidiring.

> Tavsiya: fanni o'chirishdan oldin **«Yashirish»** ni sinab ko'ring. U xavfsizroq.

### 4.5. Sozlamalar

**Admin → Sozlamalar:**

- **Komissiya, %:** platforma ulushi (hozir 10).
- **Birinchi dars chegirmasi, %:** yangi talabaga (hozir 20).
- **Bekor qilish muddati, soat:** shu muddatdan oldin bekor qilsa, pul qaytariladi (hozir 24).
- **Ro'yxatdan o'tishni yopish:** spam bo'lganda foydali.
- **Saytning yuqori xabari:** hamma sahifada ko'rinadi (masalan «Pilot rejim»).

O'zgarish **darhol** kuchga kiradi (yangi bronlar uchun).

### 4.6. Odamlarni jalb qilishda foydali hiyla

Havolalarga `?ref=nom` qo'shing:

```
https://SIZNING-MANZIL/?ref=0-9a-guruh
https://SIZNING-MANZIL/?ref=fakultet-kanali
```

Admin → Umumiy → «Tashrif manbalari» da qaysi chatdan nechta odam kelgani ko'rinadi.

---

## 5. Talaba qanday foydalanadi

### 5.1. Ro'yxatdan o'tish (parolsiz)

1. Saytda **Ro'yxatdan o'tish**.
2. Fakultet va kursni tanlang.
3. **«Telegram orqali kod olish»** tugmasini bosing. Telegram boti ochiladi.
4. Botda **Start** tugmasini bosing. Bot 6 xonali kod yuboradi.
5. Saytga qaytib, kodni kiriting va **Tasdiqlash** ni bosing.

**Natija:** akkaunt yaratildi, ismingiz va Telegram username'ingiz ulandi. Parol kerak emas.

Kod 10 daqiqa amal qiladi, bir marta ishlatiladi. 5 marta xato kiritsangiz, yangi kod oling.

### 5.2. Repetitor topish va bron qilish

1. **Repetitorlar** sahifasida filtrlang: fan, narx, format, til.
2. Repetitorning kartasini bosing: tajriba, sharhlar, bo'sh vaqtlar ko'rinadi.
3. O'ng tomonda **fan** va **bo'sh soatni** tanlang.
4. **«Darsga yozilish»** ni bosing.

**Natija:** bron «Kutilmoqda» holatida yuboriladi, repetitorga Telegram xabari boradi.

### 5.3. Bron holatlari

| Holat | Nima degani | Talaba nima qiladi |
|---|---|---|
| Kutilmoqda | Repetitor hali javob bermadi | Kutadi (xohlasa bekor qiladi) |
| To'lov kutilmoqda | Repetitor tasdiqladi | To'laydi (8-bo'limga qarang) |
| To'langan | To'lov qabul qilindi | Dars vaqtida repetitorga yozadi |
| O'tgan | Dars bo'ldi | Baho va sharh qoldiradi |
| Bekor qilingan | Bekor qilindi | — |

### 5.4. Bekor qilish qoidasi

To'langan darsni boshlanishiga **24 soatdan ko'p** (sozlamada o'zgaradi) qolganda bekor qilsangiz, to'lov qaytariladi. Kamroq qolsa, qaytarilmaydi. Repetitor rad etsa, pul **har doim** qaytariladi.

### 5.5. Baho berish

**Darslarim** → o'tgan dars → **«Baho berish»**. Faqat dars o'tgandan keyin va bitta bronga bitta baho mumkin.

### 5.6. Boshqa imkoniyatlar

- **Nazoratlar:** kalendarda sanalar va «necha kun qoldi».
- **Materiallar:** konspekt, test, video. O'zingiz ham havola ulashishingiz mumkin (admin tekshirgach chiqadi).
- **Fan sahifasi:** Telegram muhokama guruhiga qo'shilish tugmasi.
- **Til:** tepada o'zbek, rus, ingliz tanlash.

---

## 6. Repetitor qanday foydalanadi

### 6.1. Anketa yuborish

1. Telegram orqali ro'yxatdan o'ting (5.1).
2. Menyuda **«Repetitor bo'lish»**.
3. To'ldiring: qisqa sarlavha, o'zingiz haqingizda, tajriba, **soatlik narx**, fanlar, format, dars tili, **Telegram username**, haftalik bo'sh vaqtlar.
4. **«Anketani yuborish»**.

> Haftalik vaqtlarni albatta kiriting: aks holda talaba bron qila olmaydi.

**Natija:** anketa «Kutilmoqda». Admin tasdiqlagach katalogda ko'rinasiz va Telegramga xabar keladi. Rad etilsa, **sabab** ham yoziladi; anketani yangilab qayta yuborasiz.

### 6.2. Bronlarni boshqarish

**Repetitor paneli → Bronlar:**

| Holat | Siz nima qilasiz |
|---|---|
| Kutilmoqda | **Tasdiqlash** yoki **Rad etish** |
| To'langan | Dars bo'lgach **«Dars o'tdi»** |

Har bir bronda **sizning ulushingiz** ko'rinadi (summa minus komissiya). Tasdiqlangan bronda talabaning Telegram'i ochiladi.

---

## 7. Admin kundalik va haftalik ishlari

### 7.1. Har kuni (5 daqiqa)

1. **Admin → Umumiy:** sariq «tasdig'ingizni kutayotgan narsalar» bormi?
2. **Repetitorlar:** yangi anketani o'qing → **Tasdiqlash** yoki sabab yozib **Rad etish**.
3. **Kontent → Materiallar:** yangi havolani **ochib ko'rib** tasdiqlang.
4. **Bronlar:** uzoq vaqt «To'lov kutilmoqda» da turganlar, shikoyatlar.

### 7.2. Haftada bir marta

1. **Moliya:** «Repetitorlarga berilishi kerak» summani ko'ring. Pulni bank orqali o'zingiz o'tkazing, so'ng shu qatordagi **«O'tkazildi»** ni bosing.
2. **Umumiy → Voronka:** qayerda odamlar to'xtab qolmoqda?
3. **Umumiy → «Repetitori yo'q fanlar»:** shu fanlar uchun repetitor qidiring.
4. **CSV eksport:** foydalanuvchilar, bronlar, hisobni yuklab saqlab qo'ying (zaxira).

### 7.3. Kerak bo'lganda

| Vaziyat | Qayerda | Nima qilish |
|---|---|---|
| Buzg'unchi foydalanuvchi | Foydalanuvchilar → Batafsil | **Bloklash** |
| Haqoratli sharh | Sharhlar | **Yashirish** |
| Sana o'zgardi | Kontent → Nazorat sanalari | **Tahrirlash** |
| Hammaga xabar | Xabarlar | Matn yozib **Yuborish** |
| Texnik ish bor | Sozlamalar → Yuqori xabar | Xabar yozib yoqing |
| Kim nima qilgani | Jurnal | Amal turi bo'yicha filtr |

### 7.4. Yangi admin qo'shish

**Foydalanuvchilar** → odamni toping → **Batafsil** → **«Admin qilish»**. Faqat ishongan odamga bering.

---

## 8. Pul masalasi (pilot davrida)

**Hozir to'lov tizimi test rejimida: haqiqiy pul yechilmaydi.** Click va Payme keyinroq ulanadi (shartnoma kerak).

Pilotda tavsiya etilgan tartib:

1. Repetitor bronni **tasdiqlaydi**.
2. Talaba pulni **repetitorga (yoki sizga) to'g'ridan-to'g'ri** to'laydi (naqd yoki o'tkazma).
3. Talaba saytda **«To'lash»** tugmasini **faqat haqiqatan to'lagandan keyin** bosadi. Yoki admin **Bronlar → «Qo'lda to'langan»** ni bosadi.
4. Dars o'tgach repetitor (yoki admin) **«Dars o'tdi»** ni bosadi.
5. Haftada bir marta **Moliya** bo'limida hisob-kitob qilinadi.

> Talabalarga aniq ayting: «To'lash» tugmasi pulni o'zi yechmaydi, faqat to'lov bo'lganini belgilaydi.

---

## 9. Kodni yangilash

Sayt kodini o'zgartirsangiz (yoki men o'zgartirsam):

```bash
git add -A
git commit -m "nima o'zgardi"
git push
```

`git push` dan keyin Render **o'zi** qayta joylashtiradi (3–5 daqiqa). Hech narsa qo'lda bosish shart emas.

Kod o'zgargandan keyin, yuklashdan oldin testlarni ishga tushiring: `cd server && npm test`.

---

## 10. Muammolar va yechimlari

| Belgi | Sabab | Yechim |
|---|---|---|
| Lokal: `EADDRINUSE` (port band) | Eski server ochiq qolgan | Eski terminalni yoping yoki `.env` da `PORT` ni o'zgartiring |
| Lokal: sayt ochiladi, lekin ma'lumot yo'q | Server ishlamayapti | `npm run dev` terminalida xatoni o'qing |
| Lokal: Telegram'da bot javob bermaydi | Token xato yoki ikkinchi joyda ishlayapti | Tokenni tekshiring, boshqa serverni to'xtating |
| Render: `MONGODB_URI majburiy` | O'zgaruvchi kiritilmagan | Render → Environment ga kiriting |
| Render: `MongoServerSelectionError` | Atlas'da IP/parol/URL xato | `0.0.0.0/0`, parol, `/uwedrepo` ni tekshiring |
| Render: `ADMIN_PASSWORD o'zgartirilishi shart` | Parol bo'sh yoki `Admin12345` | Boshqa parol qo'ying |
| Sayt juda sekin ochiladi | Free tarif uxlab qolgan | Bir marta kuting yoki Starter tarifga o'ting |
| Sayt ochiladi, lekin bo'sh | Normal holat | 4.3 dagi kontentni kiriting |
| Bot production'da jim | Token xato, yoki lokal shu token bilan ishlayapti | `https://api.telegram.org/bot<TOKEN>/getWebhookInfo` da `url` saytingizniki bo'lishi kerak |
| Admin paroli esdan chiqdi | — | Render → Environment da `ADMIN_PASSWORD` ni o'zgartirib qayta joylang. Eslatma: avval yaratilgan admin paroli bazada qoladi; Atlas'da `users` ichidan admin hujjatini o'chirsangiz, yangi parol bilan qayta yaratiladi |

Hali yechilmasa: Render → **Logs** dagi oxirgi qizil qatorlarni menga yuboring (tokenlarsiz).

---

## 11. Xavfsizlik qoidalari

- `.env` faylini, bot tokenini, Atlas parolini **hech qachon** GitHub'ga, chatga yoki skrinshotga qo'ymang.
- Token oshkor bo'lsa: BotFather → `/revoke` → yangi token → Render'da yangilang.
- **GitHub repozitoriy yopiq (Private) bo'lsin.** Hozir u ochiq. Yopish: GitHub → repozitoriy → **Settings** → eng pastda **Danger Zone** → **Change visibility** → **Private**. Render yopiq repozitoriyni ham o'qiy oladi (GitHub ruxsati berilgan bo'lsa).
- Admin huquqini faqat ishongan odamga bering. Parolni hech kimga aytmang.
- Telegram kodini hech kimga bermang (xodimlar ham so'ramaydi).
- CSV fayllarda shaxsiy ma'lumot bor: begonalarga yubormang.
- Bloklash va sharhni yashirish: faqat qoida buzilganda.

---

## 12. Atamalar lug'ati

| Atama | Ma'nosi |
|---|---|
| **Admin** | Saytni boshqaradigan odam (siz) |
| **Anketa** | Repetitorning o'zi haqidagi ariza |
| **Bron** | Darsga yozilish so'rovi |
| **Komissiya** | Platformaning to'lovdan oladigan ulushi (hozir 10%) |
| **Repetitor ulushi** | To'lov summasidan komissiya ayirilgani |
| **Moderatsiya** | Admin tekshiruvi (anketa, material, sharh) |
| **Voronka** | Odamlar bosqichi: kirdi → ro'yxatdan o'tdi → bron qildi → to'ladi |
| **Konversiya** | To'laganlar ÷ saytga kirganlar |
| **Webhook** | Telegram xabarni serverga o'zi yuboradigan usul (internetdagi sayt uchun) |
| **Polling** | Server Telegramdan xabarni o'zi so'raydigan usul (lokal uchun) |
| **Deploy** | Saytni internetga chiqarish |
| **Atlas** | MongoDB bazasining bulutdagi xizmati |
| **Render** | Serverni internetda ishlatadigan xizmat |
| **Pilot** | UWEDda 4 haftalik sinov |
| **CSV** | Excel'da ochiladigan jadval fayli |
