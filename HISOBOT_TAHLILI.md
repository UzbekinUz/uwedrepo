# UWEDRepo — hisobot tahlili: kamchiliklar va ularning yechimi

Manba: «EduMarket — startap loyiha bo'yicha hisobot» (nomi UWEDRepo ga o'zgartirilgan).

## A. Hisobotdagi kamchiliklar (hujjat darajasida)

| # | Kamchilik | Nega muammo | Yechim / holat |
|---|-----------|-------------|----------------|
| 1 | Customer Development, TAM/SAM/SOM, pilot jadvali — hammasi `[__]` bo'sh | Hisobotning isbotlovchi qismi yo'q; g'oya tekshirilmagan | Saytga **so'rovnoma** (`/survey`) va **admin ko'rsatkichlar paneli** qo'shildi: raqamlar real ma'lumotdan avtomatik hisoblanadi, TAM/SAM/SOM kalkulyatori so'rovnomadagi o'rtacha byudjetni oladi. **Raqamlarni haqiqiy so'rov o'tkazib to'ldirish kerak** — kodda to'qima raqam yo'q |
| 2 | «1,3 mln talaba» manbasiz, o'zi «taxminiy» deb yozilgan | Taqdimotda ishonchni tushiradi | stat.uz / Oliy ta'lim vazirligidan aniq raqam va yilini yozing (kalkulyatorda qo'lda o'zgartiriladi) |
| 3 | Komissiya foizi `[__]%` | Biznes modelning asosiy raqami yo'q | Sozlanadigan qilindi: `COMMISSION_PERCENT` (standart 10%); har bronda komissiya va repetitor ulushi saqlanadi. Yakuniy foizni pilot natijasiga qarab tanlang |
| 4 | «Pilot — Telegram orqali, server yo'q» | Bron/anketa yo'qolishi mumkin, ko'rsatkichlarni o'lchab bo'lmaydi («Telegramga kelgan xabarlar» — qo'lda sanash) | To'liq backend: bron, tasdiqlash, to'lov holati, tashriflar hisobi |
| 5 | Maqsadlar noaniq: «Saytga kirgan», «Konversiya», «Qayta dars» — `[__]` | Pilot muvaffaqiyati o'lchovsiz | Admin panelda har bir ko'rsatkich formulasi bilan, hisobotdagi maqsadlar (30–50, 8–10, 4+) yonida ko'rsatiladi |
| 6 | Faqat 1 fakultet fanlari berilgan (3 fakultet e'lon qilingan) | Boshqa fakultet talabasi bo'sh sayt ko'radi | Fanlarni admin paneldan kiritish imkoni. **Boshqa 2 fakultet fanlari va rasmiy nazorat sanalarini kiritish — sizning vazifangiz** (demo sanalar «Demo sana» deb belgilangan) |
| 7 | «Faqat haqiqiy o'quvchilar baho qo'yadi» — mexanizmi tasvirlanmagan | Asosiy ishonch va'dasi bajarilmaydi | Baho faqat **o'tgan (completed) bron** egasiga beriladi, bron bo'yicha 1 ta sharh (serverda majburiy) |
| 8 | Repetitor sifat nazorati yo'q (talaba-repetitorlar o'zi ro'yxatdan o'tadi) | Past sifat, firibgarlik xavfi | Admin **tasdiqlash (moderatsiya)** — tasdiqlanmaguncha katalogda ko'rinmaydi; «Tavsiya» belgisi |
| 9 | Bekor qilish, qaytarish (refund) qoidalari yo'q | To'lov nizolari | Qoida: to'langan darsni talaba 24 soatdan oldin bekor qilsa — qaytariladi; repetitor rad etsa — har doim qaytariladi |
| 10 | Aloqa maxfiyligi: repetitor Telegram'i hammaga ochiq bo'lishi mumkin edi | Spam, shaxsiy ma'lumot | Telegram faqat **tasdiqlangan bronda** ikki tomonga ochiladi |
| 11 | Click/Payme «orqali» deyilgan, lekin shartnoma/litsenziya haqida gap yo'q | Haqiqiy to'lov qabul qilish uchun merchant shartnomasi, oferta va soliq masalasi kerak | To'lov qatlami `payments.js` da ajratilgan (hozir **mock** — pul yechilmaydi). Ulash uchun Click/Payme merchant kalitlari kerak. Yuridik: oferta, maxfiylik siyosati, repetitorlarning soliq maqomi |
| 12 | Til muammosi (o'zbekcha kontent) — filtr yo'q edi | Hisobotdagi asosiy muammoga yechim yetarli emas | Repetitorlar **dars tili** (uz/ru/en) bo'yicha filtrlanadi |
| 13 | Raqobatchi tahlilida narx/tashrif/hajm ma'lumoti yo'q | Solishtirish sifatsiz | Hisobotga 2–3 raqobatchining haqiqiy narxini qo'shing (qo'lda, men to'qimadim) |
| 14 | Hisobot ichida o'zaro nomuvofiqlik: «mobil ilova» dizayni bor, sayt esa mobil-moslashuvchan | Ortiqcha ish va chalkashlik | MVP — **responsive veb**; mobil ilova — pilotdan keyin. Hisobotda shunday ifodalang |
| 15 | Eski «Texnik rivojlanish» rejasi Firebase/Supabase | Siz tanlagan stek: MongoDB + Express + React | Hisobotdagi bandni yangilang: MERN backend allaqachon qurildi |

## B. Qo'shilgan yangi imkoniyatlar (hisobotda yo'q edi)

- **Haqiqiy bo'sh slotlar**: repetitor haftalik jadval beradi, talaba keyingi 14 kundan soatni tanlaydi; band vaqtga ikki marta bron qilib bo'lmaydi.
- **Birinchi dars chegirmasi** (`FIRST_LESSON_DISCOUNT`, standart 20%) — avtomatik hisoblanadi.
- **Bron hayot sikli**: kutilmoqda → tasdiqlandi → to'landi → o'tdi → baholandi (+ bekor qilish).
- **Repetitor paneli**: anketa, jadval, kelgan bronlarni tasdiqlash/rad etish, «dars o'tdi».
- **Material ulashish + moderatsiya**: talabalar havola yuboradi, admin tasdiqlaydi.
- **Admin panel**: pilot ko'rsatkichlari, so'rovnoma natijalari, TAM/SAM/SOM, repetitor/material moderatsiyasi, fan va nazorat sanalari CRUD.
- **Xavfsizlik**: parollar bcrypt, JWT, rate-limit, helmet, kiruvchi ma'lumotlar zod bilan tekshiriladi, rollar serverda tekshiriladi.

## C. Hali qilinmagan (keyingi bosqich)

1. Haqiqiy Click/Payme integratsiyasi (merchant shartnomasi kerak).
2. Sayt ichida chat, fayl yuklash (hozir materiallar — tashqi havola).
3. Email/Telegram bot orqali bildirishnomalar (bron tasdiqlandi, dars eslatmasi).
4. Rus/ingliz interfeys tili.
5. Repetitor shaxsini tasdiqlash (talaba guvohnomasi) va nizolarni hal qilish jarayoni.
6. Avtomatik testlar va deploy (Docker, MongoDB Atlas).
