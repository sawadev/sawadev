import type { CSSProperties, ReactNode } from 'react';

/**
 * Rendu d'une sortie terminal (logs de commande) : interprète les couleurs ANSI (SGR)
 * en spans colorés et **nettoie** les séquences de contrôle (curseur, effacement, spinner).
 * Volontairement simple — 16 couleurs + gras/dim/italique/souligné ; ignore 256/truecolor.
 */

const ESC = String.fromCharCode(27);
const BEL = String.fromCharCode(7);

// Palette lisible sur fond sombre (--term-bg).
const FG: Record<number, string> = {
  30: '#6c6c74',
  31: '#ef6b6b',
  32: '#4ed08a',
  33: '#e0a458',
  34: '#82aaff',
  35: '#b79cff',
  36: '#5fd7c5',
  37: '#d7d7cf',
  90: '#8a8a93',
  91: '#ff8f87',
  92: '#7ee0a6',
  93: '#f0c07a',
  94: '#a8c2ff',
  95: '#cbb6ff',
  96: '#8fe6da',
  97: '#ffffff',
};
const BG: Record<number, string> = {
  40: '#2a2a31',
  41: '#7a2f2f',
  42: '#2f6b45',
  43: '#9a7a2a',
  44: '#2f3f7a',
  45: '#4a3f7a',
  46: '#2f6b66',
  47: '#d7d7cf',
  100: '#3a3a42',
  101: '#9a3f3f',
  102: '#3f8b5a',
  103: '#b08a33',
  104: '#3f4f9a',
  105: '#5a4f9a',
  106: '#3f8b86',
  107: '#ffffff',
};

interface Style {
  bold?: boolean;
  dim?: boolean;
  italic?: boolean;
  underline?: boolean;
  fg?: string;
  bg?: string;
}

function styleToCss(s: Style): CSSProperties {
  const css: CSSProperties = {};
  if (s.fg) css.color = s.fg;
  if (s.bg) css.background = s.bg;
  if (s.bold) css.fontWeight = 700;
  if (s.dim) css.opacity = 0.7;
  if (s.italic) css.fontStyle = 'italic';
  if (s.underline) css.textDecoration = 'underline';
  return css;
}

function applySgr(prev: Style, codes: number[]): Style {
  let s = { ...prev };
  for (let i = 0; i < codes.length; i++) {
    const c = codes[i];
    if (c === 0) s = {};
    else if (c === 1) s.bold = true;
    else if (c === 2) s.dim = true;
    else if (c === 3) s.italic = true;
    else if (c === 4) s.underline = true;
    else if (c === 22) {
      s.bold = false;
      s.dim = false;
    } else if (c === 23) s.italic = false;
    else if (c === 24) s.underline = false;
    else if (c === 39) s.fg = undefined;
    else if (c === 49) s.bg = undefined;
    else if (FG[c]) s.fg = FG[c];
    else if (BG[c]) s.bg = BG[c];
    else if (c === 38 || c === 48) {
      // 256 / truecolor : on saute les arguments (non géré).
      if (codes[i + 1] === 5) i += 2;
      else if (codes[i + 1] === 2) i += 4;
    }
  }
  return s;
}

/** Nettoie les séquences non-SGR (curseur, effacement, OSC, modes privés). */
function clean(input: string): string {
  let t = input.replace(/\r\n/g, '\n');
  t = t.replace(new RegExp(`${ESC}\\[[0-9]*G`, 'g'), '\r'); // curseur col 1 → CR
  t = t.replace(new RegExp(`${ESC}\\][^${BEL}]*(${BEL}|${ESC}\\\\)`, 'g'), ''); // OSC … BEL/ST
  t = t.replace(new RegExp(`${ESC}\\][0-9]*;?`, 'g'), ''); // OSC tronqué
  t = t.replace(new RegExp(`${ESC}\\[\\?[0-9;]*[a-zA-Z]`, 'g'), ''); // modes privés ?…
  t = t.replace(new RegExp(`${ESC}\\([AB0-2]`, 'g'), ''); // charset
  t = t.replace(new RegExp(`${ESC}\\[[0-9;]*[A-Za-ln-z]`, 'g'), ''); // CSI non-SGR (≠ m)
  t = t.replace(new RegExp(BEL, 'g'), '');
  return t;
}

/** `\r` = réécriture de ligne : on garde la dernière « frame » (heuristique logs). */
function collapseCr(line: string): string {
  if (!line.includes('\r')) return line;
  const parts = line.split('\r');
  return parts[parts.length - 1];
}

const SGR = new RegExp(`${ESC}\\[([0-9;]*)m`, 'g');

/** Convertit une sortie terminal en nœuds React colorés (une div par ligne). */
export function renderAnsi(text: string): ReactNode[] {
  const lines = clean(text).split('\n').map(collapseCr);
  let style: Style = {};
  return lines.map((line, li) => {
    const spans: ReactNode[] = [];
    let last = 0;
    let si = 0;
    for (const m of line.matchAll(SGR)) {
      const idx = m.index ?? 0;
      if (idx > last) {
        spans.push(
          <span key={`s${si++}`} style={styleToCss(style)}>
            {line.slice(last, idx)}
          </span>,
        );
      }
      const codes = m[1] === '' ? [0] : m[1].split(';').map(Number);
      style = applySgr(style, codes);
      last = idx + m[0].length;
    }
    if (last < line.length) {
      spans.push(
        <span key={`s${si++}`} style={styleToCss(style)}>
          {line.slice(last)}
        </span>,
      );
    }
    return (
      // biome-ignore lint/suspicious/noArrayIndexKey: lignes stables d'une sortie figée
      <div key={li} className="ansi-line">
        {spans.length ? spans : '​'}
      </div>
    );
  });
}
