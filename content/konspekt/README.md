# Konspektlar

Saytda o'qiladigan mavzu konspektlari (Materiallar → «O'qish →»). Har bir fayl — bitta mavzu,
fayl raqami fan sahifasidagi mavzu tartibiga (`order`) mos.

Yozish qoidalari `client/src/components/Notes.jsx` boshida: `## sarlavha`, `$$ formula $$`,
`> misol bloki`, `{surat|maxraj}`, `x^2`, `a_{n}`, `lim_{x→0}`, jadvallar.

Saytga yuklash: admin sifatida `POST /api/admin/materials` (`subject`, `title`, `body`, `order`),
yangilash: `PUT /api/admin/materials/:id`.

- `hisoblash-1/` — Hisoblash 1 (XIM, 1-kurs), 15 mavzu. Manba: Moodle'dagi seminar fayllari
  (CALC_S1–S11, Thomas «Calculus» asosida) va ma'ruzalar (1-mavzu ketma-ketlik, 9-mavzu U. Dalabayev).
