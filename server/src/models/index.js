import mongoose from 'mongoose';
import { FACULTY_KEYS, FORMATS, LANGUAGES, MATERIAL_TYPES, EXAM_TYPES } from '../data/meta.js';

const { Schema, model } = mongoose;
const ref = (name, extra = {}) => ({ type: Schema.Types.ObjectId, ref: name, ...extra });

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    // Telegram orqali kirgan foydalanuvchida email va parol bo'lmaydi
    email: { type: String, unique: true, sparse: true, lowercase: true, trim: true },
    password: { type: String, select: false },
    telegramId: { type: String, unique: true, sparse: true },
    phone: { type: String, trim: true, maxlength: 20 },
    role: { type: String, enum: ['student', 'tutor', 'admin'], default: 'student' },
    blocked: { type: Boolean, default: false },
    faculty: { type: String, enum: FACULTY_KEYS },
    year: { type: Number, min: 1, max: 4 },
    telegram: { type: String, trim: true, maxlength: 64 },
  },
  { timestamps: true }
);

const subjectSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    faculty: { type: String, enum: [...FACULTY_KEYS, 'all'], required: true },
    years: { type: [Number], default: [1, 2, 3, 4] },
    category: { type: String, enum: ['core', 'extra'], default: 'core' },
    description: { type: String, default: '' },
    telegramGroup: { type: String, default: '' },
    // false bo'lsa talabalarga ko'rinmaydi (arxiv), lekin nazorat sanalari va materiallari saqlanadi
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const examSchema = new Schema(
  {
    subject: ref('Subject', { required: true }),
    type: { type: String, enum: EXAM_TYPES, required: true },
    date: { type: Date, required: true },
    note: { type: String, default: '' },
  },
  { timestamps: true }
);

const tutorSchema = new Schema(
  {
    user: ref('User', { required: true, unique: true }),
    subjects: [ref('Subject')],
    headline: { type: String, required: true, maxlength: 120 },
    bio: { type: String, default: '', maxlength: 1500 },
    experience: { type: String, default: '', maxlength: 300 },
    pricePerHour: { type: Number, required: true, min: 10000, max: 2000000 },
    formats: { type: [{ type: String, enum: FORMATS }], default: ['online'] },
    languages: { type: [{ type: String, enum: LANGUAGES }], default: ['uz'] },
    // day: 0=yakshanba ... 6=shanba; from/to: "HH:00"
    availability: [{ day: { type: Number, min: 0, max: 6 }, from: String, to: String, _id: false }],
    telegram: { type: String, default: '' },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    rejectReason: { type: String, default: '', maxlength: 300 },
    featured: { type: Boolean, default: false },
    ratingAvg: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
    lessonsCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const materialSchema = new Schema(
  {
    subject: ref('Subject', { required: true }),
    title: { type: String, required: true, trim: true, maxlength: 140 },
    type: { type: String, enum: MATERIAL_TYPES, required: true },
    url: { type: String, required: true },
    description: { type: String, default: '', maxlength: 500 },
    author: ref('User'),
    status: { type: String, enum: ['pending', 'approved'], default: 'pending' },
  },
  { timestamps: true }
);

const bookingSchema = new Schema(
  {
    student: ref('User', { required: true }),
    tutor: ref('Tutor', { required: true }),
    subject: ref('Subject', { required: true }),
    startsAt: { type: Date, required: true },
    durationMin: { type: Number, default: 60 },
    price: Number,
    discount: { type: Number, default: 0 },
    total: Number,
    commission: Number,
    payout: Number,
    status: { type: String, enum: ['pending', 'confirmed', 'paid', 'completed', 'cancelled'], default: 'pending' },
    paymentMethod: { type: String, enum: ['click', 'payme', 'card', 'manual'] },
    payoutPaid: { type: Boolean, default: false }, // repetitorga ulushi o'tkazib berilganmi
    payoutAt: Date,
    paidAt: Date,
    refunded: { type: Boolean, default: false },
    note: { type: String, default: '', maxlength: 500 },
  },
  { timestamps: true }
);
bookingSchema.index({ tutor: 1, startsAt: 1 });
// Bir vaqtda ikki so'rov bir slotni ololmasligi uchun: faol bronlar orasida (tutor, vaqt) noyob
bookingSchema.index(
  { tutor: 1, startsAt: 1 },
  { unique: true, name: 'tutor_slot_active', partialFilterExpression: { status: { $in: ['pending', 'confirmed', 'paid', 'completed'] } } }
);

const reviewSchema = new Schema(
  {
    booking: ref('Booking', { required: true, unique: true }),
    student: ref('User', { required: true }),
    tutor: ref('Tutor', { required: true }),
    rating: { type: Number, min: 1, max: 5, required: true },
    comment: { type: String, default: '', maxlength: 800 },
    hidden: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const surveySchema = new Schema(
  {
    role: { type: String, enum: ['student', 'tutor'], default: 'student' },
    faculty: String,
    year: Number,
    searchHoursPerWeek: Number,
    trustReviews: { type: Number, min: 1, max: 5 },
    willingToPay: Boolean,
    monthlyBudget: Number,
    tutorInterest: Boolean,
    needs: [String],
    comment: { type: String, maxlength: 800 },
  },
  { timestamps: true }
);

// Telegram bot orqali bir martalik kod: sayt token yaratadi, bot kod beradi, foydalanuvchi kodni saytga kiritadi
const telegramLoginSchema = new Schema(
  {
    token: { type: String, required: true, unique: true },
    code: String,
    attempts: { type: Number, default: 0 },
    telegramId: String,
    username: String,
    firstName: String,
    lastName: String,
    phone: String,
    expiresAt: { type: Date, required: true, index: { expireAfterSeconds: 0 } },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

const visitSchema = new Schema({ sid: String, path: String, ref: String }, { timestamps: { createdAt: true, updatedAt: false } });
visitSchema.index({ createdAt: 1 });

export const User = model('User', userSchema);
export const Subject = model('Subject', subjectSchema);
export const Exam = model('Exam', examSchema);
export const Tutor = model('Tutor', tutorSchema);
export const Material = model('Material', materialSchema);
export const Booking = model('Booking', bookingSchema);
export const Review = model('Review', reviewSchema);
export const Survey = model('Survey', surveySchema);
export const Visit = model('Visit', visitSchema);
export const TelegramLogin = model('TelegramLogin', telegramLoginSchema);

// Admin tomonidan boshqariladigan sozlamalar (bitta hujjat)
const settingsSchema = new Schema({
  key: { type: String, default: 'main', unique: true },
  commission: Number,
  firstLessonDiscount: Number,
  cancelHours: Number,
  registrationOpen: Boolean,
  banner: { text: { type: String, maxlength: 200, default: '' }, kind: { type: String, enum: ['info', 'warn'], default: 'info' }, active: { type: Boolean, default: false } },
});

// Admin harakatlari jurnali
const auditSchema = new Schema(
  { admin: ref('User'), adminName: String, action: String, target: String, meta: Schema.Types.Mixed },
  { timestamps: { createdAt: true, updatedAt: false } }
);
auditSchema.index({ createdAt: -1 });

// Telegram orqali yuborilgan e'lonlar
const announcementSchema = new Schema(
  {
    text: { type: String, required: true, maxlength: 1000 },
    audience: { type: String, enum: ['all', 'students', 'tutors'], default: 'all' },
    total: { type: Number, default: 0 },
    sent: { type: Number, default: 0 },
    failed: { type: Number, default: 0 },
    status: { type: String, enum: ['sending', 'done'], default: 'sending' },
    by: ref('User'),
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const Settings = model('Settings', settingsSchema);
export const AuditLog = model('AuditLog', auditSchema);
export const Announcement = model('Announcement', announcementSchema);
