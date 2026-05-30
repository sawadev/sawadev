import type { CSSProperties, ReactNode } from 'react';
import { HIcon } from './icons';
import type { CodeLine } from './types';

/** AI mark — accent rounded square with sparkle. */
export function AIMark({ size = 28, r, style }: { size?: number; r?: number; style?: CSSProperties }) {
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

export function UserMark({ size = 28, label = 'JM', style }: { size?: number; label?: string; style?: CSSProperties }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        flexShrink: 0,
        background: 'var(--elevated)',
        border: '1px solid var(--border)',
        color: 'var(--text-2)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: size * 0.38,
        fontWeight: 700,
        ...style,
      }}
    >
      {label}
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

export function StatusDot({ on, live }: { on?: boolean; live?: boolean }) {
  return <span className={'dot ' + (on ? 'dot-on' : 'dot-off') + (live ? ' dot-live' : '')} />;
}

export function Typing() {
  return (
    <span className="typing">
      <i />
      <i />
      <i />
    </span>
  );
}

/** Code renderer. line: { add, del, ind, t: [['kw','const'], ...] } or { gap:true } */
export function Code({ lines, startNo = 1, pad = 0 }: { lines: CodeLine[]; startNo?: number; pad?: number }) {
  let no = startNo;
  return (
    <div className="code" style={{ padding: pad }}>
      {lines.map((l, i) => {
        const num = l.gap ? '' : no++;
        const bg = l.add ? 'var(--diff-add)' : l.del ? 'var(--diff-del)' : 'transparent';
        const sign = l.add ? '+' : l.del ? '−' : '';
        return (
          <div key={i} style={{ display: 'flex', minHeight: 21, background: bg, borderRadius: 3 }}>
            <span className="ln" style={{ width: 30, textAlign: 'right', paddingRight: 12, flexShrink: 0 }}>
              {num}
            </span>
            {sign && (
              <span style={{ width: 12, color: l.add ? 'var(--good)' : 'var(--c-num)', flexShrink: 0 }}>{sign}</span>
            )}
            <span style={{ paddingLeft: (l.ind || 0) * 18 + (sign ? 0 : 12) }}>
              {(l.t || []).map((seg, j) => (
                <span key={j} className={'tk-' + seg[0]}>
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

/** Small helper for inline children wrapping. */
export type WithChildren = { children?: ReactNode };
