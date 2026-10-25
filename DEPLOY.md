# UWEDRepo ni Render'ga joylashtirish

Bitta Render xizmati ham saytni, ham API'ni tarqatadi. Baza MongoDB Atlas'da (Render o'zida MongoDB bermaydi). Hammasi bepul tariflarda boshlanadi.

Kerak bo'ladi: GitHub akkaunti, [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register) akkaunti, [Render](https://render.com) akkaunti, Telegram bot tokeni.

## 1. MongoDB Atlas (baza)

1. Atlas'da **Create** → **M0 (Free)** klaster. Provayder AWS, hudud **Frankfurt (eu-central-1)**: Render ham Frankfurt'da.
2. **Database Access** → **Add New Database User**: nom va **kuchli parol** (parolda `@ : / ?` kabi belgilar bo'lmasin, aks holda ularni URL-kodlash kerak). Huquq: *Read and write to any database*.
3. **Network Access** → **Add IP Address** → **Allow access from anywhere** (`0.0.0.0/0`). Render'ning bepul tarifida chiquvchi IP o'zgaruvchan, shuning uchun kuchli parol shart.
4. **Connect** → **Drivers** → ulanish satrini nusxalang va **baza nomini qo'shing**:

   ```
   mongodb+srv://FOYDALANUVCHI:PAROL@cluster0.xxxxx.mongodb.net/uwedrepo?retryWrites=true&w=majority
   ```

   Muhim: `.net/` dan keyin `uwedrepo` bo'lishi kerak. Aks holda ma'lumot `test` bazasiga yoziladi.

## 2. GitHub (kod)

Loyiha papkasida:

```bash
git remote add origin https://github.com/SIZNING-NOM/uwedrepo.git
git push -u origin main
```

Repozitoriyni **yopiq (Private)** qiling. `.env` fayllari `.gitignore` da, ular yuklanmaydi. Yuklashdan oldin tekshiring: `git ls-files | grep -i env` faqat `.env.example` ni ko'rsatsin.

## 3. Telegram bot

[@BotFather](https://t.me/BotFather) → `/newbot`. **Production uchun alohida bot oching**, lokal sinov uchun boshqasini. Bir tokenni ikki joyda ishlatmang: lokal server ishga tushganda webhook'ni o'chiradi va production bot jim qoladi.

## 4. Render

1. **New +** → **Blueprint** → GitHub repozitoriyingizni tanlang. Render `render.yaml` ni topadi.
2. So'ralgan qiymatlarni kiriting:

   | O'zgaruvchi | Qiymat |
   |---|---|
   | `MONGODB_URI` | Atlas ulanish satri (1-qadam) |
   | `ADMIN_EMAIL` | Admin emaili |
   | `ADMIN_PASSWORD` | Kamida 10 belgi; `Admin12345` qabul qilinmaydi |
   | `TELEGRAM_BOT_TOKEN` | Production botning tokeni |

   `JWT_SECRET` ni Render o'zi yaratadi.
3. **Apply**. Birinchi build 3–5 daqiqa oladi.

## 5. Ishga tushgandan keyin

1. Loglarda ko'ring: `[telegram] bot ishlayapti: @... (webhook)` va `[server] http://localhost:...`.
2. Saytni oching (`https://uwedrepo.onrender.com` yoki Render bergan manzil).
3. **Kirish → Email bilan kirish**: `ADMIN_EMAIL` va `ADMIN_PASSWORD`. So'ng **Admin panel → Umumiy**: «Pilotga tayyorlik» ro'yxati nima qolganini ko'rsatadi.
4. Sayt to'liq bo'sh boshlanadi: fanlarni admin o'zi kiritadi (**Admin → Kontent → Fanlar**: bitta yoki bir nechtasini birdan qo'shish, yoki «Namuna fanlarni qo'shish» tugmasi). So'ng rasmiy nazorat sanalari, Telegram guruh havolalari va repetitorlarni kiriting.
5. Telegram orqali kirishni sinab ko'ring (bot Start, kod).
6. Botni tekshirish (token o'rniga o'zingiznikini qo'ying): `https://api.telegram.org/bot<TOKEN>/getWebhookInfo` manzilida `url` sizning saytingizning `/api/telegram/webhook` manzili bo'lishi kerak.

## Tarif haqida

- **Render Free:** 15 daqiqa harakatsizlikdan keyin xizmat uxlaydi, birinchi so'rov taxminan 30–60 soniya kutadi. Telegram webhook uni uyg'otadi, lekin foydalanuvchi sekinlikni sezadi. Pilot uchun pullik **Starter** tarifi tavsiya etiladi (`render.yaml` da `plan: starter`). Narxni Render sahifasidan tekshiring.
- **Atlas M0:** bepul, 512 MB. Pilot uchun yetarli.

## Yangilash va domen

- Kodni o'zgartirib `git push` qilsangiz, Render o'zi qayta joylaydi (`autoDeploy`).
- O'z domeningiz: Render → **Settings → Custom Domains**, DNS'da CNAME. Keyin `PUBLIC_URL` o'zgaruvchisini yangi manzilga (`https://domen.uz`) o'rnating: Telegram havolalari va webhook shunga ko'chadi.

## Muammolar

| Belgi | Sabab va yechim |
|---|---|
| Logda `MONGODB_URI majburiy` | Render'da o'zgaruvchi kiritilmagan |
| `MongoServerSelectionError` | Atlas'da IP ruxsati (`0.0.0.0/0`), parol yoki URL noto'g'ri |
| `ADMIN_PASSWORD o'zgartirilishi shart` | Parol bo'sh yoki `Admin12345` |
| Bot javob bermaydi | Token xato, yoki boshqa joyda (lokal) shu token bilan polling ishga tushgan. `getWebhookInfo` ni ko'ring |
| Sayt ochiladi, lekin bo'sh | Normal: kontentni admin paneldan kiriting |
| Birinchi ochilish juda sekin | Free tarif uxlab qolgan edi |

## Xavfsizlik

- `.env`, token va parollarni hech qachon repozitoriyga, chatga yoki skrinshotga qo'ymang. Token oshkor bo'lsa, BotFather'da `/revoke`.
- Admin parolini darhol kuchli qiling va faqat ishongan odamga admin huquqini bering.
- Atlas parolini hech kimga bermang; `0.0.0.0/0` ruxsati faqat kuchli parol bilan xavfsiz.
