/**
 * To'lov provayderi interfeysi.
 * Hozir: "mock" — haqiqiy pul harakati yo'q (pilot/demo uchun).
 * Click/Payme ulash uchun merchant shartnomasi va kalitlar kerak; ulanganda faqat shu fayl almashtiriladi:
 *   - Click:  https://docs.click.uz   (prepare/complete webhooklari)
 *   - Payme:  https://developer.help.paycom.uz (JSON-RPC Merchant API)
 */
export async function pay({ booking, method }) {
  if (process.env.PAYMENT_PROVIDER && process.env.PAYMENT_PROVIDER !== 'mock') {
    throw Object.assign(new Error(`${process.env.PAYMENT_PROVIDER} provayderi hali ulanmagan`), { status: 501 });
  }
  return { ok: true, provider: 'mock', method, amount: booking.total };
}
