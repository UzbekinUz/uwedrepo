::: maqsad
- Bo'laklab integrallash formulasini 30 ta misolda mashq qilish
- **u** va **dv** ni to'g'ri tanlashni o'rganish (LIATE qoidasi)
- Ko'phad, logarifm, teskari trigonometrik va «aylanma» integrallarni yechish
- Har bir misolni avval o'zingiz yeching, keyin «Yechimni ko'rish» tugmasini bosing
:::

::: hayot Nega bu muhim?
Bo'laklab integrallash — aniqmas va aniq integral mavzusidagi eng ko'p tushadigan usul. Nazoratda `x·eˣ`, `x·ln x`, `eˣ·sin x` kabi integrallar deyarli har doim bo'ladi. Qaysi qismni u deb olishni bilgan talaba bunday misolni 2–3 qatorda yechadi.
:::

## Formula va qoida

::: formula Bo'laklab integrallash
`∫u dv = uv − ∫v du`

1. Integral ostidagi ifodani ikki qismga ajrating: **u** (differensiallanadigan) va **dv** (integrallanadigan).
2. `du = u′dx` va `v = ∫dv` ni toping.
3. Formulaga qo'ying: yangi integral `∫v du` dastlabkisidan soddaroq bo'lishi kerak.
:::

::: eslatma LIATE qoidasi: u ni qanday tanlash
**u** sifatida ro'yxatda **oldinroq** turgan funksiya olinadi:
**L**ogarifmik → **I**nvers trigonometrik (arctg, arcsin) → **A**lgebraik (ko'phad) → **T**rigonometrik → **E**ksponensial.
Masalan, `x·eˣ` da u = x (algebraik), `x·ln x` da u = ln x (logarifmik).
:::

## A) Ko'phad × ko'rsatkichli yoki trigonometrik funksiya

::: misol 1. ∫ x·eˣ dx · oson
Integralni hisoblang.
---
- u = x, dv = eˣdx ⇒ du = dx, v = eˣ.
- `∫x·eˣdx = x·eˣ − ∫eˣdx = x·eˣ − eˣ`.
- **Javob:** `(x − 1)eˣ + C`.
:::

::: misol 2. ∫ x·sin x dx · oson
Integralni hisoblang.
---
- u = x, dv = sin x dx ⇒ du = dx, v = −cos x.
- `∫x·sin x dx = −x cos x + ∫cos x dx`.
- **Javob:** `−x cos x + sin x + C`.
:::

::: misol 3. ∫ x·cos x dx · oson
Integralni hisoblang.
---
- u = x, dv = cos x dx ⇒ du = dx, v = sin x.
- `∫x·cos x dx = x sin x − ∫sin x dx`.
- **Javob:** `x sin x + cos x + C`.
:::

::: misol 4. ∫ x·e⁻ˣ dx · oson
Integralni hisoblang.
---
- u = x, dv = e⁻ˣdx ⇒ du = dx, v = −e⁻ˣ.
- `∫x·e⁻ˣdx = −x·e⁻ˣ + ∫e⁻ˣdx = −x·e⁻ˣ − e⁻ˣ`.
- **Javob:** `−(x + 1)e⁻ˣ + C`.
:::

::: misol 5. ∫ x·e²ˣ dx · oson
Integralni hisoblang.
---
- u = x, dv = e²ˣdx ⇒ du = dx, `v = {e²ˣ|2}`.
- `∫x·e²ˣdx = {x·e²ˣ|2} − {1|2}∫e²ˣdx = {x·e²ˣ|2} − {e²ˣ|4}`.
- **Javob:** `{e²ˣ(2x − 1)|4} + C`.
:::

::: misol 6. ∫ x·sin 2x dx · o'rta
Integralni hisoblang.
---
- u = x, dv = sin 2x dx ⇒ du = dx, `v = −{cos 2x|2}`.
- `∫x·sin 2x dx = −{x cos 2x|2} + {1|2}∫cos 2x dx`.
- **Javob:** `−{x cos 2x|2} + {sin 2x|4} + C`.
:::

::: misol 7. ∫ x·cos 3x dx · o'rta
Integralni hisoblang.
---
- u = x, dv = cos 3x dx ⇒ du = dx, `v = {sin 3x|3}`.
- `∫x·cos 3x dx = {x sin 3x|3} − {1|3}∫sin 3x dx`.
- **Javob:** `{x sin 3x|3} + {cos 3x|9} + C`.
:::

::: misol 8. ∫ x·sin x·cos x dx · o'rta
Integralni hisoblang.
---
- Avval soddalashtiramiz: `sin x·cos x = {sin 2x|2}`, demak integral `{1|2}∫x·sin 2x dx`.
- 6-misol natijasidan: `{1|2}(−{x cos 2x|2} + {sin 2x|4})`.
- **Javob:** `−{x cos 2x|4} + {sin 2x|8} + C`.
:::

## B) Yuqori darajali ko'phadlar (bir necha marta bo'laklash)

::: eslatma Qoida
Ko'phad darajasi n bo'lsa, bo'laklash **n marta** takrorlanadi: har safar ko'phad darajasi bittaga kamayadi.
:::

::: misol 9. ∫ x²·eˣ dx · o'rta
Integralni hisoblang.
---
- u = x², dv = eˣdx ⇒ du = 2x dx, v = eˣ.
- `∫x²eˣdx = x²eˣ − 2∫x·eˣdx`; 1-misoldan `∫x·eˣdx = (x − 1)eˣ`.
- `x²eˣ − 2(x − 1)eˣ`.
- **Javob:** `(x² − 2x + 2)eˣ + C`.
:::

::: misol 10. ∫ x²·e⁻ˣ dx · o'rta
Integralni hisoblang.
---
- u = x², dv = e⁻ˣdx ⇒ du = 2x dx, v = −e⁻ˣ.
- `∫x²e⁻ˣdx = −x²e⁻ˣ + 2∫x·e⁻ˣdx`; 4-misoldan `∫x·e⁻ˣdx = −(x + 1)e⁻ˣ`.
- `−x²e⁻ˣ − 2(x + 1)e⁻ˣ`.
- **Javob:** `−(x² + 2x + 2)e⁻ˣ + C`.
:::

::: misol 11. ∫ x²·sin x dx · o'rta
Integralni hisoblang.
---
- u = x², dv = sin x dx ⇒ du = 2x dx, v = −cos x.
- `∫x² sin x dx = −x² cos x + 2∫x cos x dx`; 3-misoldan `∫x cos x dx = x sin x + cos x`.
- **Javob:** `−x² cos x + 2x sin x + 2cos x + C`.
:::

::: misol 12. ∫ x²·cos x dx · o'rta
Integralni hisoblang.
---
- u = x², dv = cos x dx ⇒ du = 2x dx, v = sin x.
- `∫x² cos x dx = x² sin x − 2∫x sin x dx`; 2-misoldan `∫x sin x dx = −x cos x + sin x`.
- **Javob:** `x² sin x + 2x cos x − 2sin x + C`.
:::

::: misol 13. ∫ x³·eˣ dx · qiyin
Integralni hisoblang.
---
- u = x³, dv = eˣdx ⇒ du = 3x²dx, v = eˣ.
- `∫x³eˣdx = x³eˣ − 3∫x²eˣdx`; 9-misoldan `∫x²eˣdx = (x² − 2x + 2)eˣ`.
- `x³eˣ − 3(x² − 2x + 2)eˣ`.
- **Javob:** `(x³ − 3x² + 6x − 6)eˣ + C`.
:::

## C) Logarifmik funksiyalar

::: eslatma Qoida
Logarifm bor joyda doim **u = ln x** (yoki ln f(x)) olinadi: uning hosilasi `{1|x}` — integral soddalashadi.
:::

::: misol 14. ∫ ln x dx · oson
Integralni hisoblang.
---
- u = ln x, dv = dx ⇒ `du = {dx|x}`, v = x.
- `∫ln x dx = x ln x − ∫x·{1|x}dx = x ln x − ∫dx`.
- **Javob:** `x ln x − x + C`.
:::

::: misol 15. ∫ x·ln x dx · oson
Integralni hisoblang.
---
- u = ln x, dv = x dx ⇒ `du = {dx|x}`, `v = {x²|2}`.
- `∫x ln x dx = {x²|2}ln x − ∫{x|2}dx`.
- **Javob:** `{x²|2}ln x − {x²|4} + C`.
:::

::: misol 16. ∫ x²·ln x dx · oson
Integralni hisoblang.
---
- u = ln x, dv = x²dx ⇒ `du = {dx|x}`, `v = {x³|3}`.
- `∫x² ln x dx = {x³|3}ln x − ∫{x²|3}dx`.
- **Javob:** `{x³|3}ln x − {x³|9} + C`.
:::

::: misol 17. ∫ x³·ln x dx · oson
Integralni hisoblang.
---
- u = ln x, dv = x³dx ⇒ `du = {dx|x}`, `v = {x⁴|4}`.
- `∫x³ ln x dx = {x⁴|4}ln x − ∫{x³|4}dx`.
- **Javob:** `{x⁴|4}ln x − {x⁴|16} + C`.
:::

::: misol 18. ∫ ln²x dx · o'rta
Integralni hisoblang.
---
- u = ln²x, dv = dx ⇒ `du = {2ln x|x}dx`, v = x.
- `∫ln²x dx = x ln²x − 2∫ln x dx`; 14-misoldan `∫ln x dx = x ln x − x`.
- **Javob:** `x ln²x − 2x ln x + 2x + C`.
:::

::: misol 19. ∫ ln x / x² dx · o'rta
Integralni hisoblang.
---
- u = ln x, `dv = {dx|x²}` ⇒ `du = {dx|x}`, `v = −{1|x}`.
- `∫{ln x|x²}dx = −{ln x|x} + ∫{dx|x²} = −{ln x|x} − {1|x}`.
- **Javob:** `−{ln x + 1|x} + C`.
:::

::: misol 20. ∫ ln(x² + 1) dx · qiyin
Integralni hisoblang.
---
- u = ln(x² + 1), dv = dx ⇒ `du = {2x|x² + 1}dx`, v = x.
- `∫ln(x² + 1)dx = x ln(x² + 1) − ∫{2x²|x² + 1}dx`.
- Kasrni ajratamiz: `{x²|x² + 1} = 1 − {1|x² + 1}`, demak `∫{2x²|x² + 1}dx = 2x − 2arctg x`.
- **Javob:** `x ln(x² + 1) − 2x + 2arctg x + C`.
:::

## D) Teskari trigonometrik funksiyalar

::: misol 21. ∫ arctg x dx · o'rta
Integralni hisoblang.
---
- u = arctg x, dv = dx ⇒ `du = {dx|1 + x²}`, v = x.
- `∫arctg x dx = x arctg x − ∫{x|1 + x²}dx`.
- `∫{x|1 + x²}dx = {1|2}ln(1 + x²)` (t = 1 + x² almashtirish).
- **Javob:** `x arctg x − {1|2}ln(1 + x²) + C`.
:::

::: misol 22. ∫ arcsin x dx · o'rta
Integralni hisoblang.
---
- u = arcsin x, dv = dx ⇒ `du = {dx|√(1 − x²)}`, v = x.
- `∫arcsin x dx = x arcsin x − ∫{x|√(1 − x²)}dx`.
- `∫{x|√(1 − x²)}dx = −√(1 − x²)` (t = 1 − x² almashtirish).
- **Javob:** `x arcsin x + √(1 − x²) + C`.
:::

::: misol 23. ∫ arccos x dx · o'rta
Integralni hisoblang.
---
- u = arccos x, dv = dx ⇒ `du = −{dx|√(1 − x²)}`, v = x.
- `∫arccos x dx = x arccos x + ∫{x|√(1 − x²)}dx = x arccos x − √(1 − x²)`.
- **Javob:** `x arccos x − √(1 − x²) + C`.
:::

::: misol 24. ∫ x·arctg x dx · qiyin
Integralni hisoblang.
---
- u = arctg x, dv = x dx ⇒ `du = {dx|1 + x²}`, `v = {x²|2}`.
- `∫x arctg x dx = {x²|2}arctg x − {1|2}∫{x²|1 + x²}dx`.
- `∫{x²|1 + x²}dx = ∫(1 − {1|1 + x²})dx = x − arctg x`.
- `{x²|2}arctg x − {x|2} + {1|2}arctg x`.
- **Javob:** `{x² + 1|2}·arctg x − {x|2} + C`.
:::

## E) «Aylanma» integrallar

::: eslatma Usul
Ikki marta bo'laklagandan keyin **dastlabki integral I yana paydo bo'ladi**. Uni tenglamaning chap tomoniga o'tkazib, I ni topamiz. Ikkala bo'laklashda ham u uchun bir xil turdagi funksiya (masalan, trigonometrik) olinadi.
:::

::: misol 25. ∫ eˣ·sin x dx · qiyin
Integralni hisoblang.
---
- I = ∫eˣ sin x dx. u = sin x, dv = eˣdx: `I = eˣ sin x − ∫eˣ cos x dx`.
- Yana bo'laklaymiz (u = cos x): `∫eˣ cos x dx = eˣ cos x + ∫eˣ sin x dx = eˣ cos x + I`.
- `I = eˣ sin x − eˣ cos x − I` ⇒ `2I = eˣ(sin x − cos x)`.
- **Javob:** `{eˣ(sin x − cos x)|2} + C`.
:::

::: misol 26. ∫ eˣ·cos x dx · qiyin
Integralni hisoblang.
---
- J = ∫eˣ cos x dx. u = cos x, dv = eˣdx: `J = eˣ cos x + ∫eˣ sin x dx`.
- `∫eˣ sin x dx = eˣ sin x − J` (u = sin x).
- `J = eˣ cos x + eˣ sin x − J` ⇒ `2J = eˣ(sin x + cos x)`.
- **Javob:** `{eˣ(sin x + cos x)|2} + C`.
:::

::: misol 27. ∫ e²ˣ·sin 3x dx · qiyin
Integralni hisoblang.
---
- I = ∫e²ˣ sin 3x dx. u = e²ˣ, dv = sin 3x dx: `I = −{e²ˣcos 3x|3} + {2|3}∫e²ˣcos 3x dx`.
- `∫e²ˣcos 3x dx = {e²ˣsin 3x|3} − {2|3}I`.
- `I = −{e²ˣcos 3x|3} + {2e²ˣsin 3x|9} − {4|9}I` ⇒ `{13|9}I = {e²ˣ(2sin 3x − 3cos 3x)|9}`.
- **Javob:** `{e²ˣ(2sin 3x − 3cos 3x)|13} + C`.
- Umumiy formula: `∫e^{ax}sin bx dx = {e^{ax}(a sin bx − b cos bx)|a² + b²} + C`.
:::

::: misol 28. ∫ sec³x dx · qiyin
Integralni hisoblang.
---
- u = sec x, dv = sec²x dx ⇒ du = sec x·tg x dx, v = tg x.
- `I = sec x·tg x − ∫sec x·tg²x dx`, bunda tg²x = sec²x − 1.
- `I = sec x·tg x − I + ∫sec x dx`, `∫sec x dx = ln|sec x + tg x|`.
- `2I = sec x·tg x + ln|sec x + tg x|`.
- **Javob:** `{1|2}(sec x·tg x + ln|sec x + tg x|) + C`.
:::

## F) Aralash misollar

::: misol 29. ∫ x·sec²x dx · o'rta
Integralni hisoblang.
---
- u = x, dv = sec²x dx ⇒ du = dx, v = tg x.
- `∫x sec²x dx = x tg x − ∫tg x dx`, `∫tg x dx = −ln|cos x|`.
- **Javob:** `x tg x + ln|cos x| + C`.
:::

::: misol 30. ∫ e^{√x} dx · qiyin
Integralni hisoblang.
---
- Avval almashtirish: t = √x ⇒ x = t², dx = 2t dt.
- `∫e^{√x}dx = 2∫t·eᵗdt`; 1-misoldan `∫t·eᵗdt = (t − 1)eᵗ`.
- **Javob:** `2(√x − 1)e^{√x} + C`.
:::

## Javoblar jadvali

| № | Integral | Javob |
|---|---|---|
| 1 | ∫ x·eˣ dx | `(x − 1)eˣ + C` |
| 2 | ∫ x·sin x dx | `−x cos x + sin x + C` |
| 3 | ∫ x·cos x dx | `x sin x + cos x + C` |
| 4 | ∫ x·e⁻ˣ dx | `−(x + 1)e⁻ˣ + C` |
| 5 | ∫ x·e²ˣ dx | `{e²ˣ(2x − 1)|4} + C` |
| 6 | ∫ x·sin 2x dx | `−{x cos 2x|2} + {sin 2x|4} + C` |
| 7 | ∫ x·cos 3x dx | `{x sin 3x|3} + {cos 3x|9} + C` |
| 8 | ∫ x·sin x·cos x dx | `−{x cos 2x|4} + {sin 2x|8} + C` |
| 9 | ∫ x²·eˣ dx | `(x² − 2x + 2)eˣ + C` |
| 10 | ∫ x²·e⁻ˣ dx | `−(x² + 2x + 2)e⁻ˣ + C` |
| 11 | ∫ x²·sin x dx | `−x² cos x + 2x sin x + 2cos x + C` |
| 12 | ∫ x²·cos x dx | `x² sin x + 2x cos x − 2sin x + C` |
| 13 | ∫ x³·eˣ dx | `(x³ − 3x² + 6x − 6)eˣ + C` |
| 14 | ∫ ln x dx | `x ln x − x + C` |
| 15 | ∫ x·ln x dx | `{x²|2}ln x − {x²|4} + C` |
| 16 | ∫ x²·ln x dx | `{x³|3}ln x − {x³|9} + C` |
| 17 | ∫ x³·ln x dx | `{x⁴|4}ln x − {x⁴|16} + C` |
| 18 | ∫ ln²x dx | `x ln²x − 2x ln x + 2x + C` |
| 19 | ∫ ln x / x² dx | `−{ln x + 1|x} + C` |
| 20 | ∫ ln(x² + 1) dx | `x ln(x² + 1) − 2x + 2arctg x + C` |
| 21 | ∫ arctg x dx | `x arctg x − {1|2}ln(1 + x²) + C` |
| 22 | ∫ arcsin x dx | `x arcsin x + √(1 − x²) + C` |
| 23 | ∫ arccos x dx | `x arccos x − √(1 − x²) + C` |
| 24 | ∫ x·arctg x dx | `{x² + 1|2}·arctg x − {x|2} + C` |
| 25 | ∫ eˣ·sin x dx | `{eˣ(sin x − cos x)|2} + C` |
| 26 | ∫ eˣ·cos x dx | `{eˣ(sin x + cos x)|2} + C` |
| 27 | ∫ e²ˣ·sin 3x dx | `{e²ˣ(2sin 3x − 3cos 3x)|13} + C` |
| 28 | ∫ sec³x dx | `{1|2}(sec x·tg x + ln∣sec x + tg x∣) + C` |
| 29 | ∫ x·sec²x dx | `x tg x + ln∣cos x∣ + C` |
| 30 | ∫ e^{√x} dx | `2(√x − 1)e^{√x} + C` |

::: xato
- **u ni noto'g'ri tanlash.** `∫x·ln x dx` da u = x olsangiz, v = ∫ln x dx — integral murakkablashadi. LIATE bo'yicha u = ln x.
- **v ni topishda koeffitsiyentni unutish.** `∫e²ˣdx = {e²ˣ|2}`, `∫sin 3x dx = −{cos 3x|3}`.
- **Minus ishorasini yo'qotish.** `∫sin x dx = −cos x`; formulada «− ∫v du» ham borligini unutmang.
- **Aylanma integralda to'xtab qolish.** I yana paydo bo'lsa — bu xato emas: tenglama tuzib, I ni toping.
:::

::: xulosa
Bo'laklab integrallash formulasi: `∫u dv = uv − ∫v du`. u ni LIATE qoidasi bo'yicha tanlang: logarifm, teskari trigonometrik, ko'phad, trigonometrik, eksponensial. Ko'phad darajasi qancha bo'lsa, shuncha marta bo'laklanadi; «aylanma» integrallarda dastlabki integral tenglamadan topiladi.
:::
