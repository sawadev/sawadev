// hifi-desktop.jsx — themed desktop IDE (1440×900, includes browser chrome)

function WinChrome({ url, children }) {
  return (
    <div style={{ width: 1440, height: 900, borderRadius: 12, overflow: 'hidden', background: 'var(--surface)', boxShadow: 'var(--shadow-lg)', display: 'flex', flexDirection: 'column', border: '1px solid var(--border)' }}>
      <div style={{ height: 42, flexShrink: 0, background: 'var(--surface-2)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 14, padding: '0 14px' }}>
        <div style={{ display: 'flex', gap: 8 }}>{['#FF5F57', '#FEBC2E', '#28C840'].map((c, i) => <div key={i} style={{ width: 12, height: 12, borderRadius: 6, background: c, opacity: 0.9 }} />)}</div>
        <div style={{ flex: 1, maxWidth: 460, height: 26, borderRadius: 7, background: 'var(--bg)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8, padding: '0 11px', margin: '0 auto' }}>
          <HIcon name="lock" size={11} color="var(--faint)" /><span className="mono" style={{ fontSize: 11.5, color: 'var(--text-2)' }}>{url}</span>
        </div>
        <div style={{ flex: 1 }} />
      </div>
      <div style={{ flex: 1, minHeight: 0 }}>{children}</div>
    </div>
  );
}

function DeskRail({ onToggleTheme, theme }) {
  return (
    <div style={{ width: 58, flexShrink: 0, background: 'var(--surface-2)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '14px 0', gap: 6 }}>
      <div style={{ width: 32, height: 32, borderRadius: 9, background: 'var(--bg)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}><span style={{ width: 13, height: 13, borderRadius: 4, background: 'var(--accent)', transform: 'rotate(45deg)' }} /></div>
      {[['grid', false], ['folder', true], ['terminal', false], ['globe', false], ['gear', false]].map(([ic, on], i) => (
        <div key={i} style={{ width: 40, height: 40, borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', background: on ? 'var(--surface)' : 'transparent', boxShadow: on ? '0 1px 3px rgba(0,0,0,.15)' : 'none', border: on ? '1px solid var(--border-soft)' : '1px solid transparent' }}>
          <HIcon name={ic} size={19} color={on ? 'var(--text)' : 'var(--faint)'} sw={on ? 1.8 : 1.6} />
        </div>
      ))}
      <div style={{ flex: 1 }} />
      <button onClick={onToggleTheme} className="btn btn-ghost btn-icon" style={{ width: 40, height: 40 }}><HIcon name={theme === 'dark' ? 'sun' : 'moon'} size={18} color="var(--muted)" /></button>
      <UserMark size={32} />
    </div>
  );
}

const DTREE = [
  { d: 0, ic: 'folder', n: 'src', open: true }, { d: 1, ic: 'folder', n: 'auth', open: true },
  { d: 2, ic: 'file', n: 'middleware.ts', cur: true, badge: 'M' }, { d: 2, ic: 'file', n: 'tokens.ts' },
  { d: 1, ic: 'folder', n: 'routes' }, { d: 1, ic: 'file', n: 'server.ts' }, { d: 1, ic: 'file', n: 'db.ts' },
  { d: 0, ic: 'folder', n: 'tests' }, { d: 0, ic: 'file', n: 'package.json' }, { d: 0, ic: 'file', n: 'Dockerfile' }, { d: 0, ic: 'file', n: '.env' }, { d: 0, ic: 'file', n: 'README.md' },
];

function DTerm() {
  const L = ({ children, c, p }) => <div className="mono" style={{ fontSize: 12, lineHeight: 1.75, color: c || 'rgba(220,220,212,0.9)' }}>{p && <span style={{ color: 'var(--accent-text)' }}>$ </span>}{children}</div>;
  return (
    <div style={{ height: 196, flexShrink: 0, borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', background: 'var(--term-bg)' }}>
      <div style={{ height: 34, display: 'flex', alignItems: 'stretch', borderBottom: '1px solid rgba(255,255,255,0.07)', paddingLeft: 4 }}>
        {[['Terminal', true], ['Agent · claude', false], ['Output', false]].map(([l, on], i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '0 14px', borderBottom: on ? '2px solid var(--accent)' : '2px solid transparent' }}>
            <HIcon name="terminal" size={12} color={on ? 'rgba(235,235,230,0.95)' : 'rgba(220,220,212,0.45)'} /><span className="mono" style={{ fontSize: 11.5, color: on ? 'rgba(235,235,230,0.95)' : 'rgba(220,220,212,0.45)', fontWeight: on ? 600 : 400 }}>{l}</span>
          </div>
        ))}
      </div>
      <div style={{ flex: 1, padding: '12px 16px', overflow: 'hidden' }}>
        <L p c="rgba(240,240,233,0.95)">claude "add JWT auth middleware"</L>
        <L c="rgba(160,160,152,0.9)">● Claude Code · analyzing repo…  ↳ read src/server.ts, src/auth/</L>
        <L c="var(--accent-text)">✎ editing src/auth/middleware.ts   +24 −3</L>
        <L p c="rgba(240,240,233,0.95)">npm run test auth</L>
        <L c="#7fd99a">  ✓ 14 passing  (1.2s)</L>
        <L p c="rgba(240,240,233,0.95)"><span style={{ display: 'inline-block', width: 8, height: 15, background: 'rgba(240,240,233,0.9)', verticalAlign: 'text-bottom', animation: 'pulse 1.1s steps(1) infinite' }} /></L>
      </div>
    </div>
  );
}

function DesktopIDE({ theme, onToggleTheme }) {
  return (
    <WinChrome url="storefront-api.sawadev.io/edit">
      <div style={{ height: '100%', display: 'flex', background: 'var(--bg)' }}>
        <DeskRail theme={theme} onToggleTheme={onToggleTheme} />
        {/* file tree */}
        <div style={{ width: 234, flexShrink: 0, borderRight: '1px solid var(--border)', background: 'var(--surface-2)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ height: 44, display: 'flex', alignItems: 'center', gap: 8, padding: '0 14px', borderBottom: '1px solid var(--border)' }}>
            <span className="mono" style={{ fontSize: 13, fontWeight: 700, flex: 1 }}>storefront-api</span><HIcon name="search" size={15} color="var(--faint)" /><HIcon name="plus" size={16} color="var(--faint)" />
          </div>
          <div style={{ flex: 1, padding: 6, overflow: 'auto' }}>
            {DTREE.map((t, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 7, height: 29, padding: `0 8px 0 ${8 + t.d * 16}px`, borderRadius: 7, background: t.cur ? 'var(--accent-soft)' : 'transparent' }}>
                {t.ic === 'folder' ? <HIcon name={t.open ? 'chevD' : 'chevR'} size={11} color="var(--faint)" /> : <span style={{ width: 11 }} />}
                <HIcon name={t.ic} size={14} color={t.cur ? 'var(--accent-text)' : 'var(--muted)'} />
                <span className="mono" style={{ fontSize: 12.5, fontWeight: t.cur ? 600 : 500, color: t.cur ? 'var(--text)' : 'var(--text-2)', flex: 1 }}>{t.n}</span>
                {t.badge && <span className="mono" style={{ fontSize: 9.5, fontWeight: 700, color: 'var(--accent-text)' }}>{t.badge}</span>}
              </div>
            ))}
          </div>
        </div>
        {/* editor + terminal */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          {/* app top bar */}
          <div style={{ height: 44, flexShrink: 0, borderBottom: '1px solid var(--border)', background: 'var(--surface)', display: 'flex', alignItems: 'center', gap: 12, padding: '0 16px' }}>
            <span className="chip chip-sm"><HIcon name="branch" size={12} color="var(--muted)" />main</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><StatusDot on live /><span style={{ fontSize: 12.5, color: 'var(--muted)', fontWeight: 600 }}>running</span></div>
            <div style={{ flex: 1 }} />
            <button className="btn btn-outline btn-sm"><HIcon name="globe" size={14} color="var(--text)" />Preview</button>
            <button className="btn btn-outline btn-sm"><HIcon name="play" size={14} color="var(--text)" />Run</button>
          </div>
          {/* tabs */}
          <div style={{ height: 40, flexShrink: 0, display: 'flex', alignItems: 'stretch', background: 'var(--surface-2)', borderBottom: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '0 14px', background: 'var(--surface)', borderRight: '1px solid var(--border)', borderTop: '2px solid var(--accent)' }}><HIcon name="file" size={13} color="var(--accent-text)" /><span className="mono" style={{ fontSize: 12, fontWeight: 600 }}>middleware.ts</span><span className="dot" style={{ background: 'var(--accent)' }} /></div>
            {['server.ts', 'routes.ts'].map((f, i) => <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '0 14px', borderRight: '1px solid var(--border)' }}><HIcon name="file" size={13} color="var(--faint)" /><span className="mono" style={{ fontSize: 12, color: 'var(--muted)' }}>{f}</span></div>)}
            <div style={{ flex: 1 }} />
            <div style={{ display: 'flex', alignItems: 'center', padding: '0 14px' }}><span className="chip chip-sm chip-accent"><HIcon name="command" size={12} color="var(--accent-text)" />⌘K · edit with AI</span></div>
          </div>
          <div style={{ flex: 1, minHeight: 0, padding: '16px 20px', overflow: 'auto' }}><Code lines={FILE_MIDDLEWARE} /></div>
          <DTerm />
        </div>
        {/* AI panel */}
        <div style={{ width: 392, flexShrink: 0, borderLeft: '1px solid var(--border)', background: 'var(--surface-2)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ height: 48, display: 'flex', alignItems: 'center', gap: 10, padding: '0 16px', borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}>
            <AIMark size={26} /><span style={{ fontSize: 14, fontWeight: 700, flex: 1 }}>AI Agent</span>
            <span className="chip chip-sm chip-accent">Claude Code<HIcon name="chevD" size={11} color="var(--accent-text)" /></span>
            <HIcon name="history" size={16} color="var(--faint)" />
          </div>
          <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 13 }}>
            <Bubble>Add JWT auth middleware and protect the /orders routes</Bubble>
            <AgentText>I'll verify the bearer token, then guard the orders router.</AgentText>
            <ToolCard m={{ kind: 'cmd', icon: 'terminal', title: 'Ran command', meta: 'npm i jsonwebtoken', body: 'out' }} />
            <ToolCard m={{ kind: 'edit', icon: 'diff', title: 'Edited', meta: 'auth/middleware.ts', body: 'diff', approve: true }} />
            <AgentText muted>Done — 14 tests pass. Want refresh-token rotation too?</AgentText>
          </div>
          <div style={{ flexShrink: 0, padding: 14, borderTop: '1px solid var(--border)', background: 'var(--surface)' }}>
            <div className="field" style={{ height: 'auto', minHeight: 52, alignItems: 'flex-start', padding: 12, flexDirection: 'column', gap: 12 }}>
              <span className="ph" style={{ fontSize: 14 }}>Ask Claude Code to build, refactor, or debug…</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%' }}>
                <HIcon name="attach" size={17} color="var(--faint)" /><span className="chip chip-sm"><HIcon name="file" size={12} color="var(--muted)" />3 files</span>
                <div style={{ flex: 1 }} />
                <button className="btn btn-primary btn-sm"><HIcon name="send" size={14} color="var(--on-accent)" />Run</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </WinChrome>
  );
}

Object.assign(window, { DesktopIDE });
