import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { User } from '../models/index.js';

export const signToken = (user) => jwt.sign({ id: user._id }, config.jwtSecret, { expiresIn: '14d' });

async function load(req) {
  const h = req.headers.authorization || '';
  if (!h.startsWith('Bearer ')) return null;
  try {
    const { id } = jwt.verify(h.slice(7), config.jwtSecret);
    const u = await User.findById(id);
    return u;
  } catch {
    return null;
  }
}

export async function optionalAuth(req, _res, next) {
  const u = await load(req);
  req.user = u && !u.blocked ? u : null;
  next();
}

export async function requireAuth(req, res, next) {
  req.user = await load(req);
  if (!req.user) return res.status(401).json({ error: 'Avval tizimga kiring' });
  if (req.user.blocked) return res.status(403).json({ error: "Akkaunt bloklangan. Administrator bilan bog'laning." });
  next();
}

export const requireRole = (...roles) => (req, res, next) =>
  roles.includes(req.user?.role) ? next() : res.status(403).json({ error: "Ruxsat yo'q" });
