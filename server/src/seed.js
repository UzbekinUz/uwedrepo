import bcrypt from 'bcryptjs';
import { config } from './config.js';
import { User, Subject, Exam, Tutor, Material, Booking, Review, Survey, Visit } from './models/index.js';

const day = (n, h = 10) => {
  const d = new Date(Date.now() + n * 86400e3);
  const ymd = new Date(d.getTime() + 5 * 3600e3).toISOString().slice(0, 10);
  return new Date(`${ymd}T${String(h).padStart(2, '0')}:00:00+05:00`);
};

async function ensureAdmin() {
  if (await User.exists({ role: 'admin' })) return;
  await User.create({
    name: 'Admin',
    email: config.adminEmail,
    password: await bcrypt.hash(config.adminPassword, 10),
    role: 'admin',
  });
  console.log(`[seed] admin yaratildi: ${config.adminEmail}`);
}

// Hisobotdagi haqiqiy fanlar (Xalqaro iqtisodiyot va menejment). Production'da ham shular yoziladi;
// boshqa fakultet fanlari va rasmiy sanalarni admin paneldan kiriting.
const S = (name, years, category = 'core', faculty = 'xim', extra = {}) => ({ name, years, category, faculty, ...extra });
const STARTER_SUBJECTS = () => [
  S('Hisoblash 1', [1], 'core', 'xim', { description: 'Matematik hisoblash asoslari' }),
  S('Hisoblash 2', [2]),
  S('Iqtisodiyotda miqdoriy usullar', [2, 3]),
  S('Ekonomika', [1]),
  S('Rus tili 1', [1]),
  S('Rus tili 2', [2]),
  S('IELTS', [1, 2, 3, 4], 'extra', 'all', { description: 'IELTS/CEFR tayyorgarlik' }),
  S('Dasturlash', [1, 2, 3, 4], 'extra', 'all', { description: 'Python va dasturlash asoslari' }),
];

async function seedDemo() {
  const subjects = await Subject.insertMany(STARTER_SUBJECTS());
  const by = Object.fromEntries(subjects.map((s) => [s.name, s]));

  // DEMO sanalar — rasmiy sanalarni admin paneldan kiriting
  await Exam.insertMany([
    { subject: by['Hisoblash 1']._id, type: 'oraliq', date: day(16), note: 'Demo sana' },
    { subject: by['Ekonomika']._id, type: 'oraliq', date: day(19), note: 'Demo sana' },
    { subject: by['Rus tili 1']._id, type: 'oraliq', date: day(23), note: 'Demo sana' },
    { subject: by['Hisoblash 2']._id, type: 'oraliq', date: day(17), note: 'Demo sana' },
    { subject: by['Iqtisodiyotda miqdoriy usullar']._id, type: 'oraliq', date: day(21), note: 'Demo sana' },
    { subject: by['Hisoblash 1']._id, type: 'yakuniy', date: day(60), note: 'Demo sana' },
    { subject: by['Ekonomika']._id, type: 'yakuniy', date: day(63), note: 'Demo sana' },
    { subject: by['Rus tili 1']._id, type: 'yakuniy', date: day(66), note: 'Demo sana' },
  ]);

  const pw = await bcrypt.hash('Demo12345', 10);
  const mk = (name, email, year, extra = {}) => ({ name, email, password: pw, role: 'tutor', faculty: 'xim', year, ...extra });
  const users = await User.insertMany([
    mk('Aziza Karimova', 'aziza@demo.uz', 4),
    mk('Bobur Rahimov', 'bobur@demo.uz', 3),
    mk('Dilnoza Yusupova', 'dilnoza@demo.uz', 4),
    mk('Jasur Toshmatov', 'jasur@demo.uz', 3),
  ]);
  const avail = (...a) => a.map(([day, from, to]) => ({ day, from, to }));
  await Tutor.insertMany([
    {
      user: users[0]._id, status: 'approved', featured: true,
      headline: 'Hisoblash va Ekonomika — imtihongacha tizimli tayyorlov',
      bio: "4-kurs talabasi. Hisoblash 1-2 va Ekonomika fanlaridan 2 yillik repetitorlik tajribasi.",
      experience: '2 yil, 30+ o\'quvchi', pricePerHour: 80000, formats: ['online', 'offline'], languages: ['uz', 'ru'],
      subjects: [by['Hisoblash 1']._id, by['Hisoblash 2']._id, by['Ekonomika']._id],
      availability: avail([1, '16:00', '20:00'], [3, '16:00', '20:00'], [6, '10:00', '14:00']), telegram: '@demo_aziza',
    },
    {
      user: users[1]._id, status: 'approved',
      headline: 'IELTS 7.5 — Writing va Speaking bo\'yicha amaliy mashqlar',
      bio: 'IELTS Overall 7.5. Har dars oxirida yozma ishga batafsil fikr-mulohaza.',
      experience: '1.5 yil', pricePerHour: 120000, formats: ['online'], languages: ['en', 'uz'],
      subjects: [by['IELTS']._id],
      availability: avail([2, '18:00', '21:00'], [4, '18:00', '21:00'], [0, '11:00', '15:00']), telegram: '@demo_bobur',
    },
    {
      user: users[2]._id, status: 'approved',
      headline: "Rus tili 1-2 va miqdoriy usullar",
      bio: "Rus tili grammatikasi va iqtisodiy terminologiya. O'zbek tilida tushuntiraman.",
      experience: '1 yil', pricePerHour: 60000, formats: ['online', 'offline'], languages: ['uz', 'ru'],
      subjects: [by['Rus tili 1']._id, by['Rus tili 2']._id, by['Iqtisodiyotda miqdoriy usullar']._id],
      availability: avail([1, '14:00', '18:00'], [5, '14:00', '18:00']), telegram: '@demo_dilnoza',
    },
    {
      user: users[3]._id, status: 'approved',
      headline: 'Python: noldan loyihagacha',
      bio: 'Dasturlash asoslari, algoritmlar, kichik loyihalar.',
      experience: '2 yil', pricePerHour: 90000, formats: ['online'], languages: ['uz', 'ru', 'en'],
      subjects: [by['Dasturlash']._id],
      availability: avail([2, '19:00', '22:00'], [6, '15:00', '19:00']), telegram: '@demo_jasur',
    },
  ]);

  await Material.insertMany([
    { subject: by['Hisoblash 1']._id, title: '(demo) Hisoblash 1 — konspekt', type: 'konspekt', url: 'https://example.com/hisoblash1-konspekt', status: 'approved' },
    { subject: by['Hisoblash 1']._id, title: '(demo) Oraliq nazorat savollari', type: 'savollar', url: 'https://example.com/hisoblash1-savollar', status: 'approved' },
    { subject: by['Ekonomika']._id, title: '(demo) Ekonomika — test to\'plami', type: 'test', url: 'https://example.com/ekonomika-test', status: 'approved' },
    { subject: by['IELTS']._id, title: '(demo) IELTS Writing Task 2 namunalari', type: 'video', url: 'https://example.com/ielts-writing', status: 'approved' },
  ]);
  console.log('[seed] demo ma\'lumotlar yozildi (demo repetitorlar paroli: Demo12345)');
}

export async function seedIfEmpty() {
  await ensureAdmin();
  // Demo ma'lumotlar (ma'lum parolli repetitorlar!) production'da yozilmaydi, faqat SEED_DEMO=true bilan
  const allowDemo = !config.isProd || process.env.SEED_DEMO === 'true';
  if (!(await Subject.countDocuments())) {
    if (allowDemo) await seedDemo();
    else {
      await Subject.insertMany(STARTER_SUBJECTS());
      console.log("[seed] boshlang'ich fanlar yozildi (demo foydalanuvchilarsiz)");
    }
  }
}

// `npm run seed` — hamma narsani tozalab qayta yozadi
if (process.argv[1]?.endsWith('seed.js')) {
  const { connectDb } = await import('./db.js');
  await connectDb();
  await Promise.all([User, Subject, Exam, Tutor, Material, Booking, Review, Survey, Visit].map((m) => m.deleteMany({})));
  await seedIfEmpty();
  process.exit(0);
}
