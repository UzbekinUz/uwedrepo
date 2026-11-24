import { Booking, Payment } from '../models/index.js';
import { config } from '../config.js';
import { HttpError } from '../middleware/util.js';
import { notifyBooking } from '../notify.js';
import { paymentConfig, providerStatus, PROVIDER_NAME } from './config.js';

export { paymentConfig, providerStatus, PROVIDER_NAME };

const site = () => config.publicUrl || config.clientOrigin;

/** Provayder to'lov sahifasi manzili. Sinov rejimida — saytning o'z /pay/:id sahifasi. */
export function checkoutUrl(payment) {
  const c = paymentConfig();
  const id = String(payment._id);
  if (payment.mode === 'demo') return `/pay/${id}`;
  const back = `${site()}/pay/${id}`;
  if (payment.provider === 'payme') {
    // Payme GET usuli: parametrlar «;» bilan ajratilib base64 qilinadi, summa tiyinda
    const params = `m=${c.payme.merchantId};ac.order_id=${id};a=${Math.round(payment.amount * 100)};c=${back};l=uz`;
    return `${c.payme.checkoutUrl}/${Buffer.from(params).toString('base64')}`;
  }
  const q = new URLSearchParams({ service_id: c.click.serviceId, merchant_id: c.click.merchantId, amount: String(payment.amount), transaction_param: id, return_url: back });
  return `${c.click.checkoutUrl}?${q}`;
}

/** «To'lash» bosilganda: yangi to'lov yozuvi va provayder sahifasi manzili */
export async function startCheckout({ booking, provider, user }) {
  const status = providerStatus();
  if (!status.providers.includes(provider)) throw new HttpError(503, `${PROVIDER_NAME[provider]} orqali to'lov hozircha ulanmagan`);
  if (booking.status !== 'confirmed') throw new HttpError(409, "To'lov faqat repetitor tasdiqlagandan keyin, va faqat bir marta");
  // shu bron uchun oldin boshlanib, provayderga yetib bormagan to'lovlar yopiladi
  await Payment.updateMany({ booking: booking._id, status: 'created' }, { $set: { status: 'cancelled', cancelTime: Date.now() } });
  const payment = await Payment.create({ booking: booking._id, student: user._id, provider, mode: status.mode, amount: booking.total });
  return { payment, url: checkoutUrl(payment) };
}

/**
 * To'lovni yakunlash (Payme PerformTransaction, Click complete yoki sinov tasdig'i).
 * Bron «to'lov kutilmoqda» holatidan «to'langan»ga atomik o'tadi: ikki marta bosilsa, ikkinchisi null qaytaradi.
 */
export async function markPaid(paymentId, extra = {}) {
  const now = new Date();
  const payment = await Payment.findOneAndUpdate(
    { _id: paymentId, status: { $in: ['created', 'pending'] } },
    { $set: { status: 'paid', paidAt: now, ...extra } },
    { new: true }
  );
  if (!payment) return null;
  const booking = await Booking.findOneAndUpdate(
    { _id: payment.booking, status: 'confirmed' },
    { $set: { status: 'paid', paymentMethod: payment.provider, paidAt: now, payment: payment._id, paymentTest: payment.mode === 'demo' } },
    { new: true }
  );
  if (!booking) {
    // bron bu orada bekor qilingan yoki boshqa to'lov bilan yopilgan
    if (payment.mode === 'demo') {
      await Payment.updateOne({ _id: payment._id }, { $set: { status: 'cancelled', cancelTime: Date.now() }, $unset: { paidAt: 1 } });
      return null;
    }
    // haqiqiy pul yechilgan: administrator provayder kabinetidan qaytaradi
    await Payment.updateOne({ _id: payment._id }, { $set: { refunded: true } });
    return { payment, booking: null };
  }
  notifyBooking(booking._id, 'paid');
  return { payment, booking };
}

/** Bron bekor qilinganda: ochiq to'lovlar yopiladi, to'langan bo'lsa — qaytarish belgisi qo'yiladi */
export async function onBookingCancelled(booking) {
  await Payment.updateMany({ booking: booking._id, status: 'created' }, { $set: { status: 'cancelled', cancelTime: Date.now() } });
  if (booking.refunded && booking.payment) await Payment.updateOne({ _id: booking.payment }, { $set: { refunded: true } });
}

/** Admin panel uchun: rejim, ulangan provayderlar va provayder kabinetiga kiritiladigan manzillar */
export function paymentSystemInfo() {
  const c = paymentConfig();
  const base = `${site()}/api/payments`;
  return {
    mode: c.mode,
    payme: { ready: c.payme.ready, test: c.payme.test, fiscal: !!(c.payme.mxik && c.payme.packageCode), endpoint: `${base}/payme` },
    click: { ready: c.click.ready, prepare: `${base}/click/prepare`, complete: `${base}/click/complete` },
  };
}
