# Konspektlar

Saytda o'qiladigan mavzu konspektlari (Materiallar → «O'qish →»). Har bir fayl — bitta mavzu,
fayl raqami fan sahifasidagi mavzu tartibiga (`order`) mos.

Yozish qoidalari `client/src/components/Notes.jsx` boshida: `## sarlavha`, `$$ formula $$`,
`{surat|maxraj}`, `x^2`, `a_{n}`, `lim_{x→0}`, jadvallar va interaktiv bloklar:
`::: maqsad|hayot|oddiy|tushuncha|formula|teorema|eslatma|xato|xulosa`, `::: misol` (yechim `---` dan keyin),
`::: test` (`? savol`, `- variant`, `+ to'g'ri`, `> izoh`), `::: mashq` (`savol || javob`), `::: grafik` (Plot.jsx).

Saytga yuklash: admin sifatida `POST /api/admin/materials` (`subject`, `title`, `body`, `order`),
yangilash: `PUT /api/admin/materials/:id`.

- `hisoblash-1/` — Hisoblash 1 (XIM, 1-kurs), 15 mavzu. Manba: fan ma'ruza va seminar materiallari
  (CALC_S1–S11, Thomas «Calculus» asosida) va ma'ruzalar (1-mavzu ketma-ketlik, 9-mavzu U. Dalabayev).
- `iqtisodiyot-nazariyasi/` — Iqtisodiyot nazariyasi, 15 mavzu (ma'ruza va seminar materiallari asosida).
- `mikroiqtisodiyot/` — Mikroiqtisodiyot, 15 mavzu (ma'ruza va seminar materiallari asosida).
- `menejment/` — Menejment, 15 mavzu (ma'ruza va seminar materiallari asosida).
