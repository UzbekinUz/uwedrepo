# Konspektlar

Saytda o'qiladigan mavzu konspektlari (Materiallar → «O'qish →»). Har bir fayl — bitta mavzu,
fayl raqami fan sahifasidagi mavzu tartibiga (`order`) mos.

Yozish qoidalari `client/src/components/Notes.jsx` boshida: `## sarlavha`, `$$ formula $$`,
`{surat|maxraj}`, `x^2`, `a_{n}`, `lim_{x→0}`, jadvallar va interaktiv bloklar:
`::: maqsad|hayot|oddiy|tushuncha|formula|teorema|eslatma|xato|xulosa`, `::: misol` (yechim `---` dan keyin),
`::: test` (`? savol`, `- variant`, `+ to'g'ri`, `> izoh`), `::: mashq` (`savol || javob`), `::: grafik` (Plot.jsx).

Saytga yuklash: admin sifatida `POST /api/admin/materials` (`subject`, `title`, `body`, `order`),
yangilash: `PUT /api/admin/materials/:id`.

- `hisoblash-1/` — Hisoblash 1 (XIM, 1-kurs), 15 mavzu. Manba: Moodle'dagi seminar fayllari
  (CALC_S1–S11, Thomas «Calculus» asosida) va ma'ruzalar (1-mavzu ketma-ketlik, 9-mavzu U. Dalabayev).
- `miqdoriy-usullar/` — Iqtisodiyotda miqdoriy usullar (XIM, 2-kurs), 15 mavzu + `testlar.json` (5 ta mashq testi, 61 savol;
  `POST /api/quizzes` uchun). Manba: Moodle'dagi ma'ruza rejalari (IMU_M1–M14, Umarova Sh.G.); 13-mavzu uchun Moodle'da fayl yo'q.
