import { AuditLog } from '../../models/index.js';

/** Admin harakatini jurnalga yozadi (xato bo'lsa asosiy amalni to'xtatmaydi) */
export const audit = (req, action, target = '', meta = undefined) =>
  AuditLog.create({ admin: req.user._id, adminName: req.user.name, action, target: String(target), meta }).catch((e) => console.error('[audit]', e.message));

export function pageOf(req, def = 20) {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || def));
  return { page, limit, skip: (page - 1) * limit };
}
export const pageMeta = (total, page, limit) => ({ total, page, pages: Math.max(1, Math.ceil(total / limit)) });

const cell = (v) => {
  if (v == null) return '';
  if (typeof v === 'number') return String(v);
  let s = v instanceof Date ? v.toISOString() : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`; // Excel formulasi in'ektsiyasidan himoya
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
/** cols: [{label, get(row)}] — Excel ochadigan UTF-8 (BOM) CSV */
export const toCsv = (cols, rows) => `﻿${[cols.map((c) => cell(c.label)).join(','), ...rows.map((r) => cols.map((c) => cell(c.get(r))).join(','))].join('\r\n')}`;

export const sendCsv = (res, name, csv) => {
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${name}"`);
  res.send(csv);
};
