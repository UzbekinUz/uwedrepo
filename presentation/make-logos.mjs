// Logotip fayllaridan sayt uchun kerakli o'lchamlarni yaratadi: node make-logos.mjs <1.png> <2.png>
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';

const [lockup, icon] = process.argv.slice(2);
const out = path.resolve('../client/public');
fs.mkdirSync(out, { recursive: true });

// Ikonkaning asosiy rangi (rounded-square fonidan): apple-touch-icon uchun burchaklarni to'ldiradi
const px = await sharp(icon).extract({ left: 60, top: 512, width: 1, height: 1 }).raw().toBuffer();
const bg = { r: px[0], g: px[1], b: px[2], alpha: 1 };
console.log('ikonka rangi:', `#${[px[0], px[1], px[2]].map((v) => v.toString(16).padStart(2, '0')).join('')}`);

const png = (name, buf) => { fs.writeFileSync(path.join(out, name), buf); console.log('yozildi', name, Math.round(buf.length / 1024) + ' KB'); };
const sq = (size) => sharp(icon).resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png({ compressionLevel: 9 }).toBuffer();

png('logo-icon.png', await sq(192)); // sarlavhada (retina uchun 2x)
png('favicon.png', await sq(64));
png('icon-192.png', await sq(192));
png('icon-512.png', await sq(512));
png('apple-touch-icon.png', await sharp(icon).resize(180, 180).flatten({ background: bg }).png({ compressionLevel: 9 }).toBuffer());
// To'liq logotip: shaffof chetlarini kesib tashlaymiz
png('logo.png', await sharp(lockup).trim({ threshold: 5 }).resize({ width: 900 }).png({ compressionLevel: 9 }).toBuffer());

fs.writeFileSync(path.join(out, 'manifest.webmanifest'), JSON.stringify({
  name: 'UWEDRepo',
  short_name: 'UWEDRepo',
  description: "UWED talabalari uchun repetitorlar, materiallar va nazorat sanalari",
  start_url: '/',
  display: 'standalone',
  background_color: '#F3F5F2',
  theme_color: '#0A7E7A',
  icons: [
    { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
    { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
  ],
}, null, 2) + '\n');
console.log('yozildi manifest.webmanifest');
