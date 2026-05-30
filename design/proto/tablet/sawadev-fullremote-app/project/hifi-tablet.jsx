// hifi-tablet.jsx — iPad frame + intermediate tablet IDE (work pane + persistent AI)

function IPadFrame({ dark, children }) {
  const CW = 1194, CH = 834, B = 16;
  return (
    <div style={{ width: CW + B * 2, height: CH + B * 2, borderRadius: 34, background: dark ? '#0b0b0d' : '#1c1c1e', padding: B, boxShadow: '0 40px 90px rgba(0,0,0,0.22), 0 0 0 1px rgba(0,0,0,0.14)', position: 'relative' }}>
      {/* camera */}
      <div style={{ position: 'absolute', top: B / 2 + 2, left: '50%', transform: 'translateX(-50%)', width: 7, height: 7, borderRadius: 5, background: '#2a2a2e', boxShadow: 'inset 0 0 2px rgba(0,0,0,0.6)' }} />
      <div style={{ width: CW, height: CH, borderRadius: 20, overflow: 'hidden', position: 'relative', background: dark ? '#000' : '#fff' }}>
        {children}
        {/* home indicator */}
        <div style={{ position: 'absolute', bottom: 7, left: '50%', transform: 'translateX(-50%)', width: 220, height: 5, borderRadius: 3, background: dark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.28)', zIndex: 60, pointerEvents: 'none' }} />
      </div>
    </div>
  );
}

function ipadAgentRun() {
  return [
    { delay: 600, msg: { role: 'agent', text: "Got it — I'll plan the change, edit the relevant files, then run the tests." } },
    { delay: 1100, msg: { role: 'tool', kind: 'cmd', icon: 'search', title: 'Read', meta: '3 files', body: 'out' } },
    { delay: 1300, msg: { role: 'tool', kind: 'edit', icon: 'diff', title: 'Edited', meta: 'src/server.ts', body: 'diff', approve: true } },
    { delay: 1200, msg: { role: 'tool', kind: 'cmd', icon: 'terminal', title: 'Ran command', meta: 'npm test', body: 'out' } },
    { delay: 900, msg: { role: 'agent', muted: true, text: 'All green — 18 tests passing. Want me to open a pull request?' } },
  ];
}

const TAB_PANES = [
  { k: 'files', icon: 'folder', label: 'Files' },
  { k: 'editor', icon: 'file', label: 'Editor' },
  { k: 'terminal', icon: 'terminal', label: 'Terminal' },
  { k: 'preview', icon: 'globe', label: 'Preview' },
];

function TabletIDE({ theme, onToggleTheme }) {
  const [tab, setTab] = React.useState('editor');
  const [msgs, setMsgs] = React.useState(SEED_MSGS);
  const [running, setRunning] = React.useState(false);
  const timers = React.useRef([]);
  React.useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const send = (prompt) => {
    setMsgs((m) => [...m, { role: 'user', text: prompt }]);
    setRunning(true);
    let t = 0;
    ipadAgentRun().forEach((s, i, arr) => {
      t += s.delay;
      timers.current.push(setTimeout(() => { setMsgs((m) => [...m, s.msg]); if (i === arr.length - 1) setRunning(false); }, t));
    });
  };

  const leftPane = {
    files: <FilesPane onOpen={() => setTab('editor')} />,
    editor: <EditorPane onAskAI={() => {}} />,
    terminal: <TerminalPane />,
    preview: <PreviewPane />,
  }[tab];

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', background: 'var(--bg)' }}>
      {/* slim rail */}
      <div style={{ width: 60, flexShrink: 0, background: 'var(--surface-2)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '16px 0', gap: 6 }}>
        <div style={{ width: 34, height: 34, borderRadius: 10, background: 'var(--bg)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}><span style={{ width: 14, height: 14, borderRadius: 4, background: 'var(--accent)', transform: 'rotate(45deg)' }} /></div>
        {[['grid', false], ['folder', true], ['gear', false]].map(([ic, on], i) => (
          <div key={i} style={{ width: 42, height: 42, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', background: on ? 'var(--surface)' : 'transparent', boxShadow: on ? '0 1px 3px rgba(0,0,0,.15)' : 'none', border: on ? '1px solid var(--border-soft)' : '1px solid transparent' }}>
            <HIcon name={ic} size={20} color={on ? 'var(--text)' : 'var(--faint)'} sw={on ? 1.8 : 1.6} />
          </div>
        ))}
        <div style={{ flex: 1 }} />
        <button onClick={onToggleTheme} className="btn btn-ghost btn-icon" style={{ width: 42, height: 42 }}><HIcon name={theme === 'dark' ? 'sun' : 'moon'} size={18} color="var(--muted)" /></button>
        <UserMark size={34} />
      </div>

      {/* work column */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <div style={{ height: 56, flexShrink: 0, borderBottom: '1px solid var(--border)', background: 'var(--surface)', display: 'flex', alignItems: 'center', gap: 14, padding: '0 18px' }}>
          <div>
            <div className="mono" style={{ fontSize: 14.5, fontWeight: 600, lineHeight: 1.1 }}>storefront-api</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}><HIcon name="branch" size={11} color="var(--faint)" /><span style={{ fontSize: 11.5, color: 'var(--muted)' }}>main</span><StatusDot on live /><span style={{ fontSize: 11.5, color: 'var(--muted)' }}>running</span></div>
          </div>
          <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
            <div className="seg">
              {TAB_PANES.map((p) => <button key={p.k} className={tab === p.k ? 'on' : ''} onClick={() => setTab(p.k)}><HIcon name={p.icon} size={14} color="currentColor" />{p.label}</button>)}
            </div>
          </div>
          <button className="btn btn-soft btn-sm"><HIcon name="branch" size={13} color="var(--text)" />Commit</button>
          <button className="btn btn-primary btn-sm"><HIcon name="play" size={14} color="var(--on-accent)" />Run</button>
        </div>
        <div key={tab} className="fade" style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>{leftPane}</div>
      </div>

      {/* persistent AI panel */}
      <div style={{ width: 416, flexShrink: 0, borderLeft: '1px solid var(--border)', background: 'var(--surface-2)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ height: 56, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 11, padding: '0 18px', borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}>
          <AIMark size={28} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14.5, fontWeight: 700, lineHeight: 1.1 }}>AI Agent</div>
            <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 2 }}>always alongside your work</div>
          </div>
          <HIcon name="history" size={17} color="var(--faint)" />
        </div>
        <AIPane msgs={msgs} running={running} onSend={send} />
      </div>
    </div>
  );
}

function TabletApp({ theme, onToggleTheme }) {
  return (
    <IPadFrame dark={theme === 'dark'}>
      <TabletIDE theme={theme} onToggleTheme={onToggleTheme} />
    </IPadFrame>
  );
}

Object.assign(window, { IPadFrame, TabletIDE, TabletApp });
