import 'dotenv/config';

const isProd = process.env.NODE_ENV === 'production';
if (isProd && !process.env.JWT_SECRET) throw new Error('JWT_SECRET majburiy (production)');
// Productionda lokal vaqtinchalik baza (mongodb-memory-server) yo'q: haqiqiy MongoDB (Atlas) kerak
if (isProd && !process.env.MONGODB_URI) throw new Error("MONGODB_URI majburiy (production): MongoDB Atlas ulanish satrini kiriting");
// Production'da standart admin parolini ishlatib bo'lmaydi
if (isProd && (!process.env.ADMIN_PASSWORD || process.env.ADMIN_PASSWORD === 'Admin12345')) throw new Error("ADMIN_PASSWORD o'zgartirilishi shart (production)");

export const config = {
  isProd,
  port: Number(process.env.PORT) || 5000,
  mongoUri: process.env.MONGODB_URI || '',
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-me',
  // Ochiq manzil: Render o'zi RENDER_EXTERNAL_URL beradi. Telegram xabarlaridagi havolalar va webhook shundan olinadi.
  publicUrl: (process.env.PUBLIC_URL || process.env.RENDER_EXTERNAL_URL || '').replace(/\/$/, ''),
  clientOrigin: process.env.CLIENT_ORIGIN || process.env.PUBLIC_URL || process.env.RENDER_EXTERNAL_URL || 'http://localhost:5173',
  commission: Number(process.env.COMMISSION_PERCENT ?? 10),
  firstLessonDiscount: Number(process.env.FIRST_LESSON_DISCOUNT ?? 20),
  // @BotFather dan olingan token; bo'sh bo'lsa Telegram orqali kirish o'chiq
  telegramToken: process.env.TELEGRAM_BOT_TOKEN || '',
  telegramApi: process.env.TELEGRAM_API_URL || 'https://api.telegram.org', // sinov uchun almashtiriladi
  adminEmail: process.env.ADMIN_EMAIL || 'admin@uwedrepo.uz',
  adminPassword: process.env.ADMIN_PASSWORD || 'Admin12345',
};
