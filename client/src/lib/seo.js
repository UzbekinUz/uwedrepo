import { useEffect } from 'react';

const SITE = 'UWEDRepo';

function setMeta(attr, key, value) {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!el) { el = document.createElement('meta'); el.setAttribute(attr, key); document.head.appendChild(el); }
  el.setAttribute('content', value);
}

/**
 * Sahifa sarlavhasi, tavsifi va canonical manzilini o'rnatadi (qidiruv tizimi va ijtimoiy tarmoq ko'rinishi uchun).
 * title/description bo'sh bo'lsa (ma'lumot hali yuklanmagan) hech narsa o'zgarmaydi.
 * noindex: shaxsiy sahifalar (kabinet, admin, kirish) qidiruvga chiqmasligi uchun.
 */
export function useSeo(title, description, { noindex = false } = {}) {
  useEffect(() => {
    if (!title) return;
    const full = title.includes(SITE) ? title : `${title} | ${SITE}`;
    document.title = full;
    const url = `${window.location.origin}${window.location.pathname}`;
    let canon = document.head.querySelector('link[rel="canonical"]');
    if (!canon) { canon = document.createElement('link'); canon.rel = 'canonical'; document.head.appendChild(canon); }
    canon.href = url;
    if (description) { setMeta('name', 'description', description); setMeta('property', 'og:description', description); }
    setMeta('property', 'og:title', full);
    setMeta('property', 'og:url', url);
    setMeta('name', 'robots', noindex ? 'noindex, nofollow' : 'index, follow');
  }, [title, description, noindex]);
}
