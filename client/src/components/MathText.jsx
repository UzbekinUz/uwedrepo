/**
 * Qator ichidagi matematik belgilar (konspektlar va testlar uchun umumiy, HTML ishlatilmaydi):
 *   **qalin**, `formula`, {surat|maxraj} — kasr (ichma-ich ham bo'ladi), ^{daraja} yoki x^2, _{indeks}, lim_{x→a}
 */

/** {…} ichidagi muvozanatlangan yopiluvchi qavsni topish */
function closeBrace(str, open) {
  let d = 0;
  for (let j = open; j < str.length; j++) {
    if (str[j] === '{') d++;
    else if (str[j] === '}') { d--; if (d === 0) return j; }
  }
  return -1;
}
/** {surat|maxraj} dagi yuqori darajadagi | belgisi */
function topBar(inner) {
  let d = 0;
  for (let j = 0; j < inner.length; j++) {
    if (inner[j] === '{') d++;
    else if (inner[j] === '}') d--;
    else if (inner[j] === '|' && d === 0) return j;
  }
  return -1;
}

/** Qator ichidagi belgilarni React elementlariga aylantirish (qo'lda skaner: ichma-ich qavslar ishlaydi) */
function inline(str, key = 'k') {
  const out = [];
  let buf = '';
  let n = 0;
  const flush = () => { if (buf) { out.push(buf); buf = ''; } };
  const push = (el) => { flush(); out.push(el); };
  let i = 0;
  while (i < str.length) {
    const c = str[i];
    const k = `${key}-${n++}`;
    if (c === '*' && str[i + 1] === '*') {
      const e = str.indexOf('**', i + 2);
      if (e > i + 2) { push(<strong key={k} className="font-bold text-slate-900">{inline(str.slice(i + 2, e), k)}</strong>); i = e + 2; continue; }
    }
    if (c === '`') {
      const e = str.indexOf('`', i + 1);
      if (e > i) { push(<span key={k} className="math whitespace-nowrap">{inline(str.slice(i + 1, e), k)}</span>); i = e + 1; continue; }
    }
    // lim_{x→a} — "lim" ostiga yozilgan indeks
    if (str.startsWith('lim_{', i)) {
      const e = closeBrace(str, i + 4);
      if (e > 0) {
        push(
          <span key={k} className="mx-0.5 inline-flex flex-col items-center align-middle leading-none">
            <span>lim</span><span className="mt-0.5 text-[0.62em]">{inline(str.slice(i + 5, e), k)}</span>
          </span>
        );
        i = e + 1; continue;
      }
    }
    if ((c === '^' || c === '_') && str[i + 1] === '{') {
      const e = closeBrace(str, i + 1);
      if (e > 0) {
        const inner = inline(str.slice(i + 2, e), k);
        push(c === '^' ? <sup key={k} className="text-[0.72em]">{inner}</sup> : <sub key={k} className="text-[0.72em]">{inner}</sub>);
        i = e + 1; continue;
      }
    }
    // Qisqa daraja: x^2, x^n, e^x, x^-1
    if (c === '^') {
      const m = /^\^(-?(?:\d+|[a-zA-Z]))/.exec(str.slice(i)); // x^2dx → daraja faqat «2»
      if (m) { push(<sup key={k} className="text-[0.72em]">{m[1].replace('-', '−')}</sup>); i += m[0].length; continue; }
    }
    if (c === '{') {
      const e = closeBrace(str, i);
      if (e > 0) {
        const inner = str.slice(i + 1, e);
        const bar = topBar(inner);
        if (bar > 0) {
          push(
            <span key={k} className="mx-0.5 inline-flex flex-col items-center align-middle text-[0.92em] leading-tight">
              <span className="px-1">{inline(inner.slice(0, bar), k + 'a')}</span>
              <span className="w-full border-t border-current px-1">{inline(inner.slice(bar + 1), k + 'b')}</span>
            </span>
          );
          i = e + 1; continue;
        }
      }
    }
    buf += c; i++;
  }
  flush();
  return out;
}

export function Inline({ text }) {
  return inline(String(text));
}
