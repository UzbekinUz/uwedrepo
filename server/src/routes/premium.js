import { Router } from 'express';
import { z } from 'zod';
import { User, Payment } from '../models/index.js';
import { optionalAuth, requireAuth } from '../middleware/auth.js';
import { wrap, HttpError } from '../middleware/util.js';
import { getSettings } from '../settings.js';
import { PLAN_KEYS, premiumState } from '../premium.js';
import { startPremiumCheckout } from '../payments/index.js';

const r = Router();

// Rejalar, imtiyozlar va foydalanuvchining holati (mehmon ham ko'radi)
r.get(
  '/',
  optionalAuth,
  wrap(async (req, res) => {
    const state = premiumState(req.user);
    const history = req.user
      ? await Payment.find({ student: req.user._id, kind: 'premium', status: { $in: ['paid', 'cancelled'] }, paidAt: { $exists: true } })
          .sort({ createdAt: -1 }).limit(10).select('plan days amount provider mode status paidAt refunded').lean()
      : [];
    res.json({ ...state, history });
  })
);

r.post(
  '/checkout',
  requireAuth,
  wrap(async (req, res) => {
    const { plan, provider } = z.object({ plan: z.enum(PLAN_KEYS), provider: z.enum(['payme', 'click']) }).parse(req.body);
    const { payment, url } = await startPremiumCheckout({ user: req.user, plan, provider });
    res.status(201).json({ payment: payment._id, mode: payment.mode, url });
  })
);

// Bepul sinov: har bir foydalanuvchiga bir marta, faqat premium faol bo'lmaganda
r.post(
  '/trial',
  requireAuth,
  wrap(async (req, res) => {
    const s = getSettings().premium;
    if (!s.enabled || !(s.trialDays > 0)) throw new HttpError(403, 'Bepul sinov hozircha yopiq');
    const now = new Date();
    const user = await User.findOneAndUpdate(
      { _id: req.user._id, premiumTrialUsed: { $ne: true }, $or: [{ premiumUntil: { $exists: false } }, { premiumUntil: null }, { premiumUntil: { $lte: now } }] },
      { $set: { premiumTrialUsed: true, premiumUntil: new Date(now.getTime() + s.trialDays * 86400e3) } },
      { new: true }
    );
    if (!user) throw new HttpError(409, 'Bepul sinovdan allaqachon foydalangansiz');
    res.json(premiumState(user));
  })
);

export default r;
