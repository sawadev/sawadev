// hifi-ui.jsx — themed icons, code renderer, small helpers (window exports)

const HICONS = {
  file: 'M5 1.5h5l3.5 3.5v9.5H5z M10 1.5V5h3.5',
  folder: 'M1.5 4.5 H6 l1.5 1.5 H14.5 V13 H1.5 Z',
  terminal: 'M2.5 3h11v10h-11z M4.8 6l2 2-2 2 M8.5 10h3',
  sparkle: 'M8 1.4l1.7 4.1 4.1 1.7-4.1 1.7L8 13l-1.7-4.1L2.2 7.2l4.1-1.7z',
  sparkleSm: 'M12 2l.9 2.2L15 5l-2.1.8L12 8l-.9-2.2L9 5l2.1-.8z',
  play: 'M4.5 2.6l8.5 5.4-8.5 5.4z',
  stop: 'M4 4h8v8H4z',
  gear: 'M8 5.6a2.4 2.4 0 100 4.8 2.4 2.4 0 000-4.8z M8 1.5v2 M8 12.5v2 M2.6 4.8l1.7 1 M11.7 10.2l1.7 1 M2.6 11.2l1.7-1 M11.7 5.8l1.7-1 M1.6 8h2 M12.4 8h2',
  search: 'M7 12.5a5 5 0 100-10 5 5 0 000 10z M11 11l3.5 3.5',
  plus: 'M8 3v10 M3 8h10',
  chevR: 'M6 3.5l4.5 4.5L6 12.5', chevD: 'M3.5 6L8 10.5 12.5 6', chevL: 'M10 3.5L5.5 8 10 12.5', chevU: 'M3.5 10L8 5.5 12.5 10',
  dotsV: 'M8 3.2v.01 M8 8v.01 M8 12.8v.01',
  x: 'M4 4l8 8 M12 4l-8 8',
  check: 'M3 8.5l3.3 3.3L13 4.5',
  copy: 'M5.5 5.5h7v8h-7z M3.5 10.5v-8h7',
  external: 'M9 2.5h4.5V7 M13.5 2.5L7.5 8.5 M12 9.5V13.5H2.5V4h4',
  lock: 'M4.2 7V5a3.8 3.8 0 017.6 0v2 M3.2 7h9.6v6.3H3.2z',
  finger: 'M5 8a3 3 0 016 0v2.6 M5 11.2v1.4 M8 7.8v4.4 M11 8.6v3.6 M3.4 7a4.8 4.8 0 019.2 0',
  user: 'M8 8.4a3 3 0 100-6 3 3 0 000 6z M2.6 14c.7-2.6 2.9-3.8 5.4-3.8s4.7 1.2 5.4 3.8',
  globe: 'M8 14.5a6.5 6.5 0 100-13 6.5 6.5 0 000 13z M1.6 8h12.8 M8 1.6c2.4 2.6 2.4 10.2 0 12.8 M8 1.6c-2.4 2.6-2.4 10.2 0 12.8',
  sun: 'M8 5.4a2.6 2.6 0 100 5.2 2.6 2.6 0 000-5.2z M8 1v1.6 M8 13.4V15 M1 8h1.6 M13.4 8H15 M3 3l1.1 1.1 M11.9 11.9L13 13 M13 3l-1.1 1.1 M4.1 11.9L3 13',
  moon: 'M13.2 9.6A5.6 5.6 0 016.4 2.8 5.6 5.6 0 1013.2 9.6z',
  key: 'M9.5 6.5a3 3 0 10-3 3l.8.8 1.4-.4.5 1.4 1.4.4-.4 1.4 1.6 1.6',
  branch: 'M5 2.6v10.8 M5 5.4a2 2 0 100-4 2 2 0 000 4z M5 14.4a2 2 0 100-4 2 2 0 000 4z M12 6.9a2 2 0 100-4 2 2 0 000 4z M12 4.9c0 3.6-4.5 3.6-7 4',
  diff: 'M4 2.6v3.8 M2.1 4.5h3.8 M2.1 11.4h3.8 M10.4 3.6l2.9 2.9-2.9 2.9 M13.3 6.5H7',
  refresh: 'M13.2 8a5.2 5.2 0 11-1.5-3.7 M13.2 1.6V4.6H10.2',
  send: 'M2.2 8l11.6-5.3L9 14l-1.4-4.6z M7.6 9.4L13.8 2.7',
  attach: 'M13 7.4l-5.4 5.4a2.9 2.9 0 01-4.3-3.9l5.9-5.9a1.9 1.9 0 012.9 2.9l-5.9 5.9a1 1 0 01-1.5-1.5l5.4-5.4',
  mic: 'M8 2.2a1.9 1.9 0 011.9 1.9v3.8a1.9 1.9 0 01-3.8 0V4.1A1.9 1.9 0 018 2.2z M4.4 8a3.6 3.6 0 007.2 0 M8 11.6v2.2',
  cpu: 'M4.2 4.2h7.6v7.6H4.2z M6.6 6.6h2.8v2.8H6.6z M6.2 1.6v1.6 M9.8 1.6v1.6 M6.2 12.8v1.6 M9.8 12.8v1.6 M1.6 6.2h1.6 M1.6 9.8h1.6 M12.8 6.2h1.6 M12.8 9.8h1.6',
  layers: 'M8 1.6l6.2 3.3-6.2 3.3-6.2-3.3z M2 8.1l6 3.2 6-3.2 M2 11.1l6 3.2 6-3.2',
  eye: 'M1.5 8S4 3.6 8 3.6 14.5 8 14.5 8 12 12.4 8 12.4 1.5 8 1.5 8z M8 10a2 2 0 100-4 2 2 0 000 4z',
  back: 'M13 8H3 M7 4L3 8l4 4',
  shield: 'M8 1.6l5 2v3.4c0 3.4-2.2 6-5 7.4-2.8-1.4-5-4-5-7.4V3.6z M5.6 8l1.7 1.7L10.6 6.4',
  bell: 'M8 2.2a4 4 0 00-4 4c0 4-1.4 5-1.4 5h10.8s-1.4-1-1.4-5a4 4 0 00-4-4z M6.4 13.4a1.8 1.8 0 003.2 0',
  dock: 'M2.2 3.2h11.6v9.6H2.2z M2.2 9.4h11.6',
  panel: 'M2.2 3.2h11.6v9.6H2.2z M6.6 3.2v9.6',
  command: 'M5 5a1.8 1.8 0 110-3.6A1.8 1.8 0 016.8 3.2v9.6A1.8 1.8 0 1111 11h-.2M11 5a1.8 1.8 0 100-3.6A1.8 1.8 0 009.2 3.2v9.6A1.8 1.8 0 105 11h.2',
  history: 'M8 4v4l2.6 1.6 M2.4 8a5.6 5.6 0 111.7 4 M2.2 12.2V9.4h2.8',
  grid: 'M2.2 2.2h4.8v4.8H2.2z M9 2.2h4.8v4.8H9z M2.2 9h4.8v4.8H2.2z M9 9h4.8v4.8H9z',
  bolt: 'M8.6 1.6L3.4 9h3.8l-.6 5.4L12.6 7H8.8z',
  trash: 'M3.5 4.5h9 M6 4.5V3h4v1.5 M4.5 4.5l.7 9h5.6l.7-9',
  arrowR: 'M3 8h10 M9 4l4 4-4 4',
  phone: 'M5 1.6h6a1 1 0 011 1v10.8a1 1 0 01-1 1H5a1 1 0 01-1-1V2.6a1 1 0 011-1z M6.8 12.4h2.4',
  tablet: 'M3.4 2.2h9.2a1 1 0 011 1v9.6a1 1 0 01-1 1H3.4a1 1 0 01-1-1V3.2a1 1 0 011-1z M6.9 12.4h2.2',
  monitor: 'M2 3h12v7.5H2z M6.2 13.5h3.6 M6.6 10.5l-.3 3 M9.4 10.5l.3 3',
};

function HIcon({ name, size = 18, sw = 1.6, color = 'currentColor', style, className }) {
  const d = HICONS[name] || HICONS.file;
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke={color}
      strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" className={className}
      style={{ flexShrink: 0, display: 'block', ...style }}>
      <path d={d} />
    </svg>
  );
}

// AI mark — accent rounded square with sparkle
function AIMark({ size = 28, r, style }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: r ?? size * 0.32, flexShrink: 0,
      background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: '0 2px 8px var(--accent-soft)', ...style,
    }}>
      <HIcon name="sparkle" size={size * 0.56} color="var(--on-accent)" sw={1.5} />
    </div>
  );
}

function UserMark({ size = 28, label = 'JM', style }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: size / 2, flexShrink: 0,
      background: 'var(--elevated)', border: '1px solid var(--border)', color: 'var(--text-2)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.38, fontWeight: 700, ...style,
    }}>{label}</div>
  );
}

function Logo({ size = 20, style }) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-mono)', fontSize: size, fontWeight: 700, letterSpacing: -0.5, color: 'var(--text)', ...style }}>
      <span style={{ width: size * 0.46, height: size * 0.46, borderRadius: 4, background: 'var(--accent)', transform: 'rotate(45deg)', boxShadow: '0 2px 8px var(--accent-soft)' }} />
      sawadev
    </div>
  );
}

function StatusDot({ on, live }) {
  return <span className={'dot ' + (on ? 'dot-on' : 'dot-off') + (live ? ' dot-live' : '')} />;
}

function Typing() {
  return <span className="typing"><i /><i /><i /></span>;
}

// ── code renderer ────────────────────────────────────────────────
// line: { n, add, del, t: [['kw','const'], ['var',' x'], ...] }  or { gap:true }
function Code({ lines, startNo = 1, pad = 0 }) {
  let no = startNo;
  return (
    <div className="code" style={{ padding: pad }}>
      {lines.map((l, i) => {
        const num = l.gap ? '' : no++;
        const bg = l.add ? 'var(--diff-add)' : l.del ? 'var(--diff-del)' : 'transparent';
        const sign = l.add ? '+' : l.del ? '−' : '';
        return (
          <div key={i} style={{ display: 'flex', minHeight: 21, background: bg, borderRadius: 3 }}>
            <span className="ln" style={{ width: 30, textAlign: 'right', paddingRight: 12, flexShrink: 0 }}>{num}</span>
            {sign && <span style={{ width: 12, color: l.add ? 'var(--good)' : 'var(--c-num)', flexShrink: 0 }}>{sign}</span>}
            <span style={{ paddingLeft: (l.ind || 0) * 18 + (sign ? 0 : 12) }}>
              {(l.t || []).map((seg, j) => <span key={j} className={'tk-' + seg[0]}>{seg[1]}</span>)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// sample file: auth/middleware.ts (with AI-added lines)
const FILE_MIDDLEWARE = [
  { t: [['kw', 'import'], ['var', ' jwt '], ['kw', 'from'], ['str', " 'jsonwebtoken'"]] },
  { t: [['kw', 'import'], ['p', ' { '], ['var', 'Request, Response, NextFunction'], ['p', ' } '], ['kw', 'from'], ['str', " 'express'"]] },
  { gap: true },
  { t: [['kw', 'export function'], ['fn', ' requireAuth'], ['p', '('], ['var', 'req'], ['p', ': '], ['type', 'Request'], ['p', ', '], ['var', 'res'], ['p', ': '], ['type', 'Response'], ['p', ', '], ['var', 'next'], ['p', ') {']] },
  { ind: 1, t: [['kw', 'const'], ['var', ' header '], ['p', '= '], ['var', 'req'], ['p', '.'], ['var', 'headers'], ['p', '.'], ['var', 'authorization']] },
  { ind: 1, add: true, t: [['kw', 'if'], ['p', ' (!'], ['var', 'header'], ['p', '?.'], ['fn', 'startsWith'], ['p', '('], ['str', "'Bearer '"], ['p', ')) {']] },
  { ind: 2, add: true, t: [['kw', 'return'], ['var', ' res'], ['p', '.'], ['fn', 'status'], ['p', '('], ['num', '401'], ['p', ').'], ['fn', 'json'], ['p', '({ '], ['var', 'error'], ['p', ': '], ['str', "'unauthorized'"], ['p', ' })']] },
  { ind: 1, add: true, t: [['p', '}']] },
  { ind: 1, t: [['kw', 'const'], ['var', ' token '], ['p', '= '], ['var', 'header'], ['p', '.'], ['fn', 'slice'], ['p', '('], ['num', '7'], ['p', ')']] },
  { ind: 1, t: [['kw', 'const'], ['var', ' payload '], ['p', '= '], ['var', 'jwt'], ['p', '.'], ['fn', 'verify'], ['p', '('], ['var', 'token'], ['p', ', '], ['var', 'env'], ['p', '.'], ['var', 'SECRET'], ['p', ')']] },
  { ind: 1, t: [['p', '('], ['var', 'req'], ['kw', ' as any'], ['p', ').'], ['var', 'user'], ['p', ' = '], ['var', 'payload']] },
  { ind: 1, t: [['fn', 'next'], ['p', '()']] },
  { t: [['p', '}']] },
];

Object.assign(window, { HIcon, AIMark, UserMark, Logo, StatusDot, Typing, Code, FILE_MIDDLEWARE });
