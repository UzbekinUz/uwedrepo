import { Router } from 'express';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import overview from './overview.js';
import people from './people.js';
import money from './money.js';
import content from './content.js';
import system from './system.js';

const r = Router();
// Barcha admin yo'llari: kirgan va admin roli bor foydalanuvchi uchun (server tomonida tekshiriladi)
r.use(requireAuth, requireRole('admin'));
r.use(overview, people, money, content, system);

export default r;
