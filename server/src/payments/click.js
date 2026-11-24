/**
 * Click Shop API: Click serveri ikki bosqichda so'rov yuboradi (application/x-www-form-urlencoded):
 *   POST /api/payments/click/prepare   (action=0) — buyurtmani tekshirish
 *   POST /api/payments/click/complete  (action=1) — to'lovni yakunlash
 * Hujjat: https://docs.click.uz/click-api-request/
 *
 * Buyurtma raqami (merchant_trans_id) — Payment yozuvining id si. Imzo: MD5, CLICK_SECRET_KEY bilan.
 */
import crypto from 'node:crypto';
import mongoose from 'mongoose';
import { Booking, Payment } from '../models/index.js';
import { paymentConfig } from './config.js';
import { markPaid } from './index.js';

export const CLICK_ERR = {
  ok: [0, 'Success'],
  sign: [-1, 'SIGN CHECK FAILED!'],
  amount: [-2, 'Incorrect parameter amount'],
  action: [-3, 'Action not found'],
  paid: [-4, 'Already paid'],
  order: [-5, 'User does not exist'],
  transaction: [-6, 'Transaction does not exist'],
  request: [-8, 'Error in request from click'],
  cancelled: [-9, 'Transaction cancelled'],
};

const md5 = (s) => crypto.createHash('md5').update(s).digest('hex');

/** Imzo: md5(click_trans_id + service_id + SECRET_KEY + merchant_trans_id [+ merchant_prepare_id] + amount + action + sign_time) */
export function clickSign(q, secret, withPrepare) {
  return md5(`${q.click_trans_id}${q.service_id}${secret}${q.merchant_trans_id}${withPrepare ? q.merchant_prepare_id : ''}${q.amount}${q.action}${q.sign_time}`);
}

const REQUIRED = ['click_trans_id', 'service_id', 'merchant_trans_id', 'amount', 'action', 'sign_time', 'sign_string'];

function makeReply(res, q) {
  return ([error, note], extra = {}) =>
    res.json({ click_trans_id: Number(q.click_trans_id) || null, merchant_trans_id: q.merchant_trans_id ?? null, ...extra, error, error_note: note });
}

/** Ikkala bosqich uchun umumiy tekshiruv: imzo, xizmat, buyurtma va summa */
async function verify(q, withPrepare) {
  const c = paymentConfig().click;
  if (!c.secret || !c.serviceId) return { err: CLICK_ERR.request };
  const fields = withPrepare ? [...REQUIRED, 'merchant_prepare_id'] : REQUIRED;
  if (fields.some((k) => q[k] === undefined || q[k] === '')) return { err: CLICK_ERR.request };
  const a = Buffer.from(String(q.sign_string).toLowerCase());
  const b = Buffer.from(clickSign(q, c.secret, withPrepare));
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return { err: CLICK_ERR.sign };
  if (String(q.service_id) !== String(c.serviceId)) return { err: CLICK_ERR.request };
  if (String(q.action) !== (withPrepare ? '1' : '0')) return { err: CLICK_ERR.action };
  const id = String(q.merchant_trans_id);
  if (!mongoose.isValidObjectId(id)) return { err: CLICK_ERR.order };
  const p = await Payment.findOne({ _id: id, provider: 'click', mode: 'live' });
  if (!p) return { err: CLICK_ERR.order };
  if (Math.abs(Number(q.amount) - p.amount) > 0.01) return { err: CLICK_ERR.amount };
  return { p };
}

export async function clickPrepare(req, res) {
  const q = req.body || {};
  const reply = makeReply(res, q);
  const { p, err } = await verify(q, false);
  if (err) return reply(err);
  if (p.status === 'paid') return reply(CLICK_ERR.paid);
  if (p.status === 'cancelled') return reply(CLICK_ERR.cancelled);
  const booking = await Booking.findById(p.booking);
  if (!booking || booking.status !== 'confirmed') return reply(CLICK_ERR.order);
  // Click oldingi urinish muvaffaqiyatsiz bo'lsa, yangi click_trans_id bilan qayta tayyorlashi mumkin
  const prepareId = p.prepareId || crypto.randomInt(1, 2_000_000_000);
  await Payment.updateOne({ _id: p._id, status: { $in: ['created', 'pending'] } }, { $set: { extId: String(q.click_trans_id), prepareId, status: 'pending', createTime: Date.now() } });
  return reply(CLICK_ERR.ok, { merchant_prepare_id: prepareId });
}

export async function clickComplete(req, res) {
  const q = req.body || {};
  const reply = makeReply(res, q);
  const { p, err } = await verify(q, true);
  if (err) return reply(err);
  if (Number(q.merchant_prepare_id) !== p.prepareId || p.extId !== String(q.click_trans_id)) return reply(CLICK_ERR.transaction);
  if (p.status === 'paid') return reply(CLICK_ERR.paid, { merchant_confirm_id: p.prepareId });
  if (p.status === 'cancelled') return reply(CLICK_ERR.cancelled);
  const cancel = () => Payment.updateOne({ _id: p._id, status: { $in: ['created', 'pending'] } }, { $set: { status: 'cancelled', cancelTime: Date.now() } });
  // Click to'lov amalga oshmaganini xabar qildi (masalan, kartada mablag' yetmadi)
  if (Number(q.error) < 0) {
    await cancel();
    return reply(CLICK_ERR.cancelled);
  }
  const booking = await Booking.findById(p.booking);
  if (!booking || booking.status !== 'confirmed') {
    await cancel();
    return reply(CLICK_ERR.cancelled);
  }
  const done = await markPaid(p._id, { performTime: Date.now() });
  if (!done) {
    const fresh = await Payment.findById(p._id);
    return reply(fresh?.status === 'paid' ? CLICK_ERR.paid : CLICK_ERR.cancelled);
  }
  return reply(CLICK_ERR.ok, { merchant_confirm_id: p.prepareId });
}
