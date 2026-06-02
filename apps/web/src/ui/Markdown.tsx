import type { ReactNode } from 'react';

/**
 * Rendu markdown **léger et sans dépendance** pour les réponses d'agent (sous-ensemble
 * usuel : titres, gras/italique, code inline et fences, listes, citations, liens, hr).
 * Volontairement minimal — pas de tables ni de markdown imbriqué complexe.
 */

/** Heuristique : le texte ressemble-t-il à du markdown ? (sinon on garde le brut). */
export function looksLikeMarkdown(t: string): boolean {
  return (
    /(^|\n)#{1,6}\s/.test(t) || // titres
    /(^|\n)\s*[-*+]\s+/.test(t) || // listes à puces
    /(^|\n)\s*\d+\.\s+/.test(t) || // listes numérotées
    /\*\*[^*\n]+\*\*/.test(t) || // gras
    /`[^`\n]+`/.test(t) || // code inline
    /```/.test(t) || // bloc de code
    /\[[^\]\n]+\]\([^)\n]+\)/.test(t) // lien
  );
}

const INLINE =
  /(`[^`]+`)|(\[[^\]]+\]\([^)]+\))|(\*\*[\s\S]+?\*\*|__[\s\S]+?__)|(\*[\s\S]+?\*)|(~~[\s\S]+?~~)/;

/** Parse les marqueurs inline (code, lien, gras, italique, barré) → nœuds React. */
function inline(text: string, kp: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let rest = text;
  let i = 0;
  while (rest.length) {
    const m = INLINE.exec(rest);
    if (!m) {
      nodes.push(rest);
      break;
    }
    if (m.index > 0) nodes.push(rest.slice(0, m.index));
    const tok = m[0];
    const key = `${kp}-${i++}`;
    if (tok[0] === '`') {
      nodes.push(<code key={key}>{tok.slice(1, -1)}</code>);
    } else if (tok[0] === '[') {
      const lm = /\[([^\]]+)\]\(([^)]+)\)/.exec(tok);
      nodes.push(
        lm ? (
          <a key={key} href={lm[2]} target="_blank" rel="noreferrer">
            {lm[1]}
          </a>
        ) : (
          tok
        ),
      );
    } else if (tok.startsWith('**') || tok.startsWith('__')) {
      nodes.push(<strong key={key}>{inline(tok.slice(2, -2), key)}</strong>);
    } else if (tok.startsWith('~~')) {
      nodes.push(<del key={key}>{inline(tok.slice(2, -2), key)}</del>);
    } else {
      nodes.push(<em key={key}>{inline(tok.slice(1, -1), key)}</em>);
    }
    rest = rest.slice(m.index + tok.length);
  }
  return nodes;
}

function isBlockStart(l: string): boolean {
  return (
    l.startsWith('```') ||
    /^#{1,6}\s/.test(l) ||
    /^(---+|\*\*\*+|___+)\s*$/.test(l) ||
    /^\s*[-*+]\s+/.test(l) ||
    /^\s*\d+\.\s+/.test(l) ||
    l.startsWith('>')
  );
}

type Align = 'left' | 'center' | 'right';

/** Ligne de séparation d'un tableau (`|---|:--:|--:|`). */
function isTableSep(l: string): boolean {
  return /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)+\|?\s*$/.test(l);
}

/** Découpe une ligne de tableau en cellules (retire les pipes de bord). */
function cells(row: string): string[] {
  let r = row.trim();
  if (r.startsWith('|')) r = r.slice(1);
  if (r.endsWith('|')) r = r.slice(0, -1);
  return r.split('|').map((c) => c.trim());
}

function alignOf(sep: string): Align {
  const t = sep.trim();
  const l = t.startsWith(':');
  const r = t.endsWith(':');
  return l && r ? 'center' : r ? 'right' : 'left';
}

function isTableStart(lines: string[], i: number): boolean {
  return i + 1 < lines.length && lines[i].includes('|') && isTableSep(lines[i + 1]);
}

function parseBlocks(src: string): ReactNode[] {
  const lines = src.replace(/\r/g, '').split('\n');
  const out: ReactNode[] = [];
  let i = 0;
  let k = 0;
  const nk = () => `b${k++}`;

  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) {
      i++;
      continue;
    }

    // Bloc de code ```…```
    if (line.startsWith('```')) {
      const buf: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) {
        buf.push(lines[i]);
        i++;
      }
      i++; // ferme la fence
      out.push(
        <pre key={nk()} className="chat-code">
          {buf.join('\n')}
        </pre>,
      );
      continue;
    }

    // Tableau (en-tête + séparateur + lignes)
    if (isTableStart(lines, i)) {
      const tkey = nk();
      const header = cells(line);
      const aligns = cells(lines[i + 1]).map(alignOf);
      i += 2;
      const rows: string[][] = [];
      while (i < lines.length && lines[i].includes('|') && lines[i].trim()) {
        rows.push(cells(lines[i]));
        i++;
      }
      out.push(
        <table key={tkey} className="md-table">
          <thead>
            <tr>
              {header.map((c, j) => (
                <th key={`${tkey}-h${j}`} style={{ textAlign: aligns[j] ?? 'left' }}>
                  {inline(c, `${tkey}-h${j}`)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, ri) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: lignes stables d'un message figé
              <tr key={`${tkey}-r${ri}`}>
                {header.map((_, j) => (
                  <td key={`${tkey}-r${ri}c${j}`} style={{ textAlign: aligns[j] ?? 'left' }}>
                    {inline(row[j] ?? '', `${tkey}-r${ri}c${j}`)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>,
      );
      continue;
    }

    // Titre #..####
    const h = /^(#{1,6})\s+(.*)$/.exec(line);
    if (h) {
      const lvl = Math.min(h[1].length, 4);
      const key = nk();
      const kids = inline(h[2], key);
      out.push(
        lvl === 1 ? (
          <h1 key={key}>{kids}</h1>
        ) : lvl === 2 ? (
          <h2 key={key}>{kids}</h2>
        ) : lvl === 3 ? (
          <h3 key={key}>{kids}</h3>
        ) : (
          <h4 key={key}>{kids}</h4>
        ),
      );
      i++;
      continue;
    }

    // Séparateur
    if (/^(---+|\*\*\*+|___+)\s*$/.test(line)) {
      out.push(<hr key={nk()} />);
      i++;
      continue;
    }

    // Citation
    if (line.startsWith('>')) {
      const buf: string[] = [];
      while (i < lines.length && lines[i].startsWith('>')) {
        buf.push(lines[i].replace(/^>\s?/, ''));
        i++;
      }
      const key = nk();
      out.push(<blockquote key={key}>{inline(buf.join(' '), key)}</blockquote>);
      continue;
    }

    // Liste à puces
    if (/^\s*[-*+]\s+/.test(line)) {
      const items: ReactNode[] = [];
      while (i < lines.length && /^\s*[-*+]\s+/.test(lines[i])) {
        const key = nk();
        items.push(<li key={key}>{inline(lines[i].replace(/^\s*[-*+]\s+/, ''), key)}</li>);
        i++;
      }
      out.push(<ul key={nk()}>{items}</ul>);
      continue;
    }

    // Liste numérotée
    if (/^\s*\d+\.\s+/.test(line)) {
      const items: ReactNode[] = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
        const key = nk();
        items.push(<li key={key}>{inline(lines[i].replace(/^\s*\d+\.\s+/, ''), key)}</li>);
        i++;
      }
      out.push(<ol key={nk()}>{items}</ol>);
      continue;
    }

    // Paragraphe
    const buf: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() &&
      !isBlockStart(lines[i]) &&
      !isTableStart(lines, i)
    ) {
      buf.push(lines[i]);
      i++;
    }
    const key = nk();
    out.push(<p key={key}>{inline(buf.join(' '), key)}</p>);
  }
  return out;
}

export function Markdown({ text }: { text: string }) {
  return <div className="md">{parseBlocks(text)}</div>;
}
