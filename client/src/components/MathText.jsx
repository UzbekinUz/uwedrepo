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

/** s ni sep belgisi bo'yicha bo'lish, lekin {…} ichidagilarni bo'lmaslik (kasrlar buzilmasin) */
function splitTop(s, sep) {
  const parts = [];
  let d = 0, cur = '';
  for (const ch of s) {
    if (ch === '{') d++;
    if (ch === '}') d--;
    const isSep = sep === ' ' ? /\s/.test(ch) : ch === sep;
    if (isSep && d === 0) { parts.push(cur); cur = ''; } else cur += ch;
  }
  parts.push(cur);
  return parts.map((p) => p.trim()).filter(Boolean);
}

/** [[ … ]], [| … |], [: … :] blokining yopilish o'rni ({…} ichida izlanmaydi) */
function closeGrid(str, from, token) {
  let d = 0;
  for (let j = from; j < str.length - 1; j++) {
    if (str[j] === '{') d++;
    else if (str[j] === '}') d--;
    else if (d === 0 && str.startsWith(token, j)) return j;
  }
  return -1;
}

/**
 * Matritsa, determinant va tenglamalar sistemasi:
 *   [[1 2; 3 4]]  — matritsa (qavslar ichida), qatorlar «;», elementlar bo'sh joy bilan
 *   [[3; 4]]      — ustun-vektor, [[2 1]] — satr-vektor
 *   [[a + b & c; d & e − f]] — elementda bo'sh joy bo'lsa, ustunlar «&» bilan ajratiladi
 *   [[1 2 ∣ 5; 3 4 ∣ 6]] — kengaytirilgan matritsa («∣» ustuni chiziq bo'lib chiziladi)
 *   [|1 2; 3 4|]  — determinant (vertikal chiziqlar)
 *   [:x + y = 2; x − y = 0:] — sistema (chapda figurali qavs), har bir «;» — yangi tenglama
 */
function grid(kind, src, k) {
  const rows = splitTop(src, ';');
  const sys = kind === ':';
  const amp = src.includes('&');
  const cells = sys ? rows.map((r) => [r]) : rows.map((r) => splitTop(r, amp ? '&' : ' '));
  const cols = Math.max(1, ...cells.map((r) => r.length));
  const h = Math.max(1, cells.length);
  const body = (
    <span className={`inline-grid gap-y-0.5 ${sys ? 'text-left' : 'gap-x-3 text-center'}`} style={{ gridTemplateColumns: `repeat(${cols}, auto)` }}>
      {cells.flatMap((r, ri) => Array.from({ length: cols }, (_, ci) => (
        r[ci] === '∣'
          ? <span key={`${k}-${ri}-${ci}`} aria-label="∣" className="-my-[1px] w-0 justify-self-center border-l-[1.5px] border-current" />
          : <span key={`${k}-${ri}-${ci}`} className="whitespace-nowrap">{r[ci] ? inline(r[ci], `${k}-${ri}-${ci}`) : ''}</span>
      )))}
    </span>
  );
  if (kind === '|') {
    return <span key={k} className="mx-1 inline-flex items-center border-x-[1.5px] border-current px-2 py-0.5 align-middle leading-snug">{body}</span>;
  }
  if (sys) {
    return (
      <span key={k} className="mx-1 inline-flex items-center align-middle leading-snug">
        <span aria-hidden="true" className="mr-1 font-light leading-none" style={{ fontSize: `${0.6 + h * 0.95}em`, transform: 'scaleX(0.6)' }}>{'{'}</span>
        {body}
      </span>
    );
  }
  const paren = (side) => (
    <span aria-hidden="true" className="w-[0.45em] self-stretch border-current" style={side === 'l'
      ? { borderLeftWidth: '1.5px', borderRadius: '50% 0 0 50% / 18% 0 0 18%' }
      : { borderRightWidth: '1.5px', borderRadius: '0 50% 50% 0 / 0 18% 18% 0' }} />
  );
  return <span key={k} className="mx-1 inline-flex items-stretch py-0.5 align-middle leading-snug">{paren('l')}<span className="px-1.5">{body}</span>{paren('r')}</span>;
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
    // [[matritsa]], [|determinant|], [:sistema:]
    if (c === '[' && (str[i + 1] === '[' || str[i + 1] === '|' || str[i + 1] === ':')) {
      const kind = str[i + 1];
      const token = kind === '[' ? ']]' : `${kind}]`;
      const e = closeGrid(str, i + 2, token);
      if (e > i + 2) {
        const g = grid(kind, str.slice(i + 2, e), k);
        // [[…]]^{−1} — daraja matritsadan ajralib keyingi qatorga tushmasin
        const pe = str[e + 2] === '^' && str[e + 3] === '{' ? closeBrace(str, e + 3) : -1;
        if (pe > 0) {
          push(<span key={k + 'p'} className="inline-flex items-start whitespace-nowrap align-middle">{g}<span className="-ml-0.5 text-[0.72em] leading-none">{inline(str.slice(e + 4, pe), k + 's')}</span></span>);
          i = pe + 1; continue;
        }
        push(g); i = e + 2; continue;
      }
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
