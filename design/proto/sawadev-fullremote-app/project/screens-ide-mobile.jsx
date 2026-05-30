// screens-ide-mobile.jsx — THE core screen, two mobile directions
// Also defines shared chat + code + terminal primitives (exported for desktop).

// ── code rendering (greyscale pseudo-code) ───────────────────────
function CodeRow({ no, indent = 0, segs, add, style }) {
  // segs: array of [width, tone]  tone: 'kw'|'var'|'str'|'fn'|'mut'
  const tone = { kw: '#8b8b86', var: '#5a5a55', str: '#9a9a94', fn: '#3f3f3b', mut: WF.accent, dim: WF.ink3 };
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, height: 19, background: add ? WF.accentSoft : 'transparent', ...style }}>
      <span style={{ fontFamily: WF.mono, fontSize: 10.5, color: WF.ink3, width: 18, textAlign: 'right', flexShrink: 0 }}>{no}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, paddingLeft: indent * 14 }}>
        {add && <span style={{ fontFamily: WF.mono, fontSize: 10, color: WF.accent, marginRight: 2 }}>+</span>}
        {segs.map(([w, t], i) => <div key={i} style={{ width: w, height: 7, borderRadius: 2, background: tone[t] || tone.var }} />)}
      </div>
    </div>
  );
}
function CodeBlock({ rows, start = 1, style }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5, ...style }}>
      {rows.map((r, i) => <CodeRow key={i} no={start + i} {...r} />)}
    </div>
  );
}
const SAMPLE_CODE = [
  { indent: 0, segs: [[30, 'kw'], [54, 'fn'], [16, 'var']] },
  { indent: 1, segs: [[26, 'kw'], [40, 'var'], [70, 'str']] },
  { indent: 1, segs: [[48, 'fn'], [34, 'var']] },
  { indent: 2, segs: [[30, 'kw'], [60, 'var'], [44, 'str']] },
  { indent: 2, segs: [[80, 'fn'], [22, 'var']], add: true },
  { indent: 2, segs: [[40, 'var'], [56, 'str']], add: true },
  { indent: 1, segs: [[20, 'kw']] },
  { indent: 0, segs: [[14, 'kw']] },
  { indent: 0, segs: [] },
  { indent: 0, segs: [[36, 'kw'], [62, 'fn']] },
  { indent: 1, segs: [[44, 'var'], [30, 'str']] },
  { indent: 1, segs: [[58, 'fn'], [20, 'var']] },
];

// ── terminal rendering (charcoal) ────────────────────────────────
function TermLine({ children, c = '#cfcfc8', prompt, style }) {
  return (
    <div style={{ fontFamily: WF.mono, fontSize: 11.5, lineHeight: 1.65, color: c, whiteSpace: 'pre-wrap', wordBreak: 'break-word', ...style }}>
      {prompt && <span style={{ color: WF.accentLine }}>$ </span>}{children}
    </div>
  );
}
function TerminalBody({ style }) {
  return (
    <div style={{ background: '#1f1f1c', padding: 14, height: '100%', overflow: 'hidden', ...style }}>
      <TermLine prompt c="#e6e6df">claude "add JWT auth middleware"</TermLine>
      <TermLine c="#8f8f88" style={{ margin: '6px 0 2px' }}>● Claude Code · analyzing repo…</TermLine>
      <TermLine c="#8f8f88">  ↳ read src/server.ts, src/auth/</TermLine>
      <TermLine style={{ color: WF.accentLine, margin: '4px 0' }}>✎ editing src/auth/middleware.ts</TermLine>
      <TermLine c="#cfcfc8">  + 24 lines  − 3 lines</TermLine>
      <TermLine c="#8f8f88" style={{ marginTop: 6 }}>$ npm run test auth</TermLine>
      <TermLine c="#9cc79c">  ✓ 14 passing  (1.2s)</TermLine>
      <TermLine prompt c="#e6e6df" style={{ marginTop: 8 }}>
        <span style={{ background: '#cfcfc8', width: 7, height: 14, display: 'inline-block', verticalAlign: 'middle' }} />
      </TermLine>
    </div>
  );
}

// ── shared chat primitives ───────────────────────────────────────
function UserMsg({ children }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 4 }}>
      <div style={{ maxWidth: '82%', background: WF.ink, color: '#fff', borderRadius: '14px 14px 4px 14px', padding: '10px 14px', fontFamily: WF.sans, fontSize: 13.5, lineHeight: 1.4 }}>{children}</div>
    </div>
  );
}
function AgentLine({ children, muted }) {
  return (
    <div style={{ display: 'flex', gap: 9, alignItems: 'flex-start' }}>
      <Avatar size={24} ai />
      <div style={{ flex: 1, fontFamily: WF.sans, fontSize: 13.5, lineHeight: 1.5, color: muted ? WF.ink2 : WF.ink, paddingTop: 2 }}>{children}</div>
    </div>
  );
}
function ToolCard({ icon = 'edit', title, meta, children, approve, indent = true }) {
  return (
    <div style={{ marginLeft: indent ? 33 : 0, border: `1px solid ${WF.line}`, borderRadius: 11, overflow: 'hidden', background: WF.paper }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '9px 12px', background: WF.fill, borderBottom: children ? `1px solid ${WF.line}` : 'none' }}>
        <Icon name={icon} size={14} c={WF.ink2} />
        <span style={{ fontFamily: WF.sans, fontSize: 12.5, fontWeight: 600, color: WF.ink }}>{title}</span>
        {meta && <span style={{ fontFamily: WF.mono, fontSize: 10.5, color: WF.ink3 }}>{meta}</span>}
        <div style={{ flex: 1 }} />
        <Icon name="chevD" size={13} c={WF.ink3} />
      </div>
      {children && <div style={{ padding: 12 }}>{children}</div>}
      {approve && (
        <div style={{ display: 'flex', gap: 8, padding: '10px 12px', borderTop: `1px solid ${WF.line}`, background: WF.screen }}>
          <Btn kind="primary" sm icon="check" style={{ flex: 1 }}>Approve</Btn>
          <Btn kind="default" sm style={{ flex: 1 }}>Reject</Btn>
        </div>
      )}
    </div>
  );
}
function DiffLine({ sign, w }) {
  const add = sign === '+';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, height: 16, background: add ? WF.accentSoft : sign === '-' ? '#f0eceb' : 'transparent', borderRadius: 2, paddingLeft: 4 }}>
      <span style={{ fontFamily: WF.mono, fontSize: 10, color: add ? WF.accent : sign === '-' ? '#b08884' : WF.ink3, width: 8 }}>{sign}</span>
      <div style={{ width: w, height: 6, borderRadius: 2, background: add ? WF.accentLine : sign === '-' ? '#cdb3b0' : WF.fill2 }} />
    </div>
  );
}
function DiffMini() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3, fontFamily: WF.mono }}>
      <DiffLine sign=" " w={120} /><DiffLine sign="-" w={90} /><DiffLine sign="+" w={140} /><DiffLine sign="+" w={110} /><DiffLine sign=" " w={70} />
    </div>
  );
}
function AgentSwitcher({ sm, style }) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, height: sm ? 28 : 32, padding: '0 10px', borderRadius: 8, background: WF.accentSoft, border: `1px solid ${WF.accentLine}`, ...style }}>
      <Icon name="sparkle" size={13} c={WF.accent} />
      <span style={{ fontFamily: WF.sans, fontSize: 12.5, fontWeight: 600, color: WF.accent }}>Claude Code</span>
      <Icon name="chevD" size={12} c={WF.accent} />
    </div>
  );
}
function ChatInput({ compact }) {
  return (
    <div style={{ borderTop: `1px solid ${WF.line}`, background: WF.paper, padding: compact ? '10px 14px' : '12px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <AgentSwitcher sm />
        <Chip sm icon="branch">main</Chip>
      </div>
      <div style={{ border: `1.5px solid ${WF.line2}`, borderRadius: 13, padding: '10px 12px', background: WF.paper, display: 'flex', alignItems: 'flex-end', gap: 10 }}>
        <Icon name="attach" size={18} c={WF.ink3} />
        <div style={{ flex: 1, fontFamily: WF.sans, fontSize: 13.5, color: WF.ink3 }}>Ask the agent to build something…</div>
        <Icon name="mic" size={18} c={WF.ink3} />
        <div style={{ width: 34, height: 34, borderRadius: 9, background: WF.accent, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="send" size={16} c="#fff" />
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { CodeBlock, CodeRow, SAMPLE_CODE, TermLine, TerminalBody, UserMsg, AgentLine, ToolCard, DiffLine, DiffMini, AgentSwitcher, ChatInput });

// ── mobile IDE chrome ────────────────────────────────────────────
function IdeTopBar({ title = 'storefront-api', sub }) {
  return (
    <div style={{ height: 46, flexShrink: 0, borderBottom: `1px solid ${WF.line}`, background: WF.paper, display: 'flex', alignItems: 'center', gap: 10, padding: '0 14px' }}>
      <Icon name="back" size={20} c={WF.ink2} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: WF.mono, fontSize: 13.5, fontWeight: 600, color: WF.ink, lineHeight: 1.1 }}>{title}</div>
        {sub && <div style={{ fontFamily: WF.sans, fontSize: 10.5, color: WF.ink3 }}>{sub}</div>}
      </div>
      <Chip sm icon="branch">main</Chip>
      <Icon name="dotsV" size={18} c={WF.ink2} />
    </div>
  );
}
const IDE_TABS = [
  { icon: 'folder', label: 'Files' },
  { icon: 'file', label: 'Code' },
  { icon: 'terminal', label: 'Terminal' },
  { icon: 'sparkle', label: 'AI', ai: true },
];

// ── Direction A panes ────────────────────────────────────────────
function PaneFiles() {
  const tree = [
    { d: 0, ic: 'folder', n: 'src', open: true }, { d: 1, ic: 'folder', n: 'auth', open: true },
    { d: 2, ic: 'file', n: 'middleware.ts', cur: true, badge: 'M' }, { d: 2, ic: 'file', n: 'tokens.ts' },
    { d: 1, ic: 'folder', n: 'routes' }, { d: 1, ic: 'file', n: 'server.ts' }, { d: 1, ic: 'file', n: 'db.ts' },
    { d: 0, ic: 'folder', n: 'tests' }, { d: 0, ic: 'file', n: 'package.json' }, { d: 0, ic: 'file', n: 'Dockerfile', badge: '' }, { d: 0, ic: 'file', n: '.env' },
  ];
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: WF.paper }}>
      <div style={{ padding: 12, borderBottom: `1px solid ${WF.line}` }}>
        <div style={{ height: 36, borderRadius: 9, background: WF.fill, display: 'flex', alignItems: 'center', gap: 8, padding: '0 11px' }}>
          <Icon name="search" size={15} c={WF.ink3} /><span style={{ fontFamily: WF.sans, fontSize: 13, color: WF.ink3 }}>Find file…</span>
        </div>
      </div>
      <div style={{ flex: 1, padding: '6px 6px' }}>
        {tree.map((t, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, height: 38, padding: `0 10px 0 ${10 + t.d * 18}px`, borderRadius: 8, background: t.cur ? WF.accentSoft : 'transparent' }}>
            {t.ic === 'folder' && <Icon name={t.open ? 'chevD' : 'chevR'} size={12} c={WF.ink3} />}
            {t.ic === 'file' && <span style={{ width: 12 }} />}
            <Icon name={t.ic} size={16} c={t.cur ? WF.accent : WF.ink2} />
            <span style={{ fontFamily: WF.mono, fontSize: 13, fontWeight: t.cur ? 600 : 500, color: t.cur ? WF.ink : WF.ink2, flex: 1 }}>{t.n}</span>
            {t.badge && <span style={{ fontFamily: WF.mono, fontSize: 10, fontWeight: 700, color: WF.accent }}>{t.badge}</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
function PaneEditor() {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: WF.paper }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 0, borderBottom: `1px solid ${WF.line}`, background: WF.fill, height: 38, paddingLeft: 4 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, height: '100%', padding: '0 13px', background: WF.paper, borderRight: `1px solid ${WF.line}`, borderTop: `2px solid ${WF.accent}` }}>
          <Icon name="file" size={13} c={WF.accent} /><span style={{ fontFamily: WF.mono, fontSize: 12, fontWeight: 600 }}>middleware.ts</span>
          <span style={{ width: 6, height: 6, borderRadius: 3, background: WF.accent }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, height: '100%', padding: '0 13px' }}>
          <Icon name="file" size={13} c={WF.ink3} /><span style={{ fontFamily: WF.mono, fontSize: 12, color: WF.ink3 }}>server.ts</span>
        </div>
      </div>
      <div style={{ flex: 1, padding: '12px 10px', overflow: 'hidden' }}>
        <CodeBlock rows={SAMPLE_CODE} />
      </div>
      <div style={{ height: 40, flexShrink: 0, borderTop: `1px solid ${WF.line}`, background: WF.fill, display: 'flex', alignItems: 'center', gap: 12, padding: '0 14px' }}>
        <span style={{ fontFamily: WF.mono, fontSize: 11, color: WF.ink3 }}>TS · UTF-8 · Ln 42</span>
        <div style={{ flex: 1 }} />
        <Chip sm icon="sparkle" style={{ background: WF.accentSoft, color: WF.accent }}>Ask AI to edit</Chip>
      </div>
    </div>
  );
}
function PaneTerminal() {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', background: '#1f1f1c' }}>
        <span style={{ width: 9, height: 9, borderRadius: 5, background: WF.accent }} />
        <span style={{ fontFamily: WF.mono, fontSize: 11.5, color: '#cfcfc8' }}>bash · agent session</span>
        <div style={{ flex: 1 }} />
        <Icon name="plus" size={15} c="#8f8f88" />
        <Icon name="copy" size={14} c="#8f8f88" />
      </div>
      <div style={{ flex: 1 }}><TerminalBody /></div>
    </div>
  );
}
function PaneAI({ compact }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: WF.screen }}>
      <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', padding: '14px 14px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <UserMsg>Add JWT auth middleware and protect the /orders routes</UserMsg>
        <AgentLine>I'll add a middleware that verifies the bearer token, then apply it to the orders router.</AgentLine>
        <ToolCard icon="terminal" title="Ran command" meta="npm i jsonwebtoken">
          <TermLine c={WF.ink2} style={{ fontSize: 11 }}>added 1 package in 2s</TermLine>
        </ToolCard>
        <ToolCard icon="edit" title="Edited" meta="auth/middleware.ts" approve>
          <DiffMini />
        </ToolCard>
        <AgentLine muted>Tests pass. Want me to also add refresh-token rotation?</AgentLine>
      </div>
      <ChatInput compact={compact} />
    </div>
  );
}

function makeIdeA(PaneComp, activeTab, sub) {
  return (
    <PhoneScreen noHome>
      <IdeTopBar sub={sub} />
      <PaneComp />
      <BottomTabs items={IDE_TABS} active={activeTab} />
    </PhoneScreen>
  );
}
function ScreenIdeAFiles() { return makeIdeA(PaneFiles, 0, 'Files'); }
function ScreenIdeAEditor() { return makeIdeA(PaneEditor, 1, 'Editor'); }
function ScreenIdeATerminal() { return makeIdeA(PaneTerminal, 2, 'Terminal'); }
function ScreenIdeAChat() { return makeIdeA(() => <PaneAI compact />, 3, 'AI agent'); }

// ── Direction B — AI-first: chat is home, code is a drawer ───────
function ScreenIdeBHome() {
  return (
    <PhoneScreen noHome>
      <div style={{ height: 46, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 10, padding: '0 14px', borderBottom: `1px solid ${WF.line}`, background: WF.paper }}>
        <Icon name="back" size={20} c={WF.ink2} />
        <Avatar size={26} ai />
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: WF.sans, fontSize: 13.5, fontWeight: 700, lineHeight: 1.1 }}>Claude Code</div>
          <div style={{ fontFamily: WF.mono, fontSize: 10.5, color: WF.ink3 }}>storefront-api · main</div>
        </div>
        <Chip sm icon="terminal">logs</Chip>
        <Icon name="dotsV" size={18} c={WF.ink2} />
      </div>
      <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', padding: '14px 14px', display: 'flex', flexDirection: 'column', gap: 12, background: WF.screen }}>
        <UserMsg>Add JWT auth middleware and protect /orders</UserMsg>
        <AgentLine>On it. I'll verify the bearer token and guard the orders router.</AgentLine>
        <ToolCard icon="edit" title="Edited" meta="middleware.ts">
          <DiffMini />
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <Chip sm icon="file">View file</Chip>
            <Chip sm icon="diff">Full diff</Chip>
          </div>
        </ToolCard>
        <AgentLine muted>Done — 14 tests green.</AgentLine>
      </div>
      <ChatInput compact />
      <Anno style={{ position: 'absolute', top: 120, right: 8, width: 86, transform: 'rotate(3deg)' }}>AI is the home screen — chat-driven coding</Anno>
    </PhoneScreen>
  );
}

function ScreenIdeBDrawer() {
  return (
    <PhoneScreen noHome statusDark>
      {/* dimmed chat behind */}
      <div style={{ position: 'absolute', inset: 0, background: WF.screen }} />
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(30,28,24,.35)' }} />
      {/* pulled-up code drawer */}
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, top: 70, background: WF.paper, borderRadius: '18px 18px 0 0', boxShadow: '0 -8px 30px rgba(0,0,0,.18)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 8 }}>
          <div style={{ width: 40, height: 5, borderRadius: 3, background: WF.line2 }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '12px 14px', borderBottom: `1px solid ${WF.line}` }}>
          <Icon name="file" size={15} c={WF.accent} />
          <span style={{ fontFamily: WF.mono, fontSize: 13, fontWeight: 600 }}>middleware.ts</span>
          <Chip sm style={{ background: WF.accentSoft, color: WF.accent }}>+24 −3</Chip>
          <div style={{ flex: 1 }} />
          <Seg items={[{ label: 'Diff' }, { label: 'File' }]} active={0} sm />
        </div>
        <div style={{ flex: 1, padding: '12px 10px', overflow: 'hidden' }}>
          <CodeBlock rows={SAMPLE_CODE} />
        </div>
        <div style={{ display: 'flex', gap: 10, padding: 14, borderTop: `1px solid ${WF.line}` }}>
          <Btn kind="default" sm icon="terminal" style={{ flex: 1 }}>Terminal</Btn>
          <Btn kind="primary" sm icon="check" style={{ flex: 1 }}>Keep changes</Btn>
        </div>
      </div>
      <Anno style={{ position: 'absolute', top: 30, left: 18, width: 120, transform: 'rotate(-3deg)' }} c="#e6e6df">code peeks up as a drawer over the chat</Anno>
    </PhoneScreen>
  );
}

function ScreenIdeBSwitch() {
  // quick-switch sheet: jump to files/editor/terminal/preview from AI home
  const rows = [
    { ic: 'folder', n: 'Files', d: 'Browse & open files' },
    { ic: 'file', n: 'Editor', d: 'middleware.ts · +24' },
    { ic: 'terminal', n: 'Terminal', d: 'agent session running', badge: true },
    { ic: 'globe', n: 'Preview', d: 'storefront-3000 · live' },
  ];
  return (
    <PhoneScreen noHome statusDark>
      <div style={{ position: 'absolute', inset: 0, background: WF.screen }} />
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(30,28,24,.35)' }} />
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, background: WF.paper, borderRadius: '18px 18px 0 0', boxShadow: '0 -8px 30px rgba(0,0,0,.18)', padding: '10px 0 22px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 10 }}>
          <div style={{ width: 40, height: 5, borderRadius: 3, background: WF.line2 }} />
        </div>
        <div style={{ fontFamily: WF.sans, fontSize: 12.5, fontWeight: 700, color: WF.ink3, padding: '0 20px 8px' }}>JUMP TO</div>
        {rows.map((r, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '13px 20px' }}>
            <div style={{ width: 40, height: 40, borderRadius: 11, background: WF.fill, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name={r.ic} size={19} c={WF.ink2} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: WF.sans, fontSize: 15, fontWeight: 600 }}>{r.n}</div>
              <div style={{ fontFamily: WF.sans, fontSize: 12, color: WF.ink3, marginTop: 1 }}>{r.d}</div>
            </div>
            {r.badge && <span style={{ width: 8, height: 8, borderRadius: 4, background: WF.accent }} />}
            <Icon name="chevR" size={16} c={WF.ink3} />
          </div>
        ))}
      </div>
      <Anno style={{ position: 'absolute', top: 40, right: 14, width: 120, transform: 'rotate(2deg)' }} c="#e6e6df">swipe-up sheet to reach the other panes when needed</Anno>
    </PhoneScreen>
  );
}

Object.assign(window, {
  ScreenIdeAFiles, ScreenIdeAEditor, ScreenIdeATerminal, ScreenIdeAChat,
  ScreenIdeBHome, ScreenIdeBDrawer, ScreenIdeBSwitch, PaneAI, IdeTopBar, IDE_TABS,
});
