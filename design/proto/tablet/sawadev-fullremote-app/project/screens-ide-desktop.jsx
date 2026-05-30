// screens-ide-desktop.jsx — desktop IDE core + expanded AI chat (mobile+desktop)

function IdeDeskTopBar() {
  return (
    <div style={{ height: 48, flexShrink: 0, borderBottom: `1px solid ${WF.line}`, background: WF.paper, display: 'flex', alignItems: 'center', gap: 14, padding: '0 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
        <span style={{ width: 13, height: 13, borderRadius: 3, background: WF.accent, transform: 'rotate(45deg)' }} />
        <span style={{ fontFamily: WF.mono, fontSize: 14, fontWeight: 700 }}>storefront-api</span>
      </div>
      <Chip sm icon="branch">main</Chip>
      <StatusBadge on label="running" />
      <div style={{ flex: 1 }} />
      <Btn kind="default" sm icon="globe">Preview</Btn>
      <Btn kind="default" sm icon="play">Run</Btn>
      <Btn kind="soft" sm icon="external" style={{ width: 32, padding: 0 }}> </Btn>
      <Avatar size={28} label="JM" />
    </div>
  );
}

function DeskFileTree() {
  const tree = [
    { d: 0, ic: 'folder', n: 'src', open: true }, { d: 1, ic: 'folder', n: 'auth', open: true },
    { d: 2, ic: 'file', n: 'middleware.ts', cur: true, badge: 'M' }, { d: 2, ic: 'file', n: 'tokens.ts' },
    { d: 1, ic: 'folder', n: 'routes' }, { d: 1, ic: 'file', n: 'server.ts' }, { d: 1, ic: 'file', n: 'db.ts' },
    { d: 0, ic: 'folder', n: 'tests' }, { d: 0, ic: 'file', n: 'package.json' }, { d: 0, ic: 'file', n: 'Dockerfile' }, { d: 0, ic: 'file', n: '.env' }, { d: 0, ic: 'file', n: 'README.md' },
  ];
  return (
    <div style={{ width: 232, flexShrink: 0, borderRight: `1px solid ${WF.line}`, background: WF.screen, display: 'flex', flexDirection: 'column' }}>
      <div style={{ height: 38, display: 'flex', alignItems: 'center', gap: 8, padding: '0 14px', borderBottom: `1px solid ${WF.line}` }}>
        <span style={{ fontFamily: WF.sans, fontSize: 11.5, fontWeight: 700, color: WF.ink2, letterSpacing: 0.4, flex: 1 }}>EXPLORER</span>
        <Icon name="search" size={14} c={WF.ink3} /><Icon name="plus" size={15} c={WF.ink3} />
      </div>
      <div style={{ flex: 1, padding: '6px 6px' }}>
        {tree.map((t, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 7, height: 28, padding: `0 8px 0 ${8 + t.d * 16}px`, borderRadius: 6, background: t.cur ? WF.accentSoft : 'transparent' }}>
            {t.ic === 'folder' ? <Icon name={t.open ? 'chevD' : 'chevR'} size={11} c={WF.ink3} /> : <span style={{ width: 11 }} />}
            <Icon name={t.ic} size={14} c={t.cur ? WF.accent : WF.ink2} />
            <span style={{ fontFamily: WF.mono, fontSize: 12.5, fontWeight: t.cur ? 600 : 500, color: t.cur ? WF.ink : WF.ink2, flex: 1 }}>{t.n}</span>
            {t.badge && <span style={{ fontFamily: WF.mono, fontSize: 9.5, fontWeight: 700, color: WF.accent }}>{t.badge}</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

function DeskEditorTabs() {
  return (
    <div style={{ height: 38, flexShrink: 0, display: 'flex', alignItems: 'stretch', background: WF.fill, borderBottom: `1px solid ${WF.line}` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '0 14px', background: WF.paper, borderRight: `1px solid ${WF.line}`, borderTop: `2px solid ${WF.accent}` }}>
        <Icon name="file" size={13} c={WF.accent} /><span style={{ fontFamily: WF.mono, fontSize: 12, fontWeight: 600 }}>middleware.ts</span><span style={{ width: 6, height: 6, borderRadius: 3, background: WF.accent }} />
      </div>
      {['server.ts', 'routes.ts'].map((f, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '0 14px', borderRight: `1px solid ${WF.line}` }}>
          <Icon name="file" size={13} c={WF.ink3} /><span style={{ fontFamily: WF.mono, fontSize: 12, color: WF.ink3 }}>{f}</span>
        </div>
      ))}
      <div style={{ flex: 1 }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0 14px' }}>
        <Chip sm icon="sparkle" style={{ background: WF.accentSoft, color: WF.accent }}>⌘K · edit with AI</Chip>
        <Icon name="panel" size={15} c={WF.ink3} />
      </div>
    </div>
  );
}

function ScreenIdeDesktop() {
  return (
    <BrowserChrome url="storefront-api.sawadev.io/edit">
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <IdeDeskTopBar />
        <div style={{ flex: 1, minHeight: 0, display: 'flex' }}>
          <DeskFileTree />
          {/* editor + terminal dock */}
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
            <DeskEditorTabs />
            <div style={{ flex: 1, minHeight: 0, padding: '14px 16px', overflow: 'hidden', display: 'flex', gap: 30 }}>
              <div style={{ flex: 1 }}><CodeBlock rows={SAMPLE_CODE} /></div>
              <div style={{ flex: 1 }}><CodeBlock rows={SAMPLE_CODE.slice(2)} start={13} /></div>
            </div>
            {/* terminal dock */}
            <div style={{ height: 188, flexShrink: 0, borderTop: `1px solid ${WF.line}`, display: 'flex', flexDirection: 'column' }}>
              <div style={{ height: 34, background: '#1f1f1c', display: 'flex', alignItems: 'center', gap: 0, paddingLeft: 4 }}>
                {[['Terminal', true], ['Agent · claude', false], ['Output', false]].map(([l, on], i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 7, height: '100%', padding: '0 13px', borderBottom: on ? `2px solid ${WF.accent}` : 'none' }}>
                    <Icon name="terminal" size={12} c={on ? '#e6e6df' : '#8f8f88'} /><span style={{ fontFamily: WF.mono, fontSize: 11.5, color: on ? '#e6e6df' : '#8f8f88', fontWeight: on ? 600 : 400 }}>{l}</span>
                  </div>
                ))}
                <div style={{ flex: 1 }} />
                <Icon name="plus" size={14} c="#8f8f88" style={{ marginRight: 8 }} /><Icon name="x" size={14} c="#8f8f88" style={{ marginRight: 12 }} />
              </div>
              <div style={{ flex: 1, minHeight: 0 }}><TerminalBody /></div>
            </div>
          </div>
          {/* AI chat panel */}
          <div style={{ width: 384, flexShrink: 0, borderLeft: `1px solid ${WF.line}`, background: WF.screen, display: 'flex', flexDirection: 'column' }}>
            <div style={{ height: 44, display: 'flex', alignItems: 'center', gap: 9, padding: '0 14px', borderBottom: `1px solid ${WF.line}`, background: WF.paper }}>
              <Avatar size={24} ai />
              <span style={{ fontFamily: WF.sans, fontSize: 13.5, fontWeight: 700, flex: 1 }}>AI Agent</span>
              <Icon name="refresh" size={15} c={WF.ink3} /><Icon name="dotsV" size={16} c={WF.ink3} />
            </div>
            <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', padding: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <UserMsg>Add JWT auth middleware and protect /orders</UserMsg>
              <AgentLine>Verifying the bearer token, then guarding the orders router.</AgentLine>
              <ToolCard icon="terminal" title="Ran" meta="npm i jsonwebtoken" />
              <ToolCard icon="edit" title="Edited" meta="middleware.ts" approve><DiffMini /></ToolCard>
              <AgentLine muted>14 tests green. Add refresh rotation?</AgentLine>
            </div>
            <ChatInput compact />
          </div>
        </div>
        <Anno style={{ position: 'absolute', bottom: 200, left: 250, width: 150, transform: 'rotate(-2deg)' }}>tree · editor · AI panel right · terminal docked below</Anno>
      </div>
    </BrowserChrome>
  );
}

// ── AI chat expanded (mobile) ────────────────────────────────────
function ScreenChatExpandedMobile() {
  return (
    <PhoneScreen noHome>
      <div style={{ height: 50, flexShrink: 0, borderBottom: `1px solid ${WF.line}`, background: WF.paper, display: 'flex', alignItems: 'center', gap: 10, padding: '0 14px' }}>
        <Icon name="chevD" size={20} c={WF.ink2} />
        <AgentSwitcher style={{ flex: 1, justifyContent: 'center' }} />
        <Icon name="refresh" size={18} c={WF.ink2} />
      </div>
      <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', padding: '16px 14px', display: 'flex', flexDirection: 'column', gap: 13, background: WF.screen }}>
        <div style={{ textAlign: 'center', fontFamily: WF.mono, fontSize: 10.5, color: WF.ink3 }}>session started · storefront-api</div>
        <UserMsg>Refactor the orders service to use the new auth middleware and add tests</UserMsg>
        <AgentLine>I'll wire the middleware into the orders router, then add coverage for authorized + unauthorized cases.</AgentLine>
        <div style={{ marginLeft: 33, display: 'flex', alignItems: 'center', gap: 7, fontFamily: WF.sans, fontSize: 12, color: WF.ink3 }}>
          <Icon name="search" size={12} c={WF.ink3} /> read 3 files · routes/orders.ts, auth/middleware.ts
        </div>
        <ToolCard icon="diff" title="Edited" meta="routes/orders.ts" approve><DiffMini /></ToolCard>
        <ToolCard icon="terminal" title="Ran command" meta="npm test">
          <TermLine c={WF.ink2} style={{ fontSize: 11 }}>✓ 18 passing  (1.4s)</TermLine>
        </ToolCard>
        <AgentLine muted>All green. The orders routes now reject requests without a valid token.</AgentLine>
      </div>
      <ChatInput />
    </PhoneScreen>
  );
}

// ── AI chat expanded (desktop) — with agent switcher dropdown open ─
const AGENTS = [
  { n: 'Claude Code', d: 'anthropic · CLI', on: true },
  { n: 'Cursor CLI', d: 'cursor-agent', on: false },
  { n: 'Codex CLI', d: 'openai', on: false },
];
function ScreenChatExpandedDesktop() {
  return (
    <BrowserChrome url="storefront-api.sawadev.io/agent">
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: WF.screen, position: 'relative' }}>
        {/* header */}
        <div style={{ height: 56, flexShrink: 0, borderBottom: `1px solid ${WF.line}`, background: WF.paper, display: 'flex', alignItems: 'center', gap: 14, padding: '0 24px' }}>
          <div style={{ position: 'relative' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 9, height: 38, padding: '0 14px', borderRadius: 10, background: WF.accentSoft, border: `1px solid ${WF.accentLine}` }}>
              <Avatar size={22} ai /><span style={{ fontFamily: WF.sans, fontSize: 14, fontWeight: 700, color: WF.accent }}>Claude Code</span><Icon name="chevD" size={14} c={WF.accent} />
            </div>
            {/* dropdown */}
            <div style={{ position: 'absolute', top: 46, left: 0, width: 230, background: WF.paper, borderRadius: 12, border: `1px solid ${WF.line}`, boxShadow: '0 16px 44px rgba(0,0,0,.18)', padding: 6, zIndex: 5 }}>
              {AGENTS.map((a, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px', borderRadius: 8, background: a.on ? WF.accentSoft : 'transparent' }}>
                  <div style={{ width: 28, height: 28, borderRadius: 7, background: a.on ? WF.accent : WF.fill, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon name="sparkle" size={14} c={a.on ? '#fff' : WF.ink2} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: WF.sans, fontSize: 13, fontWeight: 600, color: WF.ink }}>{a.n}</div>
                    <div style={{ fontFamily: WF.mono, fontSize: 10.5, color: WF.ink3 }}>{a.d}</div>
                  </div>
                  {a.on && <Icon name="check" size={15} c={WF.accent} />}
                </div>
              ))}
              <div style={{ height: 1, background: WF.line, margin: '5px 6px' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px', color: WF.ink2 }}>
                <div style={{ width: 28, height: 28, borderRadius: 7, border: `1.5px dashed ${WF.line2}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="plus" size={14} c={WF.ink3} /></div>
                <span style={{ fontFamily: WF.sans, fontSize: 13, fontWeight: 600 }}>Add agent…</span>
              </div>
            </div>
          </div>
          <div style={{ flex: 1 }} />
          <Chip icon="branch">main</Chip>
          <Btn kind="default" sm icon="diff">Review all changes</Btn>
          <Avatar size={28} label="JM" />
        </div>

        {/* conversation column */}
        <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex', justifyContent: 'center', padding: '24px 0' }}>
          <div style={{ width: 720, maxWidth: '92%', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <UserMsg>Refactor the orders service to use the new auth middleware, then add tests for authorized and unauthorized requests</UserMsg>
            <AgentLine>I'll wire the middleware into the orders router and add coverage for both paths. Starting by reading the current implementation.</AgentLine>
            <div style={{ marginLeft: 33, display: 'flex', alignItems: 'center', gap: 8, fontFamily: WF.sans, fontSize: 12.5, color: WF.ink3 }}>
              <Icon name="search" size={13} c={WF.ink3} /> read routes/orders.ts, auth/middleware.ts, tests/orders.test.ts
            </div>
            <ToolCard indent title="Edited" icon="diff" meta="routes/orders.ts · +18 −6" approve>
              <DiffMini />
            </ToolCard>
            <ToolCard indent title="Ran command" icon="terminal" meta="npm test orders">
              <TermLine c={WF.ink2} style={{ fontSize: 11 }}>PASS  tests/orders.test.ts</TermLine>
              <TermLine c={WF.ink2} style={{ fontSize: 11 }}>✓ 18 passing  (1.4s)</TermLine>
            </ToolCard>
            <AgentLine muted>Done. Orders routes now reject unauthenticated requests and all tests pass. Want me to open a PR?</AgentLine>
          </div>
        </div>

        {/* input */}
        <div style={{ flexShrink: 0, padding: '0 0 22px', display: 'flex', justifyContent: 'center' }}>
          <div style={{ width: 720, maxWidth: '92%' }}>
            <div style={{ border: `1.5px solid ${WF.line2}`, borderRadius: 15, padding: 14, background: WF.paper, boxShadow: '0 2px 12px rgba(0,0,0,.05)' }}>
              <div style={{ fontFamily: WF.sans, fontSize: 14, color: WF.ink3, marginBottom: 14 }}>Ask Claude Code to build, refactor, or debug…</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Btn kind="soft" sm icon="attach" style={{ width: 32, padding: 0 }}> </Btn>
                <Chip sm icon="file">3 files</Chip>
                <AgentSwitcher sm />
                <div style={{ flex: 1 }} />
                <Btn kind="default" sm icon="mic" style={{ width: 32, padding: 0 }}> </Btn>
                <Btn kind="primary" sm iconR="send">Run</Btn>
              </div>
            </div>
          </div>
        </div>
        <Anno style={{ position: 'absolute', top: 70, left: 30, width: 130, transform: 'rotate(-3deg)' }}>switch agents: Claude Code · Cursor · Codex · + add</Anno>
      </div>
    </BrowserChrome>
  );
}

Object.assign(window, { ScreenIdeDesktop, ScreenChatExpandedMobile, ScreenChatExpandedDesktop });
