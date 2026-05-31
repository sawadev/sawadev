// ui.tsx — themed icons, logo, AI mark and code renderer (ported from the design).
import type { CSSProperties } from 'react';

const HICONS: Record<string, string> = {
  file: 'M5 1.5h5l3.5 3.5v9.5H5z M10 1.5V5h3.5',
  terminal: 'M2.5 3h11v10h-11z M4.8 6l2 2-2 2 M8.5 10h3',
  sparkle: 'M8 1.4l1.7 4.1 4.1 1.7-4.1 1.7L8 13l-1.7-4.1L2.2 7.2l4.1-1.7z',
  plus: 'M8 3v10 M3 8h10',
  check: 'M3 8.5l3.3 3.3L13 4.5',
  copy: 'M5.5 5.5h7v8h-7z M3.5 10.5v-8h7',
  lock: 'M4.2 7V5a3.8 3.8 0 017.6 0v2 M3.2 7h9.6v6.3H3.2z',
  finger: 'M5 8a3 3 0 016 0v2.6 M5 11.2v1.4 M8 7.8v4.4 M11 8.6v3.6 M3.4 7a4.8 4.8 0 019.2 0',
  globe:
    'M8 14.5a6.5 6.5 0 100-13 6.5 6.5 0 000 13z M1.6 8h12.8 M8 1.6c2.4 2.6 2.4 10.2 0 12.8 M8 1.6c-2.4 2.6-2.4 10.2 0 12.8',
  sun: 'M8 5.4a2.6 2.6 0 100 5.2 2.6 2.6 0 000-5.2z M8 1v1.6 M8 13.4V15 M1 8h1.6 M13.4 8H15 M3 3l1.1 1.1 M11.9 11.9L13 13 M13 3l-1.1 1.1 M4.1 11.9L3 13',
  moon: 'M13.2 9.6A5.6 5.6 0 016.4 2.8 5.6 5.6 0 1013.2 9.6z',
  cpu: 'M4.2 4.2h7.6v7.6H4.2z M6.6 6.6h2.8v2.8H6.6z M6.2 1.6v1.6 M9.8 1.6v1.6 M6.2 12.8v1.6 M9.8 12.8v1.6 M1.6 6.2h1.6 M1.6 9.8h1.6 M12.8 6.2h1.6 M12.8 9.8h1.6',
  diff: 'M4 2.6v3.8 M2.1 4.5h3.8 M2.1 11.4h3.8 M10.4 3.6l2.9 2.9-2.9 2.9 M13.3 6.5H7',
};

export function HIcon({
  name,
  size = 18,
  sw = 1.6,
  color = 'currentColor',
  style,
}: {
  name: string;
  size?: number;
  sw?: number;
  color?: string;
  style?: CSSProperties;
}) {
  const d = HICONS[name] ?? HICONS.file;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke={color}
      strokeWidth={sw}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ flexShrink: 0, display: 'block', ...style }}
    >
      <path d={d} />
    </svg>
  );
}

/** AI mark — accent rounded square with a sparkle. */
export function AIMark({
  size = 28,
  r,
  style,
}: { size?: number; r?: number; style?: CSSProperties }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: r ?? size * 0.32,
        flexShrink: 0,
        background: 'var(--accent)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 2px 8px var(--accent-soft)',
        ...style,
      }}
    >
      <HIcon name="sparkle" size={size * 0.56} color="var(--on-accent)" sw={1.5} />
    </div>
  );
}

export function Logo({ size = 20, style }: { size?: number; style?: CSSProperties }) {
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        fontFamily: 'var(--font-mono)',
        fontSize: size,
        fontWeight: 700,
        letterSpacing: -0.5,
        color: 'var(--text)',
        ...style,
      }}
    >
      <span
        style={{
          width: size * 0.46,
          height: size * 0.46,
          borderRadius: 4,
          background: 'var(--accent)',
          transform: 'rotate(45deg)',
          boxShadow: '0 2px 8px var(--accent-soft)',
        }}
      />
      sawadev
    </div>
  );
}

/** A syntax-highlighted segment: [tokenClass, text]. */
export type CodeSeg = [string, string];
export interface CodeLine {
  gap?: boolean;
  add?: boolean;
  del?: boolean;
  ind?: number;
  t?: CodeSeg[];
}

export function Code({
  lines,
  startNo = 1,
  pad = 0,
}: { lines: CodeLine[]; startNo?: number; pad?: number }) {
  let no = startNo;
  return (
    <div className="code" style={{ padding: pad }}>
      {lines.map((l, i) => {
        const num = l.gap ? '' : no++;
        const bg = l.add ? 'var(--diff-add)' : l.del ? 'var(--diff-del)' : 'transparent';
        const sign = l.add ? '+' : l.del ? '−' : '';
        return (
          <div
            // biome-ignore lint/suspicious/noArrayIndexKey: lignes statiques
            key={i}
            style={{ display: 'flex', minHeight: 21, background: bg, borderRadius: 3 }}
          >
            <span
              className="ln"
              style={{ width: 30, textAlign: 'right', paddingRight: 12, flexShrink: 0 }}
            >
              {num}
            </span>
            {sign && (
              <span
                style={{ width: 12, color: l.add ? 'var(--good)' : 'var(--c-num)', flexShrink: 0 }}
              >
                {sign}
              </span>
            )}
            <span style={{ paddingLeft: (l.ind || 0) * 18 + (sign ? 0 : 12) }}>
              {(l.t || []).map((seg, j) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: segments statiques
                <span key={j} className={`tk-${seg[0]}`}>
                  {seg[1]}
                </span>
              ))}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/** Sample file: auth/middleware.ts (with AI-added lines) — hero visual. */
export const FILE_MIDDLEWARE: CodeLine[] = [
  {
    t: [
      ['kw', 'import'],
      ['var', ' jwt '],
      ['kw', 'from'],
      ['str', " 'jsonwebtoken'"],
    ],
  },
  {
    t: [
      ['kw', 'import'],
      ['p', ' { '],
      ['var', 'Request, Response, NextFunction'],
      ['p', ' } '],
      ['kw', 'from'],
      ['str', " 'express'"],
    ],
  },
  { gap: true },
  {
    t: [
      ['kw', 'export function'],
      ['fn', ' requireAuth'],
      ['p', '('],
      ['var', 'req'],
      ['p', ': '],
      ['type', 'Request'],
      ['p', ', '],
      ['var', 'res'],
      ['p', ': '],
      ['type', 'Response'],
      ['p', ', '],
      ['var', 'next'],
      ['p', ') {'],
    ],
  },
  {
    ind: 1,
    t: [
      ['kw', 'const'],
      ['var', ' header '],
      ['p', '= '],
      ['var', 'req'],
      ['p', '.'],
      ['var', 'headers'],
      ['p', '.'],
      ['var', 'authorization'],
    ],
  },
  {
    ind: 1,
    add: true,
    t: [
      ['kw', 'if'],
      ['p', ' (!'],
      ['var', 'header'],
      ['p', '?.'],
      ['fn', 'startsWith'],
      ['p', '('],
      ['str', "'Bearer '"],
      ['p', ')) {'],
    ],
  },
  {
    ind: 2,
    add: true,
    t: [
      ['kw', 'return'],
      ['var', ' res'],
      ['p', '.'],
      ['fn', 'status'],
      ['p', '('],
      ['num', '401'],
      ['p', ').'],
      ['fn', 'json'],
      ['p', '({ '],
      ['var', 'error'],
      ['p', ': '],
      ['str', "'unauthorized'"],
      ['p', ' })'],
    ],
  },
  { ind: 1, add: true, t: [['p', '}']] },
  {
    ind: 1,
    t: [
      ['kw', 'const'],
      ['var', ' token '],
      ['p', '= '],
      ['var', 'header'],
      ['p', '.'],
      ['fn', 'slice'],
      ['p', '('],
      ['num', '7'],
      ['p', ')'],
    ],
  },
  {
    ind: 1,
    t: [
      ['kw', 'const'],
      ['var', ' payload '],
      ['p', '= '],
      ['var', 'jwt'],
      ['p', '.'],
      ['fn', 'verify'],
      ['p', '('],
      ['var', 'token'],
      ['p', ', '],
      ['var', 'env'],
      ['p', '.'],
      ['var', 'SECRET'],
      ['p', ')'],
    ],
  },
  {
    ind: 1,
    t: [
      ['fn', 'next'],
      ['p', '()'],
    ],
  },
];
