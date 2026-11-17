import { Router } from 'express';
import { Subject, Tutor, Material } from './models/index.js';
import { wrap } from './middleware/util.js';

/**
 * Qidiruv tizimlari uchun: /robots.txt va dinamik /sitemap.xml.
 * Asosiy manzil PUBLIC_URL (masalan https://uwedrepo.uz). Berilmasa, so'rov kelgan manzil olinadi.
 * Diqqat: Render'ning o'z manzili (...onrender.com) emas, o'zingizning domeningiz PUBLIC_URL'ga yozilishi kerak,
 * aks holda sitemap Search Console'dagi domen bilan mos kelmaydi.
 */
const base = (req) => (process.env.PUBLIC_URL || `${req.protocol}://${req.get('host')}`).replace(/\/$/, '');

// Ommaviy statik sahifalar: [yo'l, ustuvorlik, yangilanish chastotasi]
const STATIC = [
  ['/', 1.0, 'daily'],
  ['/tutors', 0.9, 'daily'],
  ['/subjects', 0.9, 'weekly'],
  ['/materials', 0.7, 'weekly'],
  ['/quizzes', 0.6, 'weekly'],
  ['/calendar', 0.7, 'weekly'],
];

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const day = (d) => (d ? new Date(d).toISOString().slice(0, 10) : undefined);

let cache = { at: 0, key: '', xml: '' };
const TTL = 10 * 60e3; // 10 daqiqa: har so'rovda bazaga bormaslik uchun

export function createSeoRouter() {
  const r = Router();

  r.get('/robots.txt', (req, res) => {
    res.type('text/plain').send(
      ['User-agent: *', 'Allow: /', 'Disallow: /admin', 'Disallow: /my', 'Disallow: /tutor', 'Disallow: /login', 'Disallow: /register', 'Disallow: /api/', '', `Sitemap: ${base(req)}/sitemap.xml`, ''].join('\n')
    );
  });

  r.get(
    '/sitemap.xml',
    wrap(async (req, res) => {
      const origin = base(req);
      if (cache.key === origin && Date.now() - cache.at < TTL) return res.type('application/xml').send(cache.xml);

      const [subjects, tutors, notes] = await Promise.all([
        Subject.find({ active: { $ne: false } }).select('_id updatedAt').lean(),
        Tutor.find({ status: 'approved' }).select('_id updatedAt').lean(),
        // Saytning o'zida o'qiladigan matnli konspektlar (tashqi havolalar emas): qidiruv uchun eng qimmatli kontent
        Material.find({ status: 'approved', url: '', body: { $ne: '' } }).select('_id updatedAt').lean(),
      ]);
      const url = (loc, { lastmod, priority, changefreq }) =>
        `  <url><loc>${esc(origin + loc)}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ''}<changefreq>${changefreq}</changefreq><priority>${priority.toFixed(1)}</priority></url>`;
      const rows = [
        ...STATIC.map(([p, priority, changefreq]) => url(p, { priority, changefreq })),
        ...subjects.map((s) => url(`/subjects/${s._id}`, { lastmod: day(s.updatedAt), priority: 0.8, changefreq: 'weekly' })),
        ...notes.map((m) => url(`/materials/${m._id}`, { lastmod: day(m.updatedAt), priority: 0.8, changefreq: 'monthly' })),
        ...tutors.map((t) => url(`/tutors/${t._id}`, { lastmod: day(t.updatedAt), priority: 0.8, changefreq: 'weekly' })),
      ];
      const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${rows.join('\n')}\n</urlset>\n`;
      cache = { at: Date.now(), key: origin, xml };
      res.type('application/xml').send(xml);
    })
  );
  return r;
}
