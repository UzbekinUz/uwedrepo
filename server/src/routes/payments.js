import express, { Router } from 'express';
import mongoose from 'mongoose';
import { Payment } from '../models/index.js';
import { requireAuth } from '../middleware/auth.js';
import { wrap, HttpError } from '../middleware/util.js';
import { markPaid, providerStatus } from '../payments/index.js';
import { paymeHandler } from '../payments/payme.js';
import { clickPrepare, clickComplete } from '../payments/click.js';

const r = Router();

// Talabaga ko'rinadigan to'lov usullari va rejim (sinov yoki haqiqiy)
r.get('/config', (_req, res) => res.json(providerStatus()));

// Provayder serverlaridan keladigan so'rovlar: avtorizatsiya ularning o'z kaliti/imzosi bilan
r.post('/payme', wrap(paymeHandler));
const form = express.urlencoded({ extended: false, limit: '20kb' });
r.post('/click/prepare', form, wrap(clickPrepare));
r.post('/click/complete', form, wrap(clickComplete));

async function own(req) {
  if (!mongoose.isValidObjectId(req.params.id)) throw new HttpError(404, "To'lov topilmadi");
  const p = await Payment.findById(req.params.id).populate({
    path: 'booking',
    select: 'status startsAt subject tutor price discount total refunded',
    populate: [{ path: 'subject', select: 'name' }, { path: 'tutor', select: 'user', populate: { path: 'user', select: 'name' } }],
  });
  if (!p || (String(p.student) !== String(req.user._id) && req.user.role !== 'admin')) throw new HttpError(404, "To'lov topilmadi");
  return p;
}

const present = (p) => ({
  _id: p._id, provider: p.provider, mode: p.mode, amount: p.amount, status: p.status, refunded: p.refunded,
  createdAt: p.createdAt, paidAt: p.paidAt, booking: p.booking,
});

r.get('/:id', requireAuth, wrap(async (req, res) => res.json(present(await own(req)))));

// Sinov rejimi: talaba saytning o'z to'lov sahifasida tasdiqlaydi (haqiqiy pul yechilmaydi)
r.post(
  '/:id/demo/confirm',
  requireAuth,
  wrap(async (req, res) => {
    const p = await own(req);
    if (p.mode !== 'demo') throw new HttpError(409, "Bu haqiqiy to'lov: u provayder sahifasida amalga oshiriladi");
    const done = await markPaid(p._id, { performTime: Date.now() });
    if (!done) throw new HttpError(409, "To'lov allaqachon amalga oshirilgan yoki bekor qilingan");
    res.json(present(await own(req)));
  })
);

r.post(
  '/:id/demo/cancel',
  requireAuth,
  wrap(async (req, res) => {
    const p = await own(req);
    if (p.mode !== 'demo') throw new HttpError(409, "Bu haqiqiy to'lov: uni provayder sahifasida bekor qiling");
    await Payment.updateOne({ _id: p._id, status: { $in: ['created', 'pending'] } }, { $set: { status: 'cancelled', cancelTime: Date.now() } });
    res.json(present(await own(req)));
  })
);

export default r;
