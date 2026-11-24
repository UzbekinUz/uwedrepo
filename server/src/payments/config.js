/**
 * To'lov sozlamalari. Hammasi muhit o'zgaruvchilaridan (Render → Environment) o'qiladi; kalitlar kodda saqlanmaydi.
 *
 *   PAYMENT_MODE        demo (standart) — haqiqiy pul yechilmaydi, talaba saytning o'z sinov sahifasidan o'tadi;
 *                       live — Payme / Click to'lov sahifasiga yo'naltiriladi (kalitlari kiritilgan provayderlar).
 *   PAYME_MERCHANT_ID   Payme kabinetidagi kassa ID si
 *   PAYME_KEY           kassa kaliti (Payme webhook so'rovlarini tekshirish uchun)
 *   PAYME_TEST=1        Payme sinov muhiti (test.paycom.uz) va PAYME_TEST_KEY
 *   PAYME_MXIK, PAYME_PACKAGE_CODE, PAYME_VAT_PERCENT  — fiskal chek uchun (MXIK kodi, o'lchov birligi kodi, QQS %)
 *   CLICK_SERVICE_ID, CLICK_MERCHANT_ID, CLICK_SECRET_KEY — Click merchant kabinetidan
 *
 * Qiymatlar har chaqiruvda qayta o'qiladi: sinovlarda muhitni almashtirish oson.
 */
export function paymentConfig() {
  const e = process.env;
  const test = e.PAYME_TEST === '1';
  const payme = {
    merchantId: e.PAYME_MERCHANT_ID || '',
    key: (test ? e.PAYME_TEST_KEY : e.PAYME_KEY) || '',
    test,
    checkoutUrl: test ? 'https://test.paycom.uz' : 'https://checkout.paycom.uz',
    mxik: e.PAYME_MXIK || '',
    packageCode: e.PAYME_PACKAGE_CODE || '',
    vat: Number(e.PAYME_VAT_PERCENT || 0),
  };
  const click = {
    serviceId: e.CLICK_SERVICE_ID || '',
    merchantId: e.CLICK_MERCHANT_ID || '',
    secret: e.CLICK_SECRET_KEY || '',
    checkoutUrl: 'https://my.click.uz/services/pay',
  };
  return {
    mode: e.PAYMENT_MODE === 'live' ? 'live' : 'demo',
    payme: { ...payme, ready: !!(payme.merchantId && payme.key) },
    click: { ...click, ready: !!(click.serviceId && click.merchantId && click.secret) },
  };
}

export const PROVIDERS = ['payme', 'click'];
export const PROVIDER_NAME = { payme: 'Payme', click: 'Click' };

/** Talabaga ko'rsatiladigan to'lov usullari: sinov rejimida ikkalasi, haqiqiy rejimda faqat kaliti kiritilganlari */
export function providerStatus() {
  const c = paymentConfig();
  return {
    mode: c.mode,
    providers: PROVIDERS.filter((p) => c.mode === 'demo' || c[p].ready),
    ready: Object.fromEntries(PROVIDERS.map((p) => [p, c[p].ready])),
  };
}
