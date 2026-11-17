::: maqsad
- Funksiyani **8 qadamli sxema** bo'yicha to'liq tekshirishni mashq qilish
- 20 ta misol: ko'phadlar, kasr funksiyalar, ko'rsatkichli va logarifmik funksiyalar
- Har bir misolda bosqichma-bosqich yechim va grafik — avval o'zingiz yeching, keyin «Yechimni ko'rish» tugmasini bosing
:::

::: hayot Nega bu muhim?
Grafik — funksiyaning «portreti». Firma foydasi qachon eng katta, xarajat qayerda eng kam, talab narxga qanday javob beradi — bularni funksiyani tekshirib bilamiz. Imtihonda esa «tekshiring va grafigini chizing» topshirig'i deyarli har doim bo'ladi: sxemani bilgan talaba uni tez va xatosiz bajaradi.
:::

## Tekshirish sxemasi

::: formula 8 qadam
1. **Aniqlanish sohasi** D(f).
2. **Juft-toqlik:** f(−x) = f(x) — juft (Oy ga simmetrik), f(−x) = −f(x) — toq (koordinata boshiga simmetrik).
3. **Vertikal asimptota:** x = a, agar `lim_{x→a} f(x) = ±∞` (odatda maxraj nolga aylanadigan nuqtalar).
4. **Gorizontal va og'ma asimptota:** y = kx + b, bunda `k = lim_{x→±∞} {f(x)|x}`, `b = lim_{x→±∞} (f(x) − kx)`; k = 0 bo'lsa — gorizontal.
5. **O'sish va kamayish, ekstremumlar:** f′(x) ishorasi; f′ ishorasi + dan − ga o'tsa — max, − dan + ga — min.
6. **Botiq va qavariqlik, egilish nuqtalari:** f″(x) ishorasi; f″ ishorasi almashgan nuqta — egilish nuqtasi.
7. **Kesishish nuqtalari:** Oy bilan (x = 0), Ox bilan (f(x) = 0).
8. **Grafik:** barcha natijalarni bitta chizmada birlashtirish.
:::

::: eslatma Atamalar
- f″ > 0 — **botiq** (∪, «chashka»), f″ < 0 — **qavariq** (∩, «gumbaz»).
- f′ = 0 bo'lgan nuqta har doim ham ekstremum emas: f′ ishorasini **almashtirishi** kerak (masalan, y = x³ da x = 0).
:::

## 1-to'plam

::: misol y = x⁴ · oson
Funksiyani 8 qadam bo'yicha tekshiring va grafigini chizing.
---
- **1)** **Soha:** D = ℝ.
- **2)** **Juft:** (−x)^4 = x^4 — grafik Oy ga simmetrik.
- **3–4)** **Asimptotalar yo'q** (ko'phad).
- **5)** y′ = 4x^3: x < 0 da y′ < 0 — **kamayadi**, x > 0 da y′ > 0 — **o'sadi**. **min (0; 0)**.
- **6)** y″ = 12x^2 ≥ 0 — butun sohada **botiq**. x = 0 da y″ = 0, lekin ishora almashmaydi — **egilish nuqtasi yo'q**.
- **7)** Kesishish: faqat (0; 0).
- **8)** Grafik y = x² ga o'xshash, lekin tagida «yassiroq», chetlarda tikroq.
::: grafik x: -2..2, y: -1..5 | y = x⁴
y = x^4 | teal | y = x⁴
nuqta 0, 0 | min (0; 0)
:::
:::

::: misol y = ∛x · oson
Funksiyani 8 qadam bo'yicha tekshiring va grafigini chizing.
---
- **1)** **Soha:** D = ℝ (kub ildiz manfiy sondan ham olinadi).
- **2)** **Toq:** ∛(−x) = −∛x — koordinata boshiga simmetrik.
- **3–4)** **Asimptotalar yo'q:** {∛x|x} → 0, lekin ∛x − 0·x → ±∞.
- **5)** y′ = {1|3∛(x^2)} > 0 (x ≠ 0) — butun sohada **o'sadi**, ekstremum yo'q. x = 0 da hosila yo'q: y′ → +∞ — **vertikal urinma**.
- **6)** y″ = −{2|9x∛(x^2)}: x < 0 da y″ > 0 — **botiq**; x > 0 da y″ < 0 — **qavariq**. **Egilish (0; 0)**.
- **7)** Kesishish: (0; 0).
- **8)** Grafik koordinata boshida «tik» o'tadi, chetlarda sekin o'sadi.
::: grafik x: -8..8, y: -2.5..2.5 | y = ∛x
y = cbrt(x) | teal | y = ∛x
nuqta 0, 0 | egilish, vertikal urinma
nuqta 8, 2 | (8; 2)
nuqta -8, -2 | (−8; −2)
:::
:::

::: misol y = x³ − 3x² · oson
Funksiyani 8 qadam bo'yicha tekshiring va grafigini chizing.
---
- **1)** **Soha:** D = ℝ.
- **2)** **Juft ham, toq ham emas.**
- **3–4)** **Asimptotalar yo'q.**
- **5)** y′ = 3x^2 − 6x = 3x(x − 2) = 0 ⇒ x = 0, x = 2. (−∞; 0) da **o'sadi**, (0; 2) da **kamayadi**, (2; +∞) da **o'sadi**. **max (0; 0)**, **min (2; −4)**.
- **6)** y″ = 6x − 6 = 0 ⇒ x = 1. x < 1 — **qavariq**, x > 1 — **botiq**. **Egilish (1; −2)**.
- **7)** Kesishish: x^2(x − 3) = 0 ⇒ (0; 0) va (3; 0).
::: grafik x: -1.5..4, y: -5..3 | y = x³ − 3x²
y = x^3 - 3*x^2 | teal | y = x³ − 3x² | -1.2..3.6
nuqta 0, 0 | max (0; 0)
nuqta 2, -4 | min (2; −4)
nuqta 1, -2 | egilish (1; −2)
nuqta 3, 0 | (3; 0)
:::
:::

::: misol y = x³ − x − 1 · o'rta
Funksiyani 8 qadam bo'yicha tekshiring va grafigini chizing.
---
- **1)** **Soha:** D = ℝ.
- **2)** **Juft ham, toq ham emas** (ozod had −1 bor).
- **3–4)** **Asimptotalar yo'q.**
- **5)** y′ = 3x^2 − 1 = 0 ⇒ x = ±{1|√3} ≈ ±0,577. **max** (−0,577; −0,615), **min** (0,577; −1,385). Oraliqlar: (−∞; −0,577) o'sadi, (−0,577; 0,577) kamayadi, (0,577; +∞) o'sadi.
- **6)** y″ = 6x: x < 0 qavariq, x > 0 botiq. **Egilish (0; −1)**.
- **7)** Oy: (0; −1). Ox: maksimum ham manfiy (−0,615 < 0), demak **bitta** ildiz: x ≈ **1,325** (masalan, oraliqni ikkiga bo'lish usuli bilan: f(1) = −1 < 0, f(2) = 5 > 0).
::: grafik x: -2..2.2, y: -4..4 | y = x³ − x − 1
y = x^3 - x - 1 | teal | y = x³ − x − 1 | -1.9..2.05
nuqta -0.577, -0.615 | max
nuqta 0.577, -1.385 | min
nuqta 0, -1 | egilish (0; −1)
nuqta 1.325, 0 | x ≈ 1,325
:::
:::

::: misol y = x(x − 1)³ · o'rta
Funksiyani 8 qadam bo'yicha tekshiring va grafigini chizing.
---
- **1)** **Soha:** D = ℝ.
- **2)** **Juft ham, toq ham emas.**
- **3–4)** **Asimptotalar yo'q.**
- **5)** y′ = (x − 1)^3 + 3x(x − 1)^2 = (x − 1)^2(4x − 1). Kritik nuqtalar: x = {1|4}, x = 1.
- x < {1|4}: y′ < 0 — **kamayadi**; x > {1|4}: y′ > 0 — **o'sadi** (x = 1 da y′ = 0, lekin ishora almashmaydi).
- **min** ({1|4}; −{27|256}) ≈ (0,25; −0,105). x = 1 — ekstremum **emas**.
- **6)** y″ = 6(x − 1)(2x − 1) = 0 ⇒ x = {1|2}, x = 1. x < {1|2} botiq, {1|2} < x < 1 qavariq, x > 1 botiq. **Egilish:** ({1|2}; −{1|16}) va (1; 0) — ikkinchisida urinma gorizontal.
- **7)** Kesishish: (0; 0) va (1; 0).
::: grafik x: -0.3..1.5, y: -0.2..0.55 | y = x(x − 1)³
y = x*(x - 1)^3 | teal | y = x(x − 1)³ | -0.25..1.48
nuqta 0.25, -0.105 | min
nuqta 0.5, -0.0625 | egilish
nuqta 1, 0 | egilish (1; 0)
:::
:::

::: misol y = x / (x² + 1) · o'rta
Funksiyani 8 qadam bo'yicha tekshiring va grafigini chizing.
---
- **1)** **Soha:** D = ℝ (x^2 + 1 > 0).
- **2)** **Toq** — koordinata boshiga simmetrik.
- **3)** **Vertikal asimptota yo'q.**
- **4)** `lim_{x→±∞} {x|x^2 + 1} = 0` ⇒ **gorizontal asimptota y = 0**.
- **5)** y′ = {1 − x^2|(x^2 + 1)^2} = 0 ⇒ x = ±1. (−∞; −1) kamayadi, (−1; 1) o'sadi, (1; +∞) kamayadi. **min (−1; −{1|2})**, **max (1; {1|2})**.
- **6)** y″ = {2x(x^2 − 3)|(x^2 + 1)^3} = 0 ⇒ x = 0, x = ±√3. **Egilish:** (0; 0), (±√3; ±{√3|4}) ≈ (±1,73; ±0,43). x < −√3 qavariq, (−√3; 0) botiq, (0; √3) qavariq, x > √3 botiq.
- **7)** Kesishish: (0; 0).
::: grafik x: -6..6, y: -0.7..0.7 | y = x / (x² + 1)
y = x/(x^2 + 1) | teal | y = x/(x² + 1)
nuqta -1, -0.5 | min
nuqta 1, 0.5 | max
nuqta 0, 0 | egilish
nuqta 1.732, 0.433 |
nuqta -1.732, -0.433 |
:::
:::

::: misol y = x + 4/x · o'rta
Funksiyani 8 qadam bo'yicha tekshiring va grafigini chizing.
---
- **1)** **Soha:** x ≠ 0.
- **2)** **Toq.**
- **3)** `lim_{x→0^{+}} y = +∞`, `lim_{x→0^{−}} y = −∞` ⇒ **vertikal asimptota x = 0**.
- **4)** k = lim {y|x} = 1, b = lim (y − x) = lim {4|x} = 0 ⇒ **og'ma asimptota y = x**.
- **5)** y′ = 1 − {4|x^2} = {x^2 − 4|x^2} = 0 ⇒ x = ±2. (−∞; −2) o'sadi, (−2; 0) va (0; 2) kamayadi, (2; +∞) o'sadi. **max (−2; −4)**, **min (2; 4)**. E'tibor: max < min — chunki ular turli tarmoqlarda.
- **6)** y″ = {8|x^3}: x < 0 qavariq, x > 0 botiq. Egilish yo'q (x = 0 sohaga kirmaydi).
- **7)** Ox va Oy bilan kesishmaydi (x^2 + 4 ≠ 0).
::: grafik x: -8..8, y: -12..12 | y = x + 4/x
y = x + 4/x | teal | y = x + 4/x | -8..-0.35
y = x + 4/x | teal | | 0.35..8
y = x | slate | og'ma asimptota y = x
nuqta -2, -4 | max (−2; −4)
nuqta 2, 4 | min (2; 4)
:::
:::

::: misol y = x² / (x − 1) · murakkab
Funksiyani 8 qadam bo'yicha tekshiring va grafigini chizing.
---
- **1)** **Soha:** x ≠ 1.
- **2)** **Juft ham, toq ham emas.**
- **3)** x → 1^{+}: y → +∞; x → 1^{−}: y → −∞ ⇒ **vertikal asimptota x = 1**.
- **4)** Bo'lish: {x^2|x − 1} = x + 1 + {1|x − 1} ⇒ **og'ma asimptota y = x + 1**.
- **5)** y′ = 1 − {1|(x − 1)^2} = {x(x − 2)|(x − 1)^2} = 0 ⇒ x = 0, x = 2. (−∞; 0) o'sadi, (0; 1) va (1; 2) kamayadi, (2; +∞) o'sadi. **max (0; 0)**, **min (2; 4)**.
- **6)** y″ = {2|(x − 1)^3}: x < 1 qavariq, x > 1 botiq; egilish yo'q.
- **7)** Kesishish: (0; 0).
::: grafik x: -4..6, y: -12..14 | y = x² / (x − 1)
y = x^2/(x - 1) | teal | y = x²/(x − 1) | -4..0.92
y = x^2/(x - 1) | teal | | 1.1..6
y = x + 1 | slate | og'ma asimptota y = x + 1
vertikal 1 | x = 1
nuqta 0, 0 | max (0; 0)
nuqta 2, 4 | min (2; 4)
:::
:::

::: misol y = x / (x² − 1) · murakkab
Funksiyani 8 qadam bo'yicha tekshiring va grafigini chizing.
---
- **1)** **Soha:** x ≠ ±1.
- **2)** **Toq.**
- **3)** **Vertikal asimptotalar x = −1 va x = 1:** x → 1^{+}: +∞, x → 1^{−}: −∞; x → −1^{+}: +∞, x → −1^{−}: −∞.
- **4)** `lim_{x→±∞} y = 0` ⇒ **gorizontal asimptota y = 0**.
- **5)** y′ = −{x^2 + 1|(x^2 − 1)^2} < 0 — har bir oraliqda **kamayadi**, ekstremum yo'q.
- **6)** y″ = {2x(x^2 + 3)|(x^2 − 1)^3}: x < −1 qavariq, (−1; 0) botiq, (0; 1) qavariq, x > 1 botiq. **Egilish (0; 0)**.
- **7)** Kesishish: (0; 0).
::: grafik x: -4..4, y: -5..5 | y = x / (x² − 1)
y = x/(x^2 - 1) | teal | y = x/(x² − 1) | -4..-1.12
y = x/(x^2 - 1) | teal | | -0.88..0.88
y = x/(x^2 - 1) | teal | | 1.12..4
vertikal -1 | x = −1
vertikal 1 | x = 1
nuqta 0, 0 | egilish (0; 0)
:::
:::

::: misol y = x·e⁻ˣ · murakkab
Funksiyani 8 qadam bo'yicha tekshiring va grafigini chizing.
---
- **1)** **Soha:** D = ℝ.
- **2)** **Juft ham, toq ham emas.**
- **3)** **Vertikal asimptota yo'q.**
- **4)** x → +∞: `x e^{−x} = {x|e^{x}} → 0` (Lopital qoidasi) ⇒ **y = 0 — o'ngda gorizontal asimptota**. x → −∞ da y → −∞.
- **5)** y′ = e^{−x}(1 − x) = 0 ⇒ x = 1. x < 1 o'sadi, x > 1 kamayadi. **max (1; {1|e}) ≈ (1; 0,37)**.
- **6)** y″ = e^{−x}(x − 2) = 0 ⇒ x = 2. x < 2 qavariq, x > 2 botiq. **Egilish (2; {2|e^2}) ≈ (2; 0,27)**.
- **7)** Kesishish: (0; 0).
::: grafik x: -1..7, y: -2..0.6 | y = x·e⁻ˣ
y = x*exp(-x) | teal | y = x·e⁻ˣ | -0.8..7
nuqta 1, 0.368 | max
nuqta 2, 0.271 | egilish
:::
:::

## 2-to'plam

::: misol y = x³ − 3x · oson
Funksiyani 8 qadam bo'yicha tekshiring va grafigini chizing.
---
- **1)** **Soha:** D = ℝ.
- **2)** **Toq.**
- **3–4)** **Asimptotalar yo'q.**
- **5)** y′ = 3x^2 − 3 = 3(x − 1)(x + 1) = 0 ⇒ x = ±1. (−∞; −1) o'sadi, (−1; 1) kamayadi, (1; +∞) o'sadi. **max (−1; 2)**, **min (1; −2)**.
- **6)** y″ = 6x: x < 0 qavariq, x > 0 botiq. **Egilish (0; 0)**.
- **7)** Kesishish: x(x^2 − 3) = 0 ⇒ x = 0, x = ±√3 ≈ ±1,73.
::: grafik x: -2.5..2.5, y: -4..4 | y = x³ − 3x
y = x^3 - 3*x | teal | y = x³ − 3x | -2.15..2.15
nuqta -1, 2 | max (−1; 2)
nuqta 1, -2 | min (1; −2)
nuqta 0, 0 | egilish
nuqta 1.732, 0 |
nuqta -1.732, 0 |
:::
:::

::: misol y = x⁴ − 2x² · oson
Funksiyani 8 qadam bo'yicha tekshiring va grafigini chizing.
---
- **1)** **Soha:** D = ℝ.
- **2)** **Juft.**
- **3–4)** **Asimptotalar yo'q.**
- **5)** y′ = 4x^3 − 4x = 4x(x − 1)(x + 1) = 0 ⇒ x = 0, ±1. (−∞; −1) kamayadi, (−1; 0) o'sadi, (0; 1) kamayadi, (1; +∞) o'sadi. **min (±1; −1)**, **max (0; 0)**.
- **6)** y″ = 12x^2 − 4 = 0 ⇒ x = ±{1|√3} ≈ ±0,577; y = {1|9} − {2|3} = −{5|9}. **Egilish (±{1|√3}; −{5|9})**. ∣x∣ < {1|√3} da qavariq, ∣x∣ > {1|√3} da botiq.
- **7)** Kesishish: x^2(x^2 − 2) = 0 ⇒ x = 0, x = ±√2 ≈ ±1,41.
::: grafik x: -2..2, y: -1.5..3.5 | y = x⁴ − 2x²
y = x^4 - 2*x^2 | teal | y = x⁴ − 2x² | -1.75..1.75
nuqta -1, -1 | min
nuqta 1, -1 | min
nuqta 0, 0 | max
nuqta 0.577, -0.556 |
nuqta -0.577, -0.556 |
:::
:::

::: misol y = (x − 1)²(x + 2) · oson
Funksiyani 8 qadam bo'yicha tekshiring va grafigini chizing.
---
- **1)** **Soha:** D = ℝ.
- **2)** **Juft ham, toq ham emas.**
- **3–4)** **Asimptotalar yo'q.**
- **5)** Qavslarni ochamiz: y = x^3 − 3x + 2. y′ = 3x^2 − 3 = 0 ⇒ x = ±1. **max (−1; 4)**, **min (1; 0)**. (−∞; −1) o'sadi, (−1; 1) kamayadi, (1; +∞) o'sadi.
- **6)** y″ = 6x: x < 0 qavariq, x > 0 botiq. **Egilish (0; 2)**.
- **7)** Oy: (0; 2). Ox: x = −2 va x = 1 (ikki karrali ildiz — grafik Ox ga **urinadi**, kesib o'tmaydi).
::: grafik x: -2.6..2.4, y: -4..7 | y = (x − 1)²(x + 2)
y = (x - 1)^2*(x + 2) | teal | y = (x − 1)²(x + 2) | -2.3..2.2
nuqta -1, 4 | max (−1; 4)
nuqta 1, 0 | min (1; 0)
nuqta 0, 2 | egilish (0; 2)
nuqta -2, 0 | (−2; 0)
:::
:::

::: misol y = x / (x − 2) · o'rta
Funksiyani 8 qadam bo'yicha tekshiring va grafigini chizing.
---
- **1)** **Soha:** x ≠ 2.
- **2)** **Juft ham, toq ham emas.**
- **3)** x → 2^{+}: +∞, x → 2^{−}: −∞ ⇒ **vertikal asimptota x = 2**.
- **4)** y = 1 + {2|x − 2} ⇒ **gorizontal asimptota y = 1**.
- **5)** y′ = −{2|(x − 2)^2} < 0 — har oraliqda **kamayadi**, ekstremum yo'q.
- **6)** y″ = {4|(x − 2)^3}: x < 2 qavariq, x > 2 botiq; egilish yo'q.
- **7)** Kesishish: (0; 0).
::: grafik x: -4..8, y: -6..8 | y = x / (x − 2)
y = x/(x - 2) | teal | y = x/(x − 2) | -4..1.72
y = x/(x - 2) | teal | | 2.3..8
vertikal 2 | x = 2
gorizontal 1 | y = 1
nuqta 0, 0 | (0; 0)
:::
:::

::: misol y = 1 / (x² − 4) · o'rta
Funksiyani 8 qadam bo'yicha tekshiring va grafigini chizing.
---
- **1)** **Soha:** x ≠ ±2.
- **2)** **Juft.**
- **3)** **Vertikal asimptotalar x = ±2:** x → 2^{+}: +∞, x → 2^{−}: −∞ (simmetriya bo'yicha x → −2^{−}: +∞, x → −2^{+}: −∞).
- **4)** `lim_{x→±∞} y = 0` ⇒ **gorizontal asimptota y = 0**.
- **5)** y′ = −{2x|(x^2 − 4)^2}: x < 0 da o'sadi, x > 0 da kamayadi. **max (0; −{1|4})** — lokal maksimum, garchi qiymati manfiy bo'lsa ham.
- **6)** y″ = {6x^2 + 8|(x^2 − 4)^3}: ∣x∣ < 2 da qavariq, ∣x∣ > 2 da botiq; egilish yo'q.
- **7)** Oy: (0; −{1|4}). Ox bilan kesishmaydi.
::: grafik x: -5..5, y: -3..3 | y = 1 / (x² − 4)
y = 1/(x^2 - 4) | teal | y = 1/(x² − 4) | -5..-2.09
y = 1/(x^2 - 4) | teal | | -1.9..1.9
y = 1/(x^2 - 4) | teal | | 2.09..5
vertikal -2 | x = −2
vertikal 2 | x = 2
nuqta 0, -0.25 | max (0; −1/4)
:::
:::

::: misol y = x³ / (x² − 1) · murakkab
Funksiyani 8 qadam bo'yicha tekshiring va grafigini chizing.
---
- **1)** **Soha:** x ≠ ±1.
- **2)** **Toq.**
- **3)** **Vertikal asimptotalar x = ±1** (x → 1^{+}: +∞, x → 1^{−}: −∞; toqlik bo'yicha x = −1 da ham).
- **4)** Bo'lish: {x^3|x^2 − 1} = x + {x|x^2 − 1} ⇒ **og'ma asimptota y = x**.
- **5)** y′ = {x^2(x^2 − 3)|(x^2 − 1)^2} = 0 ⇒ x = 0, x = ±√3. ∣x∣ > √3 da o'sadi, qolgan oraliqlarda kamayadi. **max (−√3; −{3√3|2}) ≈ (−1,73; −2,60)**, **min (√3; {3√3|2}) ≈ (1,73; 2,60)**. x = 0 — ekstremum emas (y′ ishorasi almashmaydi).
- **6)** y″ = {2x(x^2 + 3)|(x^2 − 1)^3}: x < −1 qavariq, (−1; 0) botiq, (0; 1) qavariq, x > 1 botiq. **Egilish (0; 0)**.
- **7)** Kesishish: (0; 0).
::: grafik x: -4..4, y: -8..8 | y = x³ / (x² − 1)
y = x^3/(x^2 - 1) | teal | y = x³/(x² − 1) | -4..-1.08
y = x^3/(x^2 - 1) | teal | | -0.93..0.93
y = x^3/(x^2 - 1) | teal | | 1.08..4
y = x | slate | og'ma asimptota y = x
vertikal -1 | x = −1
vertikal 1 | x = 1
nuqta -1.732, -2.598 | max
nuqta 1.732, 2.598 | min
nuqta 0, 0 | egilish
:::
:::

::: misol y = x²·e⁻ˣ · murakkab
Funksiyani 8 qadam bo'yicha tekshiring va grafigini chizing.
---
- **1)** **Soha:** D = ℝ; y ≥ 0.
- **2)** **Juft ham, toq ham emas.**
- **3)** **Vertikal asimptota yo'q.**
- **4)** x → +∞: {x^2|e^{x}} → 0 (Lopital qoidasini ikki marta qo'llab) ⇒ **y = 0 — o'ngda gorizontal asimptota**; x → −∞ da y → +∞.
- **5)** y′ = e^{−x}(2x − x^2) = x(2 − x)e^{−x} = 0 ⇒ x = 0, x = 2. (−∞; 0) kamayadi, (0; 2) o'sadi, (2; +∞) kamayadi. **min (0; 0)**, **max (2; {4|e^2}) ≈ (2; 0,54)**.
- **6)** y″ = e^{−x}(x^2 − 4x + 2) = 0 ⇒ x = 2 ± √2 ≈ 0,59 va 3,41. **Egilish** ≈ (0,59; 0,19) va (3,41; 0,38). x < 2 − √2 botiq, oraliqda qavariq, x > 2 + √2 botiq.
- **7)** Kesishish: (0; 0).
::: grafik x: -1..8, y: -0.1..0.8 | y = x²·e⁻ˣ
y = x^2*exp(-x) | teal | y = x²·e⁻ˣ | -0.6..8
nuqta 0, 0 | min (0; 0)
nuqta 2, 0.541 | max
nuqta 0.586, 0.191 | egilish
nuqta 3.414, 0.384 | egilish
:::
:::

::: misol y = ln(x² + 1) · murakkab
Funksiyani 8 qadam bo'yicha tekshiring va grafigini chizing.
---
- **1)** **Soha:** D = ℝ (x^2 + 1 > 0); y ≥ 0.
- **2)** **Juft.**
- **3–4)** **Asimptotalar yo'q:** {y|x} → 0, lekin y → +∞ (logarifm cheksiz, juda sekin o'sadi).
- **5)** y′ = {2x|x^2 + 1}: x < 0 kamayadi, x > 0 o'sadi. **min (0; 0)**.
- **6)** y″ = {2(1 − x^2)|(x^2 + 1)^2} = 0 ⇒ x = ±1. ∣x∣ < 1 botiq, ∣x∣ > 1 qavariq. **Egilish (±1; ln 2) ≈ (±1; 0,69)**.
- **7)** Kesishish: (0; 0).
::: grafik x: -4..4, y: -0.5..3 | y = ln(x² + 1)
y = ln(x^2 + 1) | teal | y = ln(x² + 1)
nuqta 0, 0 | min (0; 0)
nuqta 1, 0.693 | egilish
nuqta -1, 0.693 | egilish
:::
:::

::: misol y = x·ln x · murakkab
Funksiyani 8 qadam bo'yicha tekshiring va grafigini chizing.
---
- **1)** **Soha:** x > 0.
- **2)** **Juft-toqlik tekshirilmaydi** — soha simmetrik emas.
- **3)** `lim_{x→0^{+}} x ln x = 0` (Lopital: {ln x|1/x} → {1/x|−1/x^2} = −x → 0) ⇒ **vertikal asimptota yo'q**; grafik (0; 0) nuqtaga yaqinlashadi, lekin u sohaga kirmaydi.
- **4)** x → +∞ da y → +∞, {y|x} = ln x → ∞ ⇒ **og'ma asimptota yo'q**.
- **5)** y′ = ln x + 1 = 0 ⇒ x = {1|e} ≈ 0,37. (0; {1|e}) kamayadi, ({1|e}; +∞) o'sadi. **min ({1|e}; −{1|e}) ≈ (0,37; −0,37)**.
- **6)** y″ = {1|x} > 0 — butun sohada **botiq**, egilish yo'q.
- **7)** Ox: x ln x = 0 ⇒ x = 1, nuqta (1; 0). Oy bilan kesishmaydi.
::: grafik x: 0..3, y: -0.6..3.5 | y = x·ln x
y = x*ln(x) | teal | y = x·ln x | 0.001..3
nuqta 0, 0 | | ochiq
nuqta 0.368, -0.368 | min
nuqta 1, 0 | (1; 0)
:::
:::

::: misol y = e^{−x²} · murakkab
Funksiyani 8 qadam bo'yicha tekshiring va grafigini chizing.
---
- **1)** **Soha:** D = ℝ; 0 < y ≤ 1.
- **2)** **Juft.**
- **3)** **Vertikal asimptota yo'q.**
- **4)** `lim_{x→±∞} e^{−x^2} = 0` ⇒ **gorizontal asimptota y = 0**.
- **5)** y′ = −2x e^{−x^2}: x < 0 o'sadi, x > 0 kamayadi. **max (0; 1)**.
- **6)** y″ = (4x^2 − 2)e^{−x^2} = 0 ⇒ x = ±{1|√2} ≈ ±0,71. ∣x∣ < 0,71 qavariq, ∣x∣ > 0,71 botiq. **Egilish (±0,71; e^{−1/2}) ≈ (±0,71; 0,61)**.
- **7)** Oy: (0; 1). Ox bilan kesishmaydi.
- **8)** Bu — mashhur «qo'ng'iroq» egri chizig'i: statistikada normal taqsimot aynan shu shaklda.
::: grafik x: -3..3, y: -0.1..1.2 | y = exp(−x²) — «qo'ng'iroq» egri chizig'i
y = exp(-(x^2)) | teal | y = exp(−x²)
nuqta 0, 1 | max (0; 1)
nuqta 0.707, 0.607 | egilish
nuqta -0.707, 0.607 | egilish
:::
:::

## Javoblar jadvali

| № | Funksiya | Asimptotalar | Ekstremumlar | Egilish |
|---|---|---|---|---|
| 1.1 | y = x⁴ | yo'q | min (0; 0) | yo'q |
| 1.2 | y = ∛x | yo'q | yo'q | (0; 0) |
| 1.3 | y = x³ − 3x² | yo'q | max (0; 0), min (2; −4) | (1; −2) |
| 1.4 | y = x³ − x − 1 | yo'q | max (−0,58; −0,62), min (0,58; −1,38) | (0; −1) |
| 1.5 | y = x(x − 1)³ | yo'q | min (0,25; −0,105) | (0,5; −0,0625), (1; 0) |
| 1.6 | y = x/(x² + 1) | y = 0 | min (−1; −0,5), max (1; 0,5) | (0; 0), (±√3; ±0,43) |
| 1.7 | y = x + 4/x | x = 0, y = x | max (−2; −4), min (2; 4) | yo'q |
| 1.8 | y = x²/(x − 1) | x = 1, y = x + 1 | max (0; 0), min (2; 4) | yo'q |
| 1.9 | y = x/(x² − 1) | x = ±1, y = 0 | yo'q | (0; 0) |
| 1.10 | y = x·e⁻ˣ | y = 0 (x → +∞) | max (1; 1/e) | (2; 2/e²) |
| 2.1 | y = x³ − 3x | yo'q | max (−1; 2), min (1; −2) | (0; 0) |
| 2.2 | y = x⁴ − 2x² | yo'q | max (0; 0), min (±1; −1) | (±0,58; −5/9) |
| 2.3 | y = (x − 1)²(x + 2) | yo'q | max (−1; 4), min (1; 0) | (0; 2) |
| 2.4 | y = x/(x − 2) | x = 2, y = 1 | yo'q | yo'q |
| 2.5 | y = 1/(x² − 4) | x = ±2, y = 0 | max (0; −1/4) | yo'q |
| 2.6 | y = x³/(x² − 1) | x = ±1, y = x | max (−√3; −2,6), min (√3; 2,6) | (0; 0) |
| 2.7 | y = x²·e⁻ˣ | y = 0 (x → +∞) | min (0; 0), max (2; 4/e²) | x = 2 ± √2 |
| 2.8 | y = ln(x² + 1) | yo'q | min (0; 0) | (±1; ln 2) |
| 2.9 | y = x·ln x | yo'q | min (1/e; −1/e) | yo'q |
| 2.10 | y = e^{−x²} | y = 0 | max (0; 1) | (±1/√2; e^{−1/2}) |

::: xato
- **f′ = 0 nuqtani avtomatik ekstremum deb yozish.** y = x(x − 1)³ da x = 1 yoki y = x³/(x² − 1) da x = 0 — ekstremum emas.
- **Turli tarmoqlardagi max va min ni solishtirish.** y = x + 4/x da max (−4) min (4) dan kichik — bu xato emas.
- **Og'ma asimptotani unutish.** Surat darajasi maxrajdan 1 ga katta bo'lsa — og'ma asimptota bor.
- **Botiq va qavariqni almashtirish.** f″ > 0 — botiq (∪), f″ < 0 — qavariq (∩).
:::

::: xulosa
- Har qanday funksiya uchun bir xil **8 qadam**: soha → juft-toqlik → vertikal → gorizontal/og'ma asimptota → f′ → f″ → kesishish → grafik.
- Kasr funksiyalarda asimptotalar, ko'rsatkichli va logarifmik funksiyalarda limitlar (Lopital) muhim.
- O'zingizni **Testlar** bo'limidagi «Funksiyani tekshirish» testi bilan sinab ko'ring.
:::
