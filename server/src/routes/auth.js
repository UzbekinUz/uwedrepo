import crypto from 'node:crypto';
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { User, TelegramLogin } from '../models/index.js';
import { bot } from '../telegram.js';
import { getSettings } from '../settings.js';
import { signToken, requireAuth } from '../middleware/auth.js';
import { wrap, HttpError } from '../middleware/util.js';
import { FACULTY_KEYS } from '../data/meta.js';

const r = Router();

const profileFields = {
  faculty: z.enum(FACULTY_KEYS).optional(),
  year: z.number().int().min(1).max(4).optional(),
  telegram: z.string().trim().max(64).optional(),
};

const registerSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8, "Parol kamida 8 belgi bo'lsin").max(100),
  ...profileFields,
});

const publicUser = (u) => ({
  id: u._id,
  name: u.name,
  email: u.email,
  role: u.role,
  faculty: u.faculty,
  year: u.year,
  telegram: u.telegram,
  phone: u.phone,
});

r.post(
  '/register',
  wrap(async (req, res) => {
    // Telegram bot ishlayotgan bo'lsa, email orqali ommaviy ro'yxatdan o'tish yopiq (spam akkauntlarga qarshi)
    if (bot.username) throw new HttpError(403, "Email orqali ro'yxatdan o'tish o'chirilgan: Telegram orqali kiring");
    if (!getSettings().registrationOpen) throw new HttpError(403, "Hozircha yangi ro'yxatdan o'tish yopiq");
    const data = registerSchema.parse(req.body);
    if (await User.exists({ email: data.email })) throw new HttpError(409, "Bu email bilan ro'yxatdan o'tilgan");
    const user = await User.create({ ...data, password: await bcrypt.hash(data.password, 10) });
    res.status(201).json({ token: signToken(user), user: publicUser(user) });
  })
);

r.post(
  '/login',
  wrap(async (req, res) => {
    const { email, password } = z
      .object({ email: z.string().trim().toLowerCase(), password: z.string() })
      .parse(req.body);
    const user = await User.findOne({ email }).select('+password');
    if (!user || !user.password || !(await bcrypt.compare(password, user.password))) throw new HttpError(401, "Email yoki parol noto'g'ri");
    if (user.blocked) throw new HttpError(403, "Akkaunt bloklangan. Administrator bilan bog'laning.");
    res.json({ token: signToken(user), user: publicUser(user) });
  })
);

/* ---------- Telegram bot orqali kirish / ro'yxatdan o'tish ---------- */
r.post(
  '/telegram/start',
  wrap(async (_req, res) => {
    if (!bot.username) throw new HttpError(503, 'Telegram bot sozlanmagan');
    const token = crypto.randomBytes(24).toString('base64url');
    await TelegramLogin.create({ token, expiresAt: new Date(Date.now() + 10 * 60e3) });
    res.json({ token, url: `https://t.me/${bot.username}?start=${token}`, bot: bot.username });
  })
);

// Kod ochiq qaytarilmaydi: faqat bot Start bosilganini bildiradi
r.get(
  '/telegram/status/:token',
  wrap(async (req, res) => {
    const s = await TelegramLogin.findOne({ token: req.params.token, expiresAt: { $gt: new Date() } }).select('code');
    res.json({ expired: !s, started: !!s?.code });
  })
);

r.post(
  '/telegram/verify',
  wrap(async (req, res) => {
    const { token, code, faculty, year } = z
      .object({ token: z.string().min(16).max(64), code: z.string().regex(/^\d{6}$/, "Kod 6 ta raqamdan iborat"), faculty: profileFields.faculty, year: profileFields.year })
      .parse(req.body);
    const s = await TelegramLogin.findOne({ token, expiresAt: { $gt: new Date() } });
    if (!s) throw new HttpError(410, 'Kod eskirgan, qaytadan boshlang');
    if (!s.code) throw new HttpError(409, 'Avval botda Start tugmasini bosing');
    if (s.attempts >= 5) {
      await s.deleteOne();
      throw new HttpError(429, 'Urinishlar tugadi, yangi kod oling');
    }
    const ok = code.length === s.code.length && crypto.timingSafeEqual(Buffer.from(code), Buffer.from(s.code));
    if (!ok) {
      s.attempts += 1;
      await s.save();
      throw new HttpError(400, "Kod noto'g'ri");
    }

    const handle = s.username ? `@${s.username}` : '';
    let user = await User.findOne({ telegramId: s.telegramId });
    if (user?.blocked) throw new HttpError(403, "Akkaunt bloklangan. Administrator bilan bog'laning.");
    if (!user && !getSettings().registrationOpen) throw new HttpError(403, "Hozircha yangi ro'yxatdan o'tish yopiq");
    if (!user) {
      user = await User.create({
        name: [s.firstName, s.lastName].filter(Boolean).join(' ') || s.username || 'Foydalanuvchi',
        telegramId: s.telegramId,
        telegram: handle || undefined,
        phone: s.phone || undefined,
        faculty,
        year,
      });
    } else {
      if (handle) user.telegram = handle;
      if (s.phone) user.phone = s.phone;
      if (!user.faculty && faculty) Object.assign(user, { faculty, year });
      await user.save();
    }
    await s.deleteOne(); // kod bir martalik
    res.json({ token: signToken(user), user: publicUser(user) });
  })
);

r.get('/me', requireAuth, (req, res) => res.json({ user: publicUser(req.user) }));

r.patch(
  '/me',
  requireAuth,
  wrap(async (req, res) => {
    const data = z.object({ name: z.string().trim().min(2).max(80).optional(), ...profileFields }).parse(req.body);
    Object.assign(req.user, data);
    await req.user.save();
    res.json({ user: publicUser(req.user) });
  })
);

export default r;
