import crypto from 'node:crypto';
import { config } from './config.js';
import { TelegramLogin, User } from './models/index.js';

/** Ishga tushgan botning username'i (getMe dan); bo'sh bo'lsa Telegram orqali kirish o'chiq */
export const bot = { username: '' };

const TEXT = {
  uz: {
    code: (c) => `UWEDRepo tasdiqlash kodi: ${c}\n\nUni saytga kiriting. Kod 10 daqiqa amal qiladi. Kodni hech kimga bermang.\n\nXohlasangiz, pastdagi tugma orqali telefon raqamingizni ham ulashing (majburiy emas).`,
    phoneBtn: 'Telefon raqamni ulashish',
    phoneOk: 'Rahmat, telefon raqamingiz saqlandi.',
    notOwn: "Iltimos, o'zingizning kontaktingizni yuboring.",
    help: "Kod olish uchun saytdagi «Telegram orqali kod olish» tugmasi orqali keling.",
    expired: "Havola eskirgan yoki boshqa akkauntga tegishli. Saytda yangi kod so'rang.",
  },
  ru: {
    code: (c) => `Код подтверждения UWEDRepo: ${c}\n\nВведите его на сайте. Код действует 10 минут. Никому его не сообщайте.\n\nПри желании поделитесь номером телефона кнопкой ниже (необязательно).`,
    phoneBtn: 'Поделиться номером телефона',
    phoneOk: 'Спасибо, номер телефона сохранён.',
    notOwn: 'Пожалуйста, отправьте свой собственный контакт.',
    help: 'Чтобы получить код, перейдите по кнопке «Получить код через Telegram» на сайте.',
    expired: 'Ссылка устарела или принадлежит другому аккаунту. Запросите новый код на сайте.',
  },
  en: {
    code: (c) => `UWEDRepo verification code: ${c}\n\nEnter it on the website. The code is valid for 10 minutes. Never share it.\n\nIf you like, also share your phone number with the button below (optional).`,
    phoneBtn: 'Share phone number',
    phoneOk: 'Thanks, your phone number has been saved.',
    notOwn: 'Please send your own contact.',
    help: 'To get a code, use the “Get code via Telegram” button on the website.',
    expired: 'The link has expired or belongs to another account. Request a new code on the website.',
  },
};
const tx = (user) => TEXT[(user?.language_code || '').slice(0, 2)] || TEXT.uz;

async function api(method, body) {
  const r = await fetch(`${config.telegramApi}/bot${config.telegramToken}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body || {}),
  });
  const j = await r.json().catch(() => ({}));
  if (!j.ok) throw new Error(j.description || `Telegram ${method}: ${r.status}`);
  return j.result;
}
const send = (chat_id, text, extra) => api('sendMessage', { chat_id, text, ...extra });

/** Foydalanuvchiga (Telegram orqali kirgan bo'lsa) xabar yuboradi; xato bo'lsa jim o'tadi */
export async function sendText(chatId, text) {
  if (!bot.username || !chatId) return false;
  try {
    await send(chatId, text, { disable_web_page_preview: true });
    return true;
  } catch (e) {
    console.error('[telegram] xabar yuborilmadi:', e.message);
    return false;
  }
}
export async function notifyUser(userOrId, text) {
  if (!bot.username || !userOrId) return false;
  const u = userOrId.telegramId !== undefined ? userOrId : await User.findById(userOrId).select('telegramId blocked');
  if (!u?.telegramId || u.blocked) return false;
  return sendText(u.telegramId, text);
}

// Toshkent vaqti bo'yicha "24.10 16:00"
export function fmtDt(d) {
  const x = new Date(new Date(d).getTime() + 5 * 3600e3);
  const p = (n) => String(n).padStart(2, '0');
  return `${p(x.getUTCDate())}.${p(x.getUTCMonth() + 1)} ${p(x.getUTCHours())}:00`;
}

const normalizePhone = (p) => `+${String(p).replace(/\D/g, '')}`.slice(0, 20);

/** Bitta Telegram yangilanishini qayta ishlaydi (sinash uchun `reply` almashtiriladi) */
export async function handleUpdate(update, reply = send) {
  const m = update.message;
  if (!m || m.chat?.type !== 'private' || !m.from) return;
  const T = tx(m.from);
  const from = String(m.from.id);

  // Foydalanuvchi o'z kontaktini ulashdi: telefonni oxirgi faol sessiyaga yozamiz
  if (m.contact) {
    if (String(m.contact.user_id) !== from) return reply(m.chat.id, T.notOwn);
    const s = await TelegramLogin.findOne({ telegramId: from, expiresAt: { $gt: new Date() } }).sort({ createdAt: -1 });
    if (s) {
      s.phone = normalizePhone(m.contact.phone_number);
      await s.save();
    }
    return reply(m.chat.id, T.phoneOk, { reply_markup: { remove_keyboard: true } });
  }

  const match = (m.text || '').trim().match(/^\/start(?:@\w+)?\s+([A-Za-z0-9_-]{16,64})$/);
  if (!match) return reply(m.chat.id, T.help);

  const s = await TelegramLogin.findOne({ token: match[1], expiresAt: { $gt: new Date() } });
  if (!s || (s.telegramId && s.telegramId !== from)) return reply(m.chat.id, T.expired);

  if (!s.code) s.code = String(crypto.randomInt(100000, 1000000)); // qayta Start bosilsa, o'sha kod
  Object.assign(s, { telegramId: from, username: m.from.username || '', firstName: m.from.first_name || '', lastName: m.from.last_name || '' });
  await s.save();

  return reply(m.chat.id, T.code(s.code), {
    reply_markup: { keyboard: [[{ text: T.phoneBtn, request_contact: true }]], resize_keyboard: true, one_time_keyboard: true },
  });
}

/** Webhook uchun maxfiy sarlavha: token va JWT sirdan hosil qilinadi, alohida o'zgaruvchi kerak emas (Telegram: 1–256 belgi, [A-Za-z0-9_-]) */
export const webhookSecret = () => crypto.createHash('sha256').update(`${config.telegramToken}:${config.jwtSecret}`).digest('hex');
export const webhookPath = '/api/telegram/webhook';

/**
 * Ikki rejim:
 *  - production (https manzil bor): webhook. Hosting uxlab qolsa ham Telegram so'rov yuborib uni uyg'otadi, bir nechta nusxa to'qnashmaydi.
 *  - lokal: long polling (ochiq domen kerak emas).
 */
export async function startBot() {
  if (!config.telegramToken) {
    console.log("[telegram] TELEGRAM_BOT_TOKEN yo'q — Telegram orqali kirish o'chiq");
    return;
  }
  const useWebhook = config.isProd && config.publicUrl.startsWith('https://');
  try {
    bot.username = (await api('getMe')).username;
    if (useWebhook) {
      await api('setWebhook', { url: `${config.publicUrl}${webhookPath}`, secret_token: webhookSecret(), allowed_updates: ['message'], drop_pending_updates: false });
    } else {
      await api('deleteWebhook');
    }
  } catch (e) {
    console.error('[telegram] bot ishga tushmadi:', e.message);
    return;
  }
  console.log(`[telegram] bot ishlayapti: @${bot.username} (${useWebhook ? 'webhook' : 'polling'})`);
  if (useWebhook) return;

  let offset = 0;
  (async function poll() {
    for (;;) {
      try {
        const updates = await api('getUpdates', { offset, timeout: 25, allowed_updates: ['message'] });
        for (const u of updates) {
          offset = u.update_id + 1;
          await handleUpdate(u).catch((e) => console.error('[telegram] update:', e.message));
        }
      } catch (e) {
        console.error('[telegram] polling:', e.message);
        await new Promise((r) => setTimeout(r, 5000));
      }
    }
  })();
}
