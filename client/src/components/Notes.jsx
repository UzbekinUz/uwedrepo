/**
 * Konspekt matnini chiroyli ko'rsatish (tashqi kutubxonasiz, xavfsiz: HTML ishlatilmaydi).
 *
 * Yozish qoidalari:
 *   ## Sarlavha, ### Kichik sarlavha
 *   Bo'sh qator — yangi xatboshi
 *   - ro'yxat, 1. raqamli ro'yxat
 *   $$ ... $$ — alohida qatorlardagi formula bloki (markazda)
 *   > Misol / Yechim / Eslatma — ramkali blok (ketma-ket > qatorlar bitta blok)
 *   | a | b | — jadval (|---| qatori o'tkazib yuboriladi)
 * Qator ichida:
 *   **qalin**, *qiya*, `formula`, {surat|maxraj} — kasr, ^{daraja}, _{indeks}
 */

const INLINE = /(\*\*[^*]+\*\*|\*[^*\s][^*]*\*|`[^`]+`|\{[^{}|]+\|[^{}]+\}|\^\{[^{}]+\}|_\{[^{}]+\})/g;

export function Inline({ text }) {
  const parts = String(text).split(INLINE);
  return parts.map((p, i) => {
    if (!p) return null;
    if (p.startsWith('**') && p.endsWith('**') && p.length > 4) return <strong key={i} className="font-bold text-slate-900"><Inline text={p.slice(2, -2)} /></strong>;
    if (p.startsWith('`') && p.endsWith('`')) return <span key={i} className="math whitespace-nowrap"><Inline text={p.slice(1, -1)} /></span>;
    if (p.startsWith('^{')) return <sup key={i} className="text-[0.72em]"><Inline text={p.slice(2, -1)} /></sup>;
    if (p.startsWith('_{')) return <sub key={i} className="text-[0.72em]"><Inline text={p.slice(2, -1)} /></sub>;
    if (p.startsWith('{') && p.includes('|')) {
      const k = p.indexOf('|');
      return (
        <span key={i} className="mx-0.5 inline-flex flex-col items-center align-middle text-[0.92em] leading-tight">
          <span className="px-1"><Inline text={p.slice(1, k)} /></span>
          <span className="w-full border-t border-current px-1"><Inline text={p.slice(k + 1, -1)} /></span>
        </span>
      );
    }
    if (p.startsWith('*') && p.endsWith('*') && p.length > 2) return <em key={i}><Inline text={p.slice(1, -1)} /></em>;
    return p;
  });
}

/** Matnni bloklarga ajratish */
function parse(src) {
  const lines = String(src).replace(/\r/g, '').split('\n');
  const blocks = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const tr = line.trim();
    if (!tr) { i++; continue; }
    if (tr.startsWith('$$')) {
      const body = [];
      const first = tr.slice(2).replace(/\$\$$/, '').trim();
      if (first) body.push(first);
      if (tr.length > 2 && tr.endsWith('$$') && tr !== '$$') { blocks.push({ k: 'math', lines: body }); i++; continue; }
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('$$')) { if (lines[i].trim()) body.push(lines[i].trim()); i++; }
      i++;
      blocks.push({ k: 'math', lines: body });
      continue;
    }
    if (tr.startsWith('### ')) { blocks.push({ k: 'h3', text: tr.slice(4) }); i++; continue; }
    if (tr.startsWith('## ')) { blocks.push({ k: 'h2', text: tr.slice(3) }); i++; continue; }
    if (tr.startsWith('>')) {
      const inner = [];
      while (i < lines.length && lines[i].trim().startsWith('>')) { inner.push(lines[i].trim().replace(/^>\s?/, '')); i++; }
      blocks.push({ k: 'box', children: parse(inner.join('\n')) });
      continue;
    }
    if (tr.startsWith('|')) {
      const rows = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        const r = lines[i].trim();
        if (!/^\|[\s:|-]+\|$/.test(r)) rows.push(r.replace(/^\||\|$/g, '').split('|').map((c) => c.trim()));
        i++;
      }
      blocks.push({ k: 'table', rows });
      continue;
    }
    if (/^[-•]\s/.test(tr) || /^\d+[.)]\s/.test(tr)) {
      const ordered = /^\d/.test(tr);
      const items = [];
      while (i < lines.length && (ordered ? /^\d+[.)]\s/ : /^[-•]\s/).test(lines[i].trim())) {
        items.push(lines[i].trim().replace(ordered ? /^\d+[.)]\s/ : /^[-•]\s/, ''));
        i++;
      }
      blocks.push({ k: ordered ? 'ol' : 'ul', items });
      continue;
    }
    const para = [];
    while (i < lines.length && lines[i].trim() && !/^(#{2,3} |\$\$|>|\||[-•]\s|\d+[.)]\s)/.test(lines[i].trim())) { para.push(lines[i].trim()); i++; }
    blocks.push({ k: 'p', text: para.join(' ') });
  }
  return blocks;
}

function Blocks({ blocks }) {
  return blocks.map((b, i) => {
    switch (b.k) {
      case 'h2': return <h2 key={i} className="mt-10 border-b border-slate-200 pb-2 text-2xl font-extrabold tracking-tight text-slate-900 first:mt-0"><Inline text={b.text} /></h2>;
      case 'h3': return <h3 key={i} className="mt-6 text-lg font-bold text-slate-900"><Inline text={b.text} /></h3>;
      case 'math': return (
        <div key={i} className="math my-4 overflow-x-auto rounded-xl bg-slate-50 px-4 py-3 text-center text-[1.08rem] ring-1 ring-slate-200">
          {b.lines.map((l, j) => <div key={j} className="py-0.5"><Inline text={l} /></div>)}
        </div>
      );
      case 'box': return <div key={i} className="my-5 rounded-2xl border-l-4 border-brand-500 bg-brand-50/70 px-4 py-3 sm:px-5"><Blocks blocks={b.children} /></div>;
      case 'table': return (
        <div key={i} className="my-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead><tr>{b.rows[0].map((c, j) => <th key={j} className="border-b-2 border-slate-200 px-3 py-2 font-bold text-slate-900"><Inline text={c} /></th>)}</tr></thead>
            <tbody>{b.rows.slice(1).map((r, j) => <tr key={j} className="border-b border-slate-100">{r.map((c, k) => <td key={k} className="px-3 py-2 text-slate-800"><Inline text={c} /></td>)}</tr>)}</tbody>
          </table>
        </div>
      );
      case 'ul': return <ul key={i} className="my-3 list-disc space-y-1.5 pl-6 text-slate-800">{b.items.map((x, j) => <li key={j}><Inline text={x} /></li>)}</ul>;
      case 'ol': return <ol key={i} className="my-3 list-decimal space-y-1.5 pl-6 text-slate-800">{b.items.map((x, j) => <li key={j}><Inline text={x} /></li>)}</ol>;
      default: return <p key={i} className="my-3 leading-relaxed text-slate-800"><Inline text={b.text} /></p>;
    }
  });
}

export default function Notes({ text }) {
  return <div className="text-[1.02rem]"><Blocks blocks={parse(text)} /></div>;
}
