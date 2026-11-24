/**
 * Payme Merchant API (JSON-RPC): Payme serveri shu manzilga so'rov yuboradi — POST /api/payments/payme
 * Hujjat: https://developer.help.paycom.uz/metody-merchant-api/
 *
 * Buyurtma raqami (account.order_id) — Payment yozuvining id si. Summalar tiyinda keladi (1 so'm = 100 tiyin).
 * Javob har doim HTTP 200: xato bo'lsa { error: { code, message, data } }.
 */
import crypto from 'node:crypto';
import mongoose from 'mongoose';
import { Booking, Payment } from '../models/index.js';
import { notifyBooking } from '../notify.js';
import { paymentConfig } from './config.js';
import { markPaid, payable } from './index.js';
import { removePremiumDays } from '../premium.js';

export const TIMEOUT_MS = 12 * 3600e3; // Payme: 12 soatda bajarilmagan tranzaksiya bekor qilinadi

const msg = (uz, ru, en) => ({ uz, ru, en });
export const ERR = {
  auth: [-32504, msg('Avtorizatsiya xatosi', 'Недостаточно привилегий для выполнения метода', 'Insufficient privileges')],
  method: [-32601, msg('Metod topilmadi', 'Метод не найден', 'Method not found')],
  parse: [-32700, msg("So'rovni o'qib bo'lmadi", 'Ошибка парсинга JSON', 'Parse error')],
  request: [-32600, msg("Noto'g'ri so'rov", 'Неверный RPC-запрос', 'Invalid request')],
  system: [-32400, msg('Tizim xatosi', 'Системная ошибка', 'System error')],
  amount: [-31001, msg("Noto'g'ri summa", 'Неверная сумма', 'Incorrect amount')],
  notFound: [-31003, msg('Tranzaksiya topilmadi', 'Транзакция не найдена', 'Transaction not found')],
  cantCancel: [-31007, msg("Bekor qilib bo'lmaydi: dars o'tib bo'lgan", 'Невозможно отменить транзакцию: услуга оказана', 'Cannot cancel: service already delivered')],
  cantPerform: [-31008, msg("Amalni bajarib bo'lmaydi", 'Невозможно выполнить операцию', 'Unable to perform operation')],
  order: [-31050, msg('Buyurtma topilmadi', 'Заказ не найден', 'Order not found'), 'order_id'],
  orderClosed: [-31051, msg("Buyurtmani to'lab bo'lmaydi", 'Заказ недоступен для оплаты', 'Order is not available for payment'), 'order_id'],
  orderBusy: [-31052, msg("Buyurtma bo'yicha boshqa tranzaksiya kutilmoqda", 'По заказу ожидается оплата другой транзакцией', 'Another transaction is pending for this order'), 'order_id'],
};

class RpcError extends Error {
  constructor([code, message, data]) {
    super(message.en);
    this.code = code;
    this.rpcMessage = message;
    this.data = data;
  }
}
const fail = (e) => {
  throw new RpcError(e);
};
const rpcError = ([code, message, data]) => ({ error: { code, message, ...(data && { data }) } });
export const parseErrorBody = { jsonrpc: '2.0', id: null, ...rpcError(ERR.parse) };

/** Authorization: Basic base64("Paycom:<kassa kaliti>") */
export function paymeAuthorized(header) {
  const { key } = paymentConfig().payme;
  if (!key || typeof header !== 'string' || !header.startsWith('Basic ')) return false;
  const decoded = Buffer.from(header.slice(6), 'base64').toString('utf8');
  const i = decoded.indexOf(':');
  if (i < 0 || decoded.slice(0, i) !== 'Paycom') return false;
  const a = Buffer.from(decoded.slice(i + 1));
  const b = Buffer.from(key);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

const tiyin = (p) => Math.round(p.amount * 100);

async function checkOrder(params) {
  const id = params?.account?.order_id;
  if (typeof id !== 'string' || !mongoose.isValidObjectId(id)) fail(ERR.order);
  const p = await Payment.findOne({ _id: id, provider: 'payme', mode: 'live' });
  if (!p) fail(ERR.order);
  if (!Number.isInteger(params.amount) || params.amount !== tiyin(p)) fail(ERR.amount);
  if (!['created', 'pending'].includes(p.status)) fail(ERR.orderClosed);
  if (p.kind === 'premium') return { p, b: null };
  const b = await Booking.findById(p.booking).populate('subject', 'name');
  if (!b || b.status !== 'confirmed') fail(ERR.orderClosed);
  return { p, b };
}

/** Fiskal chek ma'lumoti (MXIK kodi kiritilgan bo'lsa) */
function receiptDetail(p, b) {
  const c = paymentConfig().payme;
  if (!c.mxik) return {};
  return {
    detail: {
      receipt_type: 0,
      items: [{ title: (p.kind === 'premium' ? `UWEDRepo Premium obunasi: ${p.days} kun` : `Repetitorlik darsi: ${b?.subject?.name || 'fan'}`).slice(0, 128), price: tiyin(p), count: 1, code: c.mxik, package_code: c.packageCode, vat_percent: c.vat }],
    },
  };
}

const view = (p) => ({ transaction: String(p._id), state: p.state });

async function expire(p) {
  await Payment.updateOne({ _id: p._id, state: 1 }, { $set: { state: -1, reason: 4, cancelTime: Date.now(), status: 'cancelled' } });
}

const METHODS = {
  async CheckPerformTransaction(params) {
    const { p, b } = await checkOrder(params);
    if (p.extId) fail(ERR.orderBusy);
    return { allow: true, ...receiptDetail(p, b) };
  },

  async CreateTransaction(params) {
    if (typeof params.id !== 'string' || !params.id) fail(ERR.request);
    const existing = await Payment.findOne({ provider: 'payme', extId: params.id });
    if (existing) {
      if (existing.state !== 1) fail(ERR.cantPerform);
      if (Date.now() - existing.createTime > TIMEOUT_MS) {
        await expire(existing);
        fail(ERR.cantPerform);
      }
      return { create_time: existing.createTime, ...view(existing) };
    }
    const { p } = await checkOrder(params);
    if (p.extId) fail(ERR.orderBusy); // shu buyurtma uchun boshqa Payme tranzaksiyasi ochiq
    const now = Date.now();
    const created = await Payment.findOneAndUpdate(
      { _id: p._id, status: 'created', extId: { $exists: false } },
      { $set: { extId: params.id, extTime: Number(params.time) || now, state: 1, createTime: now, status: 'pending' } },
      { new: true }
    );
    if (!created) fail(ERR.orderBusy);
    return { create_time: now, ...view(created) };
  },

  async PerformTransaction(params) {
    const p = await Payment.findOne({ provider: 'payme', extId: params.id });
    if (!p) fail(ERR.notFound);
    if (p.state === 2) return { perform_time: p.performTime, ...view(p) };
    if (p.state !== 1) fail(ERR.cantPerform);
    if (Date.now() - p.createTime > TIMEOUT_MS) {
      await expire(p);
      fail(ERR.cantPerform);
    }
    if (!(await payable(p))) fail(ERR.cantPerform); // bron bekor qilingan: Payme tranzaksiyani o'zi bekor qiladi
    await markPaid(p._id, { state: 2, performTime: Date.now() });
    const fresh = await Payment.findById(p._id);
    if (fresh.state !== 2) fail(ERR.cantPerform);
    return { perform_time: fresh.performTime, ...view(fresh) };
  },

  async CancelTransaction(params) {
    const p = await Payment.findOne({ provider: 'payme', extId: params.id });
    if (!p) fail(ERR.notFound);
    const reason = Number.isInteger(params.reason) ? params.reason : null;
    const now = Date.now();
    if (p.state === 1) {
      await Payment.updateOne({ _id: p._id, state: 1 }, { $set: { state: -1, reason, cancelTime: now, status: 'cancelled' } });
    } else if (p.state === 2 && p.kind === 'premium') {
      // pul qaytarildi: sotib olingan premium kunlar olib tashlanadi
      const done = await Payment.updateOne({ _id: p._id, state: 2 }, { $set: { state: -2, reason, cancelTime: now, status: 'cancelled', refunded: true } });
      if (done.modifiedCount) await removePremiumDays(p.student, p.days);
    } else if (p.state === 2) {
      const b = await Booking.findById(p.booking);
      if (b?.status === 'completed') fail(ERR.cantCancel);
      await Payment.updateOne({ _id: p._id, state: 2 }, { $set: { state: -2, reason, cancelTime: now, status: 'cancelled', refunded: true } });
      // pul qaytarildi: shu to'lov bilan yopilgan bron ham bekor qilinadi
      const cancelled = await Booking.findOneAndUpdate({ _id: p.booking, status: 'paid', payment: p._id }, { $set: { status: 'cancelled', refunded: true } }, { new: true });
      if (cancelled) notifyBooking(cancelled._id, 'refunded');
    }
    const fresh = await Payment.findById(p._id);
    return { cancel_time: fresh.cancelTime, ...view(fresh) };
  },

  async CheckTransaction(params) {
    const p = await Payment.findOne({ provider: 'payme', extId: params.id });
    if (!p) fail(ERR.notFound);
    return { create_time: p.createTime, perform_time: p.performTime || 0, cancel_time: p.cancelTime || 0, ...view(p), reason: p.reason ?? null };
  },

  async GetStatement(params) {
    const from = Number(params.from);
    const to = Number(params.to);
    if (!Number.isFinite(from) || !Number.isFinite(to)) fail(ERR.request);
    const list = await Payment.find({ provider: 'payme', extId: { $type: 'string' }, extTime: { $gte: from, $lte: to } }).sort({ extTime: 1 });
    return {
      transactions: list.map((p) => ({
        id: p.extId,
        time: p.extTime,
        amount: tiyin(p),
        account: { order_id: String(p._id) },
        create_time: p.createTime,
        perform_time: p.performTime || 0,
        cancel_time: p.cancelTime || 0,
        ...view(p),
        reason: p.reason ?? null,
        receivers: null,
      })),
    };
  },
};

export async function paymeHandler(req, res) {
  const body = req.body && typeof req.body === 'object' ? req.body : {};
  const id = body.id ?? null;
  const send = (x) => res.status(200).json({ jsonrpc: '2.0', id, ...x });
  if (!paymeAuthorized(req.get('authorization'))) return send(rpcError(ERR.auth));
  const fn = Object.hasOwn(METHODS, body.method) ? METHODS[body.method] : null;
  if (!fn) return send(rpcError(ERR.method));
  try {
    return send({ result: await fn(body.params && typeof body.params === 'object' ? body.params : {}) });
  } catch (e) {
    if (e instanceof RpcError) return send({ error: { code: e.code, message: e.rpcMessage, ...(e.data && { data: e.data }) } });
    console.error('[payme]', e);
    return send(rpcError(ERR.system));
  }
}
