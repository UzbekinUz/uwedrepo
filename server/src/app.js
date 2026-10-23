import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import compression from 'compression';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from './config.js';
import { errorHandler } from './middleware/util.js';
import auth from './routes/auth.js';
import catalog from './routes/catalog.js';
import tutors from './routes/tutors.js';
import bookings from './routes/bookings.js';
import admin from './routes/admin/index.js';
import pub from './routes/public.js';
import { handleUpdate, webhookPath, webhookSecret } from './telegram.js';

/** Express ilovasini yig'adi (DB ulanishsiz): sinash va ishga tushirish uchun umumiy */
export function createApp() {
const app = express();
app.set('trust proxy', 1);
// ?a[$ne]=x kabi ichma-ich so'rovlar Mongo operatoriga aylanmasligi uchun (NoSQL injection)
app.set('query parser', 'simple');
app.use(compression());
// CSP: faqat o'z manzilimiz; Google Fonts va React/Framer Motion ishlatadigan inline style (atribut) ruxsat etiladi
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
        imgSrc: ["'self'", 'data:'],
        connectSrc: ["'self'"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        frameAncestors: ["'none'"],
        formAction: ["'self'"],
      },
    },
  })
);
app.use(cors({ origin: config.clientOrigin }));
app.use(express.json({ limit: '100kb' }));

const limiter = (max) => rateLimit({ windowMs: 15 * 60e3, max, standardHeaders: true, legacyHeaders: false, message: { error: "Juda ko'p so'rov, birozdan keyin urinib ko'ring" } });

app.get('/api/health', (_req, res) => res.json({ ok: true }));

// Telegram webhook (production): faqat maxfiy sarlavha to'g'ri bo'lsa qabul qilinadi
app.post(webhookPath, (req, res) => {
  if (!config.telegramToken) return res.status(404).end();
  if (req.get('x-telegram-bot-api-secret-token') !== webhookSecret()) return res.status(403).end();
  res.status(200).end(); // Telegram'ga darhol javob beramiz, qayta ishlash orqa fonda
  handleUpdate(req.body).catch((e) => console.error('[telegram] webhook:', e.message));
});
// Tezlik cheklovi faqat kirish urinishlariga. /auth/me (har sahifada) va Telegram holat so'rovi (har 2 soniyada)
// cheklanmasligi kerak: aks holda bitta IP'dagi (masalan universitet wifi) talabalar tizimdan chiqib ketadi.
app.post(['/api/auth/login', '/api/auth/register'], limiter(60));
app.post(['/api/auth/telegram/start', '/api/auth/telegram/verify'], limiter(300));
app.get('/api/auth/telegram/status/:token', limiter(1500));
app.use('/api/auth', auth);
app.use('/api/bookings', bookings);
app.use('/api/tutors', tutors);
app.use('/api/admin', admin);
// Cheklov faqat yozuvchi ochiq yo'llarga (ommaviy katalog GET so'rovlari cheklanmaydi)
app.use(['/api/survey', '/api/track'], limiter(300));
app.use('/api', pub);
app.use('/api', catalog);
app.use('/api', (_req, res) => res.status(404).json({ error: 'Topilmadi' }));

// Productionda tayyor saytni (client/dist) shu serverning o'zi tarqatadi: bitta manzil, CORS muammosiz
const dist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../client/dist');
if (fs.existsSync(path.join(dist, 'index.html'))) {
  app.use(
    express.static(dist, {
      index: false,
      setHeaders: (res, file) => {
        // Vite fayl nomiga hash qo'shadi: assets/ ni uzoq keshlash mumkin; index.html esa har safar yangilanadi
        res.setHeader('Cache-Control', file.includes(`${path.sep}assets${path.sep}`) ? 'public, max-age=31536000, immutable' : 'public, max-age=3600');
      },
    })
  );
  app.get('*', (_req, res) => {
    res.setHeader('Cache-Control', 'no-cache');
    res.sendFile(path.join(dist, 'index.html'));
  });
}
app.use(errorHandler);
return app;
}
