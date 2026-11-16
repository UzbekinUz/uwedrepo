import { config } from './config.js';
import { getSettings } from './settings.js';

export const aiAvailable = () => !!config.anthropicKey && getSettings().aiEnabled !== false;

const LANG_NAME = { uz: "o'zbek tilida (lotin yozuvida)", ru: 'на русском языке', en: 'in English' };

/**
 * Talaba noto'g'ri javob bergan test savolini tushuntiradi.
 * To'g'ri javob va muallif izohi modelga beriladi: model javobni o'zi "topmaydi", faqat sababini tushuntiradi
 * (shu bilan xato yechim chiqish ehtimoli kamayadi).
 */
export async function explainMistake({ subject, question, chosen, lang = 'uz' }) {
  const letters = 'ABCDEF';
  const opts = question.options.map((o, i) => `${letters[i]}) ${o}`).join('\n');
  const system =
    `Sen UWED (Jahon iqtisodiyoti va diplomatiya universiteti) talabalariga "${subject}" fanidan yordam beradigan o'qituvchisan. ` +
    `Talaba mashq testida xato qildi. Uning javobi nega noto'g'ri va to'g'ri javob nega to'g'ri ekanini qisqa, aniq, qadamma-qadam tushuntir. ` +
    `Hisob-kitob bo'lsa, asosiy qadamlarni ko'rsat. Ko'pi bilan 180 so'z. Markdown sarlavhalar ishlatma, oddiy matn va qisqa ro'yxat yetarli. ` +
    `Javobni ${LANG_NAME[lang] || LANG_NAME.uz} yoz. Agar berilgan "to'g'ri javob" senga xato bo'lib ko'rinsa, buni ehtiyotkorlik bilan ayt va talabani repetitor bilan tekshirishga undagin.`;
  const user =
    `Savol:\n${question.text}\n\nVariantlar:\n${opts}\n\n` +
    `Talabaning javobi: ${letters[chosen]}) ${question.options[chosen]}\n` +
    `To'g'ri javob: ${letters[question.correct]}) ${question.options[question.correct]}\n` +
    (question.explanation ? `Muallif izohi: ${question.explanation}\n` : '');

  const res = await fetch(`${config.anthropicApi}/v1/messages`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': config.anthropicKey, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({ model: config.anthropicModel, max_tokens: 700, system, messages: [{ role: 'user', content: user }] }),
    signal: AbortSignal.timeout(30000),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    console.error('[ai]', res.status, body.slice(0, 300));
    throw new Error(`AI xizmati javob bermadi (${res.status})`);
  }
  const data = await res.json();
  const text = (data.content || []).filter((c) => c.type === 'text').map((c) => c.text).join('\n').trim();
  if (!text) throw new Error("AI bo'sh javob qaytardi");
  return text;
}
