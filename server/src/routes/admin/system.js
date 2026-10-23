import { Router } from 'express';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { User, Announcement, AuditLog } from '../../models/index.js';
import { wrap, HttpError } from '../../middleware/util.js';
import { getSettings, saveSettings } from '../../settings.js';
import { bot, sendText } from '../../telegram.js';
import { config } from '../../config.js';
import { audit, pageOf, pageMeta } from './helpers.js';

const r = Router();

/* ---------- Sozlamalar ---------- */
r.get('/settings', wrap(async (_req, res) => res.json(getSettings())));

r.put(
  '/settings',
  wrap(async (req, res) => {
    const data = z
      .object({
        commission: z.number().min(0).max(50),
        firstLessonDiscount: z.number().min(0).max(90),
        cancelHours: z.number().int().min(0).max(168),
        registrationOpen: z.boolean(),
        banner: z.object({ text: z.string().trim().max(200), kind: z.enum(['info', 'warn']), active: z.boolean() }),
      })
      .parse(req.body);
    const before = getSettings();
    const after = await saveSettings(data);
    audit(req, 'settings.update', 'sayt sozlamalari', { before: { commission: before.commission, discount: before.firstLessonDiscount, cancelHours: before.cancelHours, open: before.registrationOpen }, after: { commission: after.commission, discount: after.firstLessonDiscount, cancelHours: after.cancelHours, open: after.registrationOpen } });
    res.json(after);
  })
);

/** Tizim holati: qaysi xizmatlar ulangan */
r.get('/system', wrap(async (_req, res) =>
  res.json({
    bot: bot.username || null,
    db: mongoose.connection.readyState === 1,
    env: config.isProd ? 'production' : 'development',
    paymentMode: process.env.PAYMENT_PROVIDER || 'mock',
    clientOrigin: config.clientOrigin,
    node: process.version,
    uptimeHours: Math.round((process.uptime() / 3600) * 10) / 10,
  })
));

r.post(
  '/me/password',
  wrap(async (req, res) => {
    const { current, next } = z.object({ current: z.string(), next: z.string().min(10, "Yangi parol kamida 10 belgi bo'lsin").max(100) }).parse(req.body);
    const me = await User.findById(req.user._id).select('+password');
    if (!me.password) throw new HttpError(400, "Bu akkauntda parol yo'q (Telegram orqali kirgansiz)");
    if (!(await bcrypt.compare(current, me.password))) throw new HttpError(400, "Joriy parol noto'g'ri");
    if (next === current) throw new HttpError(400, 'Yangi parol joriy paroldan farq qilsin');
    me.password = await bcrypt.hash(next, 10);
    await me.save();
    audit(req, 'admin.password', me.name);
    res.json({ ok: true });
  })
);

/* ---------- Telegram e'lonlari ---------- */
const audienceFilter = (a) => ({
  telegramId: { $exists: true, $ne: null },
  blocked: { $ne: true },
  ...(a === 'students' ? { role: 'student' } : a === 'tutors' ? { role: 'tutor' } : {}),
});

r.get('/announcements', wrap(async (_req, res) => res.json(await Announcement.find().sort({ createdAt: -1 }).limit(30).populate('by', 'name').lean())));
r.get('/announcements/audience', wrap(async (req, res) => res.json({ count: await User.countDocuments(audienceFilter(String(req.query.audience || 'all'))), bot: !!bot.username })));

r.post(
  '/announcements',
  wrap(async (req, res) => {
    if (!bot.username) throw new HttpError(503, "Telegram bot ulanmagan: e'lon yuborib bo'lmaydi");
    const { text, audience } = z.object({ text: z.string().trim().min(5).max(1000), audience: z.enum(['all', 'students', 'tutors']) }).parse(req.body);
    const users = await User.find(audienceFilter(audience)).select('telegramId').lean();
    if (!users.length) throw new HttpError(400, "Bu guruhda Telegram ulangan foydalanuvchi yo'q");
    const ann = await Announcement.create({ text, audience, total: users.length, by: req.user._id });
    audit(req, 'announcement.send', audience, { total: users.length });
    res.status(202).json(ann);

    // Orqa fonda: Telegram sekundiga ~30 xabar chegarasidan pastroq tezlikda
    (async () => {
      let sent = 0;
      let failed = 0;
      for (const u of users) {
        (await sendText(u.telegramId, text)) ? sent++ : failed++;
        if ((sent + failed) % 20 === 0) await Announcement.updateOne({ _id: ann._id }, { sent, failed });
        await new Promise((ok) => setTimeout(ok, 60));
      }
      await Announcement.updateOne({ _id: ann._id }, { sent, failed, status: 'done' });
    })().catch((e) => console.error('[announcement]', e.message));
  })
);

/* ---------- Faoliyat jurnali ---------- */
r.get(
  '/audit',
  wrap(async (req, res) => {
    const { page, limit, skip } = pageOf(req, 30);
    const f = req.query.action ? { action: new RegExp(`^${String(req.query.action).replace(/[^\w.]/g, '')}`) } : {};
    const [items, total] = await Promise.all([AuditLog.find(f).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(), AuditLog.countDocuments(f)]);
    res.json({ items, ...pageMeta(total, page, limit) });
  })
);

export default r;
