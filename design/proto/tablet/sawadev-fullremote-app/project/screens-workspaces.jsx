// screens-workspaces.jsx — Dashboard, empty state, create workspace

// shared desktop icon rail (reused by settings / preview)
function RailNav({ active = 'grid' }) {
  const items = [
    { icon: 'grid', key: 'grid' },
    { icon: 'terminal', key: 'term' },
    { icon: 'globe', key: 'globe' },
    { icon: 'gear', key: 'gear' },
  ];
  return (
    <div style={{ width: 60, flexShrink: 0, background: WF.fill, borderRight: `1px solid ${WF.line}`, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '16px 0', gap: 6 }}>
      <div style={{ width: 32, height: 32, borderRadius: 8, background: WF.ink, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
        <span style={{ width: 12, height: 12, borderRadius: 3, background: WF.accent, transform: 'rotate(45deg)' }} />
      </div>
      {items.map((it) => (
        <div key={it.key} style={{ width: 40, height: 40, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: active === it.key ? WF.paper : 'transparent', boxShadow: active === it.key ? '0 1px 2px rgba(0,0,0,.08)' : 'none' }}>
          <Icon name={it.icon} size={19} c={active === it.key ? WF.ink : WF.ink3} sw={active === it.key ? 1.7 : 1.5} />
        </div>
      ))}
      <div style={{ flex: 1 }} />
      <Avatar size={32} label="JM" />
    </div>
  );
}

const WORKSPACES = [
  { name: 'storefront-api', stack: 'node', status: true, last: '2m ago', cpu: '2 vCPU · 4 GB' },
  { name: 'marketing-site', stack: 'next', status: true, last: '1h ago', cpu: '1 vCPU · 2 GB' },
  { name: 'ml-pipeline', stack: 'python', status: false, last: 'yesterday', cpu: '4 vCPU · 8 GB' },
  { name: 'rust-cli', stack: 'rust', status: false, last: '3d ago', cpu: '2 vCPU · 4 GB' },
];

function WsCardMobile({ w }) {
  return (
    <div style={{ border: `1px solid ${WF.line}`, borderRadius: 14, background: WF.paper, padding: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
        <div style={{ width: 38, height: 38, borderRadius: 10, background: WF.fill, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="cpu" size={19} c={WF.ink2} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: WF.mono, fontSize: 14.5, fontWeight: 600, color: WF.ink }}>{w.name}</div>
          <div style={{ fontFamily: WF.sans, fontSize: 12, color: WF.ink3, marginTop: 2 }}>opened {w.last}</div>
        </div>
        <Icon name="dotsV" size={18} c={WF.ink3} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Chip sm>{w.stack}</Chip>
        <StatusBadge on={w.status} />
        <div style={{ flex: 1 }} />
        <span style={{ fontFamily: WF.mono, fontSize: 10.5, color: WF.ink3 }}>{w.cpu}</span>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <Btn kind={w.status ? 'primary' : 'default'} sm full icon={w.status ? 'chevR' : 'play'}>{w.status ? 'Open' : 'Start'}</Btn>
        <Btn kind="soft" sm icon="gear" style={{ width: 38, padding: 0 }}> </Btn>
      </div>
    </div>
  );
}

function ScreenDashMobile() {
  return (
    <PhoneScreen>
      {/* top bar */}
      <div style={{ padding: '4px 18px 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <Wordmark size={19} />
        <div style={{ flex: 1 }} />
        <Icon name="search" size={20} c={WF.ink2} />
        <Avatar size={30} label="JM" />
      </div>
      {/* heading */}
      <div style={{ padding: '0 18px 14px', display: 'flex', alignItems: 'center' }}>
        <div>
          <div style={{ fontFamily: WF.sans, fontSize: 21, fontWeight: 700 }}>Workspaces</div>
          <div style={{ fontFamily: WF.sans, fontSize: 12.5, color: WF.ink3, marginTop: 2 }}>2 running · 4 total</div>
        </div>
      </div>
      {/* list */}
      <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', padding: '0 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {WORKSPACES.slice(0, 3).map((w, i) => <WsCardMobile key={i} w={w} />)}
      </div>
      {/* FAB */}
      <div style={{ position: 'absolute', right: 18, bottom: 30 }}>
        <Btn kind="primary" icon="plus" style={{ height: 52, borderRadius: 26, padding: '0 22px', boxShadow: '0 6px 20px rgba(0,0,0,.18)' }}>New</Btn>
      </div>
      <Anno style={{ position: 'absolute', top: 150, right: 10, width: 84, transform: 'rotate(3deg)' }}>cards: stack, status, resources</Anno>
    </PhoneScreen>
  );
}

function ScreenDashEmpty() {
  return (
    <PhoneScreen>
      <div style={{ padding: '4px 18px 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <Wordmark size={19} />
        <div style={{ flex: 1 }} />
        <Avatar size={30} label="JM" />
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 32px', textAlign: 'center', gap: 18 }}>
        <div style={{ width: 88, height: 88, borderRadius: 22, background: WF.fill, border: `1.5px dashed ${WF.line2}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="cpu" size={38} c={WF.ink3} sw={1.4} />
        </div>
        <div>
          <div style={{ fontFamily: WF.sans, fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Create your first workspace</div>
          <div style={{ fontFamily: WF.sans, fontSize: 14, color: WF.ink2, lineHeight: 1.45 }}>Each project runs in its own Docker container with a terminal, editor, and AI agent.</div>
        </div>
        <Btn kind="primary" icon="plus" style={{ height: 48, padding: '0 22px', marginTop: 4 }}>New workspace</Btn>
      </div>
      <Anno style={{ position: 'absolute', bottom: 90, left: 24, width: 110, transform: 'rotate(-3deg)' }} c={WF.ink3}>empty state — one clear action</Anno>
    </PhoneScreen>
  );
}

function ScreenDashDesktop() {
  return (
    <BrowserChrome url="app.sawadev.io/workspaces">
      <div style={{ height: '100%', display: 'flex' }}>
        <RailNav active="grid" />
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          {/* header */}
          <div style={{ padding: '26px 36px 18px', display: 'flex', alignItems: 'flex-end', gap: 16, borderBottom: `1px solid ${WF.line}` }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: WF.sans, fontSize: 24, fontWeight: 700, letterSpacing: -0.4 }}>Workspaces</div>
              <div style={{ fontFamily: WF.sans, fontSize: 13.5, color: WF.ink3, marginTop: 3 }}>2 running · 4 total</div>
            </div>
            <div style={{ width: 280, height: 38, borderRadius: 10, border: `1px solid ${WF.line2}`, background: WF.paper, display: 'flex', alignItems: 'center', gap: 9, padding: '0 12px' }}>
              <Icon name="search" size={16} c={WF.ink3} />
              <span style={{ fontFamily: WF.sans, fontSize: 13.5, color: WF.ink3 }}>Search workspaces…</span>
            </div>
            <Btn kind="primary" icon="plus">New workspace</Btn>
          </div>
          {/* grid */}
          <div style={{ flex: 1, minHeight: 0, padding: 36, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 18, alignContent: 'start' }}>
            {WORKSPACES.map((w, i) => (
              <div key={i} style={{ border: `1px solid ${WF.line}`, borderRadius: 16, background: WF.paper, padding: 18, display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: WF.fill, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon name="cpu" size={22} c={WF.ink2} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: WF.mono, fontSize: 15, fontWeight: 600 }}>{w.name}</div>
                    <div style={{ fontFamily: WF.sans, fontSize: 12, color: WF.ink3, marginTop: 3 }}>opened {w.last}</div>
                  </div>
                  <Icon name="dotsV" size={18} c={WF.ink3} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Chip sm>{w.stack}</Chip>
                  <StatusBadge on={w.status} />
                  <div style={{ flex: 1 }} />
                  <span style={{ fontFamily: WF.mono, fontSize: 11, color: WF.ink3 }}>{w.cpu}</span>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <Btn kind={w.status ? 'primary' : 'default'} sm icon={w.status ? 'chevR' : 'play'} style={{ flex: 1 }}>{w.status ? 'Open' : 'Start'}</Btn>
                  <Btn kind="soft" sm icon={w.status ? 'stop' : 'gear'} style={{ width: 36, padding: 0 }}> </Btn>
                </div>
              </div>
            ))}
            {/* new tile */}
            <div style={{ border: `1.5px dashed ${WF.line2}`, borderRadius: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, minHeight: 150, color: WF.ink3 }}>
              <Icon name="plus" size={26} c={WF.ink3} />
              <span style={{ fontFamily: WF.sans, fontSize: 13.5, fontWeight: 600 }}>New workspace</span>
            </div>
          </div>
        </div>
      </div>
    </BrowserChrome>
  );
}

// ── Create workspace ─────────────────────────────────────────────
const STACKS = [
  { k: 'node', label: 'Node.js' }, { k: 'next', label: 'Next.js' },
  { k: 'python', label: 'Python' }, { k: 'rust', label: 'Rust' },
  { k: 'go', label: 'Go' }, { k: 'blank', label: 'Blank Ubuntu' },
];

function StackGrid({ active = 0, cols = 3 }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols},1fr)`, gap: 10 }}>
      {STACKS.map((s, i) => (
        <div key={i} style={{
          border: `1.5px solid ${i === active ? WF.accent : WF.line2}`, borderRadius: 11, padding: '12px 10px',
          background: i === active ? WF.accentSoft : WF.paper, display: 'flex', flexDirection: 'column', gap: 8,
        }}>
          <div style={{ width: 26, height: 26, borderRadius: 7, background: i === active ? WF.accent : WF.fill, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="layers" size={15} c={i === active ? '#fff' : WF.ink2} />
          </div>
          <span style={{ fontFamily: WF.sans, fontSize: 12.5, fontWeight: 600, color: i === active ? WF.ink : WF.ink2 }}>{s.label}</span>
        </div>
      ))}
    </div>
  );
}

function LifecycleRow({ icon, title, desc, active }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 13, borderRadius: 11, border: `1.5px solid ${active ? WF.accent : WF.line2}`, background: active ? WF.accentSoft : WF.paper }}>
      <Icon name={icon} size={18} c={active ? WF.accent : WF.ink2} />
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: WF.sans, fontSize: 13.5, fontWeight: 600 }}>{title}</div>
        <div style={{ fontFamily: WF.sans, fontSize: 12, color: WF.ink2, marginTop: 2 }}>{desc}</div>
      </div>
      <div style={{ width: 18, height: 18, borderRadius: 9, border: `1.5px solid ${active ? WF.accent : WF.line2}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {active && <div style={{ width: 9, height: 9, borderRadius: 5, background: WF.accent }} />}
      </div>
    </div>
  );
}

function ScreenCreateMobile() {
  return (
    <PhoneScreen>
      <div style={{ padding: '2px 18px 10px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: `1px solid ${WF.line}` }}>
        <Icon name="x" size={20} c={WF.ink2} />
        <div style={{ fontFamily: WF.sans, fontSize: 16, fontWeight: 700, flex: 1, textAlign: 'center' }}>New workspace</div>
        <div style={{ width: 20 }} />
      </div>
      <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', padding: '18px 18px 0', display: 'flex', flexDirection: 'column', gap: 20 }}>
        <Field label="Workspace name" value="storefront-api" icon="cpu" accent />
        <div>
          <div style={{ fontFamily: WF.sans, fontSize: 12.5, fontWeight: 600, color: WF.ink2, marginBottom: 10 }}>Base image / stack</div>
          <StackGrid active={0} cols={3} />
        </div>
        <div>
          <div style={{ fontFamily: WF.sans, fontSize: 12.5, fontWeight: 600, color: WF.ink2, marginBottom: 10 }}>Lifecycle</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <LifecycleRow icon="bolt" title="Auto-stop when idle" desc="Saves resources · 30 min" active />
            <LifecycleRow icon="refresh" title="Always-on" desc="Never sleeps" />
          </div>
        </div>
      </div>
      <div style={{ padding: 18, borderTop: `1px solid ${WF.line}`, background: WF.paper }}>
        <Btn kind="primary" full icon="plus" style={{ height: 48 }}>Create & open</Btn>
      </div>
    </PhoneScreen>
  );
}

function ScreenCreateDesktop() {
  return (
    <BrowserChrome url="app.sawadev.io/workspaces">
      <div style={{ height: '100%', display: 'flex', position: 'relative' }}>
        <RailNav active="grid" />
        <div style={{ flex: 1, filter: 'blur(0.5px)', opacity: 0.5, padding: 36 }}>
          <div style={{ fontFamily: WF.sans, fontSize: 24, fontWeight: 700 }}>Workspaces</div>
        </div>
        {/* scrim */}
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(30,28,24,.32)' }} />
        {/* modal */}
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 560, background: WF.paper, borderRadius: 18, boxShadow: '0 24px 70px rgba(0,0,0,.3)', overflow: 'hidden' }}>
          <div style={{ padding: '20px 26px', borderBottom: `1px solid ${WF.line}`, display: 'flex', alignItems: 'center' }}>
            <div style={{ fontFamily: WF.sans, fontSize: 18, fontWeight: 700, flex: 1 }}>New workspace</div>
            <Icon name="x" size={20} c={WF.ink3} />
          </div>
          <div style={{ padding: 26, display: 'flex', flexDirection: 'column', gap: 24 }}>
            <Field label="Workspace name" value="storefront-api" icon="cpu" accent />
            <div>
              <div style={{ fontFamily: WF.sans, fontSize: 12.5, fontWeight: 600, color: WF.ink2, marginBottom: 10 }}>Base image / stack</div>
              <StackGrid active={0} cols={3} />
            </div>
            <div>
              <div style={{ fontFamily: WF.sans, fontSize: 12.5, fontWeight: 600, color: WF.ink2, marginBottom: 10 }}>Lifecycle</div>
              <div style={{ display: 'flex', gap: 10 }}>
                <div style={{ flex: 1 }}><LifecycleRow icon="bolt" title="Auto-stop when idle" desc="30 min idle" active /></div>
                <div style={{ flex: 1 }}><LifecycleRow icon="refresh" title="Always-on" desc="Never sleeps" /></div>
              </div>
            </div>
          </div>
          <div style={{ padding: '16px 26px', borderTop: `1px solid ${WF.line}`, display: 'flex', gap: 12 }}>
            <div style={{ flex: 1 }} />
            <Btn kind="ghost">Cancel</Btn>
            <Btn kind="primary" icon="plus">Create & open</Btn>
          </div>
        </div>
        <Anno style={{ position: 'absolute', top: 100, right: 70, width: 130, transform: 'rotate(2deg)' }}>modal on desktop · full screen on mobile</Anno>
      </div>
    </BrowserChrome>
  );
}

Object.assign(window, { RailNav, ScreenDashMobile, ScreenDashEmpty, ScreenDashDesktop, ScreenCreateMobile, ScreenCreateDesktop });
