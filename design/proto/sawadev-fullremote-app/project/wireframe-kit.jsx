// wireframe-kit.jsx — mid-fi greyscale wireframe primitives for sawadev
// Exports primitives + device frames to window. No shared `styles` object.

const WF = {
  // greyscale ramp
  paper: '#ffffff',
  screen: '#fbfbfa',
  ink: '#2b2b29',
  ink2: '#75756f',
  ink3: '#a6a6a0',
  line: '#dad9d4',
  line2: '#c4c3bd',
  fill: '#eeede9',
  fill2: '#e4e3de',
  fill3: '#d9d8d2',
  dark: '#23231f',     // small dark chrome bits (terminal dot, code gutter)
  // single accent — reserved for AI + primary only
  accent: 'oklch(0.585 0.176 292)',
  accentSoft: 'oklch(0.95 0.035 292)',
  accentLine: 'oklch(0.80 0.09 292)',
  // fonts
  sans: "'Hanken Grotesk', system-ui, -apple-system, sans-serif",
  mono: "'JetBrains Mono', ui-monospace, 'SF Mono', monospace",
  hand: "'Caveat', 'Segoe Print', cursive",
};

// ── icon set (simple stroke icons, currentColor) ────────────────
const WF_ICONS = {
  file: 'M5 1.5h5l3.5 3.5v9.5H5z M10 1.5V5h3.5',
  folder: 'M1.5 4.5 H6 l1.5 1.5 H14.5 V13 H1.5 Z',
  terminal: 'M2 3h12v10H2z M4.5 6l2 2-2 2 M8.5 10h3',
  sparkle: 'M8 1.5l1.6 3.9L13.5 7l-3.9 1.6L8 12.5 6.4 8.6 2.5 7l3.9-1.6z',
  play: 'M4 2.5l9 5.5-9 5.5z',
  stop: 'M4 4h8v8H4z',
  gear: 'M8 5.5a2.5 2.5 0 100 5 2.5 2.5 0 000-5z M8 1.5v2 M8 12.5v2 M2.4 4.7l1.7 1 M11.9 10.3l1.7 1 M2.4 11.3l1.7-1 M11.9 5.7l1.7-1',
  search: 'M7 12a5 5 0 100-10 5 5 0 000 10z M11 11l3.5 3.5',
  plus: 'M8 3v10 M3 8h10',
  chevR: 'M6 3l5 5-5 5',
  chevD: 'M3 6l5 5 5-5',
  chevL: 'M10 3L5 8l5 5',
  dots: 'M3 8h.01 M8 8h.01 M13 8h.01',
  dotsV: 'M8 3v.01 M8 8v.01 M8 13v.01',
  x: 'M4 4l8 8 M12 4l-8 8',
  check: 'M3 8.5l3.5 3.5L13 4.5',
  copy: 'M5.5 5.5h7v8h-7z M3.5 10.5v-8h7',
  external: 'M9 2.5h4.5V7 M13.5 2.5L7 9 M12 9.5V13.5H2.5V4h4',
  lock: 'M4 7V5a4 4 0 018 0v2 M3 7h10v6.5H3z',
  finger: 'M5 8a3 3 0 016 0v2.5 M5 11v1.5 M8 8v4 M11 8.5v3.5 M3.5 7a5 5 0 019 0',
  user: 'M8 8.5a3 3 0 100-6 3 3 0 000 6z M2.5 14c.7-2.6 2.9-3.8 5.5-3.8s4.8 1.2 5.5 3.8',
  git: 'M8 1.5v13 M8 5.5a2 2 0 100-4 2 2 0 000 4z M8 14.5a2 2 0 100-4 2 2 0 000 4z M13 7a2 2 0 100-4 2 2 0 000 4z M13 5q0 3-5 3',
  send: 'M2 8l12-5.5L9 14.5 7.5 9.5z M7.5 9.5L14 2.5',
  attach: 'M13 7.5l-5.5 5.5a3 3 0 01-4.5-4l6-6a2 2 0 013 3l-6 6a1 1 0 01-1.5-1.5l5.5-5.5',
  mic: 'M8 2a2 2 0 012 2v4a2 2 0 01-4 0V4a2 2 0 012-2z M4 8a4 4 0 008 0 M8 12v2.5',
  globe: 'M8 14.5a6.5 6.5 0 100-13 6.5 6.5 0 000 13z M1.5 8h13 M8 1.5q3 3.5 0 13 M8 1.5q-3 3.5 0 13',
  sun: 'M8 5.5a2.5 2.5 0 100 5 2.5 2.5 0 000-5z M8 1v1.5 M8 13.5V15 M1 8h1.5 M13.5 8H15 M3 3l1 1 M12 12l1 1 M13 3l-1 1 M4 12l-1 1',
  moon: 'M13 9.5A5.5 5.5 0 016.5 3 5.5 5.5 0 1013 9.5z',
  key: 'M10 6a3 3 0 10-3 3l1 1 1.5-.5.5 1.5 1.5.5-.5 1.5L13 16',
  layers: 'M8 1.5l6 3.2-6 3.2-6-3.2z M2 8l6 3.2L14 8 M2 11l6 3.2L14 11',
  cpu: 'M4 4h8v8H4z M6.5 6.5h3v3h-3z M6 1.5v1.5 M10 1.5v1.5 M6 13v1.5 M10 13v1.5 M1.5 6H3 M1.5 10H3 M13 6h1.5 M13 10h1.5',
  eye: 'M1.5 8S4 3.5 8 3.5 14.5 8 14.5 8 12 12.5 8 12.5 1.5 8 1.5 8z M8 10a2 2 0 100-4 2 2 0 000 4z',
  edit: 'M11 2.5l2.5 2.5L6 12.5 3 13l.5-3z M10 3.5l2.5 2.5',
  menu: 'M2.5 4.5h11 M2.5 8h11 M2.5 11.5h11',
  back: 'M13 8H3 M7 4L3 8l4 4',
  branch: 'M5 2.5v11 M5 5.5a2 2 0 100-4 2 2 0 000 4z M5 15.5a2 2 0 100-4 2 2 0 000 4z M12 7a2 2 0 100-4 2 2 0 000 4z M12 5q0 4-7 4',
  diff: 'M4 2.5v4 M2 4.5h4 M2 11.5h4 M10.5 3.5l3 3-3 3 M13 6.5H7',
  refresh: 'M13 8a5 5 0 11-1.5-3.5 M13 1.5V4.5H10',
  home: 'M2.5 7.5L8 2.5l5.5 5 M4 7v6.5h8V7',
  grid: 'M2 2h5v5H2z M9 2h5v5H9z M2 9h5v5H2z M9 9h5v5H9z',
  bolt: 'M8.5 1.5L3 9h4l-.5 5.5L12 7H8z',
  dock: 'M2 3h12v10H2z M2 9.5h12',
  panel: 'M2 3h12v10H2z M6.5 3v10',
  stack: 'M2.5 4.5h11 M2.5 8h11 M2.5 11.5h11',
};

function Icon({ name, size = 16, sw = 1.5, c = 'currentColor', style }) {
  const d = WF_ICONS[name] || WF_ICONS.file;
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none"
      stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"
      style={{ flexShrink: 0, display: 'block', ...style }}>
      <path d={d} />
    </svg>
  );
}

// ── text-placeholder bars ───────────────────────────────────────
function Bar({ w = '100%', h = 8, c, r = 3, style }) {
  return <div style={{ width: w, height: h, borderRadius: r, background: c || WF.fill, flexShrink: 0, ...style }} />;
}
function Lines({ n = 3, w = '100%', h = 7, gap = 8, last = '55%', c, style }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap, width: w, ...style }}>
      {Array.from({ length: n }).map((_, i) => (
        <Bar key={i} w={i === n - 1 ? last : '100%'} h={h} c={c} />
      ))}
    </div>
  );
}

// ── annotation (handwritten margin note) ────────────────────────
function Anno({ children, c = WF.accent, size = 19, style }) {
  return (
    <div style={{ fontFamily: WF.hand, fontSize: size, lineHeight: 1.05, color: c, fontWeight: 600, ...style }}>
      {children}
    </div>
  );
}
// small numbered callout pin
function Pin({ n, style }) {
  return (
    <div style={{
      width: 20, height: 20, borderRadius: 10, background: WF.accent, color: '#fff',
      fontFamily: WF.sans, fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center',
      justifyContent: 'center', flexShrink: 0, ...style,
    }}>{n}</div>
  );
}

// ── buttons ─────────────────────────────────────────────────────
function Btn({ children, kind = 'default', sm, full, icon, iconR, style }) {
  const base = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7,
    fontFamily: WF.sans, fontWeight: 600, fontSize: sm ? 12.5 : 14,
    height: sm ? 30 : 40, padding: sm ? '0 12px' : '0 16px', borderRadius: 9,
    width: full ? '100%' : 'auto', whiteSpace: 'nowrap', boxSizing: 'border-box',
  };
  const kinds = {
    primary: { background: WF.accent, color: '#fff', border: 'none' },
    default: { background: WF.paper, color: WF.ink, border: `1.5px solid ${WF.line2}` },
    ghost: { background: 'transparent', color: WF.ink2, border: 'none' },
    soft: { background: WF.fill, color: WF.ink, border: 'none' },
  };
  return (
    <div style={{ ...base, ...kinds[kind], ...style }}>
      {icon && <Icon name={icon} size={sm ? 14 : 16} />}
      {children}
      {iconR && <Icon name={iconR} size={sm ? 14 : 16} />}
    </div>
  );
}

// ── form field ──────────────────────────────────────────────────
function Field({ label, value, placeholder, icon, h = 44, accent, style }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 7, width: '100%', ...style }}>
      {label && <div style={{ fontFamily: WF.sans, fontSize: 12.5, fontWeight: 600, color: WF.ink2 }}>{label}</div>}
      <div style={{
        height: h, borderRadius: 10, border: `1.5px solid ${accent ? WF.accentLine : WF.line2}`,
        background: WF.paper, display: 'flex', alignItems: 'center', gap: 9, padding: '0 12px',
        boxShadow: accent ? `0 0 0 3px ${WF.accentSoft}` : 'none',
      }}>
        {icon && <Icon name={icon} size={16} c={WF.ink3} />}
        <span style={{ fontFamily: WF.sans, fontSize: 14, color: value ? WF.ink : WF.ink3, fontWeight: value ? 500 : 400 }}>
          {value || placeholder}
        </span>
      </div>
    </div>
  );
}

// ── misc atoms ──────────────────────────────────────────────────
function Chip({ children, icon, active, sm, style }) {
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: WF.sans,
      fontSize: sm ? 11.5 : 12.5, fontWeight: 600, height: sm ? 24 : 28, padding: sm ? '0 9px' : '0 11px',
      borderRadius: 7, whiteSpace: 'nowrap',
      background: active ? WF.ink : WF.fill, color: active ? '#fff' : WF.ink2,
      ...style,
    }}>
      {icon && <Icon name={icon} size={sm ? 12 : 13} />}
      {children}
    </div>
  );
}

function StatusBadge({ on, label, style }) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: WF.sans, fontSize: 12, fontWeight: 600, color: WF.ink2, ...style }}>
      <span style={{ width: 7, height: 7, borderRadius: 4, background: on ? WF.accent : WF.ink3, boxShadow: on ? `0 0 0 3px ${WF.accentSoft}` : 'none' }} />
      {label || (on ? 'running' : 'stopped')}
    </div>
  );
}

function Avatar({ size = 28, label, ai, style }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: ai ? 8 : size / 2, flexShrink: 0,
      background: ai ? WF.accent : WF.fill2, color: ai ? '#fff' : WF.ink2,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: WF.sans, fontSize: size * 0.42, fontWeight: 700, ...style,
    }}>
      {ai ? <Icon name="sparkle" size={size * 0.5} c="#fff" /> : (label || '')}
    </div>
  );
}

// striped image / preview placeholder with mono caption
function StripePh({ h = 120, label = 'placeholder', style }) {
  const stripe = `repeating-linear-gradient(45deg, ${WF.fill} 0 10px, ${WF.fill2} 10px 20px)`;
  return (
    <div style={{
      height: h, borderRadius: 8, background: stripe, border: `1px solid ${WF.line}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center', ...style,
    }}>
      <span style={{ fontFamily: WF.mono, fontSize: 11, color: WF.ink2, background: WF.screen, padding: '3px 8px', borderRadius: 4 }}>{label}</span>
    </div>
  );
}

// dashed region marker
function Region({ children, label, h, style }) {
  return (
    <div style={{
      border: `1.5px dashed ${WF.line2}`, borderRadius: 10, height: h, padding: 12,
      position: 'relative', ...style,
    }}>
      {label && <div style={{ position: 'absolute', top: -9, left: 12, background: WF.paper, padding: '0 6px', fontFamily: WF.mono, fontSize: 10, color: WF.ink3, letterSpacing: 0.3 }}>{label}</div>}
      {children}
    </div>
  );
}

// ── segmented control / tabs ────────────────────────────────────
function Seg({ items, active = 0, sm, style }) {
  return (
    <div style={{ display: 'inline-flex', background: WF.fill2, borderRadius: 9, padding: 3, gap: 2, ...style }}>
      {items.map((it, i) => (
        <div key={i} style={{
          fontFamily: WF.sans, fontSize: sm ? 12 : 13, fontWeight: 600, padding: sm ? '5px 10px' : '7px 14px',
          borderRadius: 7, color: i === active ? WF.ink : WF.ink2,
          background: i === active ? WF.paper : 'transparent',
          boxShadow: i === active ? '0 1px 2px rgba(0,0,0,.08)' : 'none',
          display: 'inline-flex', alignItems: 'center', gap: 6,
        }}>{it.icon && <Icon name={it.icon} size={14} />}{it.label}</div>
      ))}
    </div>
  );
}

// ── device frames ───────────────────────────────────────────────
function PhoneStatusBar({ dark }) {
  const c = dark ? '#e6e6e2' : WF.ink;
  return (
    <div style={{ height: 44, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 22px', position: 'relative' }}>
      <span style={{ fontFamily: WF.sans, fontSize: 13, fontWeight: 700, color: c }}>9:41</span>
      <div style={{ position: 'absolute', left: '50%', top: 8, transform: 'translateX(-50%)', width: 84, height: 22, borderRadius: 12, background: dark ? '#000' : '#1b1b1b' }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
        <Icon name="globe" size={13} c={c} />
        <div style={{ width: 22, height: 11, borderRadius: 3, border: `1.2px solid ${c}`, padding: 1.5, display: 'flex' }}>
          <div style={{ flex: 1, background: c, borderRadius: 1 }} />
        </div>
      </div>
    </div>
  );
}

function PhoneScreen({ children, bg = WF.screen, statusDark, noStatus, noHome, style }) {
  return (
    <div style={{ width: '100%', height: '100%', background: bg, display: 'flex', flexDirection: 'column', fontFamily: WF.sans, color: WF.ink, position: 'relative', overflow: 'hidden', ...style }}>
      {!noStatus && <PhoneStatusBar dark={statusDark} />}
      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>{children}</div>
      {!noHome && (
        <div style={{ height: 22, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 130, height: 5, borderRadius: 3, background: statusDark ? '#555' : WF.line2 }} />
        </div>
      )}
    </div>
  );
}

// bottom tab bar for mobile
function BottomTabs({ items, active = 0, ai }) {
  return (
    <div style={{ flexShrink: 0, borderTop: `1px solid ${WF.line}`, background: WF.paper, display: 'flex', padding: '8px 6px 4px' }}>
      {items.map((it, i) => {
        const isAI = it.ai;
        const on = i === active;
        return (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '4px 0' }}>
            <div style={{
              width: isAI ? 46 : 'auto', height: isAI ? 32 : 'auto', borderRadius: 9,
              background: isAI ? WF.accent : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: isAI ? 0 : 2,
            }}>
              <Icon name={it.icon} size={isAI ? 19 : 21} c={isAI ? '#fff' : (on ? WF.ink : WF.ink3)} sw={on || isAI ? 1.7 : 1.5} />
            </div>
            <span style={{ fontFamily: WF.sans, fontSize: 10, fontWeight: on ? 700 : 500, color: isAI ? WF.accent : (on ? WF.ink : WF.ink3) }}>{it.label}</span>
          </div>
        );
      })}
    </div>
  );
}

// desktop browser chrome
function BrowserChrome({ url = 'app.sawadev.io', children, h }) {
  return (
    <div style={{ width: '100%', height: h || '100%', display: 'flex', flexDirection: 'column', fontFamily: WF.sans, background: WF.screen, overflow: 'hidden' }}>
      <div style={{ height: 40, flexShrink: 0, background: WF.fill, borderBottom: `1px solid ${WF.line}`, display: 'flex', alignItems: 'center', gap: 14, padding: '0 14px' }}>
        <div style={{ display: 'flex', gap: 7 }}>
          {['#d8d7d2', '#d8d7d2', '#d8d7d2'].map((c, i) => <div key={i} style={{ width: 11, height: 11, borderRadius: 6, background: c }} />)}
        </div>
        <div style={{ flex: 1, maxWidth: 420, height: 24, borderRadius: 7, background: WF.paper, border: `1px solid ${WF.line}`, display: 'flex', alignItems: 'center', gap: 7, padding: '0 10px' }}>
          <Icon name="lock" size={11} c={WF.ink3} />
          <span style={{ fontFamily: WF.mono, fontSize: 11, color: WF.ink2 }}>{url}</span>
        </div>
        <div style={{ flex: 1 }} />
      </div>
      <div style={{ flex: 1, minHeight: 0 }}>{children}</div>
    </div>
  );
}

// sawadev wordmark
function Wordmark({ size = 22, c = WF.ink, dot = WF.accent, style }) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontFamily: WF.mono, fontSize: size, fontWeight: 700, color: c, letterSpacing: -0.5, ...style }}>
      <span style={{ width: size * 0.42, height: size * 0.42, borderRadius: 3, background: dot, transform: 'rotate(45deg)' }} />
      sawadev
    </div>
  );
}

Object.assign(window, {
  WF, Icon, Bar, Lines, Anno, Pin, Btn, Field, Chip, StatusBadge, Avatar,
  StripePh, Region, Seg, PhoneScreen, PhoneStatusBar, BottomTabs, BrowserChrome, Wordmark,
});
