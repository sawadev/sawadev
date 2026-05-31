import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { DIFF_BODY, FILE_MIDDLEWARE, PORTS, SUGGESTIONS, TREE } from '../data';
import { HIcon } from '../icons';
import type { Msg } from '../types';
import { AIMark, Code, StatusDot, Typing } from '../ui';

// ── chat building blocks ─────────────────────────────────────────
export function Bubble({ children }: { children: ReactNode }) {
  return (
    <div className="rise" style={{ display: 'flex', justifyContent: 'flex-end' }}>
      <div
        style={{
          maxWidth: '84%',
          background: 'var(--accent)',
          color: 'var(--on-accent)',
          borderRadius: '16px 16px 5px 16px',
          padding: '11px 14px',
          fontSize: 14.5,
          lineHeight: 1.45,
          fontWeight: 500,
          boxShadow: '0 4px 14px var(--accent-soft)',
        }}
      >
        {children}
      </div>
    </div>
  );
}

export function AgentText({ children, muted }: { children: ReactNode; muted?: boolean }) {
  return (
    <div className="rise" style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
      <AIMark size={26} />
      <div
        style={{
          flex: 1,
          fontSize: 14.5,
          lineHeight: 1.5,
          color: muted ? 'var(--text-2)' : 'var(--text)',
          paddingTop: 2,
        }}
      >
        {children}
      </div>
    </div>
  );
}

function DiffBody() {
  return <Code lines={DIFF_BODY} />;
}

export function ToolCard({
  m,
  onApprove,
}: { m: Extract<Msg, { role: 'tool' }>; onApprove?: () => void }) {
  const [done, setDone] = useState(false);
  return (
    <div
      className="rise card"
      style={{ marginLeft: 36, overflow: 'hidden', background: 'var(--surface-2)' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '10px 13px' }}>
        <HIcon name={m.icon} size={15} color="var(--muted)" />
        <span style={{ fontSize: 13, fontWeight: 600 }}>{m.title}</span>
        <span className="mono" style={{ fontSize: 11.5, color: 'var(--muted)' }}>
          {m.meta}
        </span>
        <div style={{ flex: 1 }} />
        {m.kind === 'edit' && <span className="chip chip-sm chip-accent">+24 −3</span>}
      </div>
      <div
        style={{
          padding: '0 13px 12px',
          borderTop: '1px solid var(--border-soft)',
          paddingTop: 10,
        }}
      >
        {m.body === 'diff' ? (
          <DiffBody />
        ) : (
          <div className="mono" style={{ fontSize: 11.5, color: 'var(--text-2)' }}>
            added 1 package in 2s
          </div>
        )}
      </div>
      {m.approve && (
        <div
          style={{
            display: 'flex',
            gap: 8,
            padding: '10px 13px',
            borderTop: '1px solid var(--border-soft)',
            background: 'var(--surface)',
          }}
        >
          {done ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 7,
                color: 'var(--good)',
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              <HIcon name="check" size={15} color="var(--good)" />
              Approved · committed to main
            </div>
          ) : (
            <>
              <button
                className="btn btn-primary btn-sm"
                style={{ flex: 1 }}
                onClick={() => {
                  setDone(true);
                  onApprove?.();
                }}
              >
                <HIcon name="check" size={14} color="var(--on-accent)" />
                Approve
              </button>
              <button className="btn btn-outline btn-sm" style={{ flex: 1 }}>
                Reject
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ── AI pane ──────────────────────────────────────────────────────
export function AIPane({
  msgs,
  running,
  onSend,
}: { msgs: Msg[]; running: boolean; onSend: (v: string) => void }) {
  const scroller = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = scroller.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [msgs.length, running]);
  return (
    <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
      <div
        ref={scroller}
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          padding: '14px 14px 6px',
          display: 'flex',
          flexDirection: 'column',
          gap: 13,
        }}
      >
        <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--muted)' }} className="mono">
          session · storefront-api · main
        </div>
        {msgs.map((m, i) => {
          if (m.role === 'user') return <Bubble key={i}>{m.text}</Bubble>;
          if (m.role === 'agent')
            return (
              <AgentText key={i} muted={m.muted}>
                {m.text}
              </AgentText>
            );
          if (m.role === 'tool') return <ToolCard key={i} m={m} />;
          return null;
        })}
        {running && (
          <div className="fade" style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <AIMark size={26} />
            <div
              style={{
                background: 'var(--surface-2)',
                border: '1px solid var(--border-soft)',
                borderRadius: 14,
                padding: '10px 14px',
              }}
            >
              <Typing />
            </div>
          </div>
        )}
      </div>
      <ChatInput onSend={onSend} running={running} />
    </div>
  );
}

function ChatInput({ onSend, running }: { onSend: (v: string) => void; running: boolean }) {
  const [val, setVal] = useState('');
  const [focus, setFocus] = useState(false);
  const submit = () => {
    const v = val.trim();
    if (!v || running) return;
    setVal('');
    onSend(v);
  };
  return (
    <div
      style={{
        borderTop: '1px solid var(--border)',
        background: 'var(--surface)',
        padding: '10px 12px',
      }}
    >
      {!running && (
        <div style={{ display: 'flex', gap: 7, overflowX: 'auto', paddingBottom: 9 }}>
          {SUGGESTIONS.map((s, i) => (
            <button
              key={i}
              className="chip chip-sm chip-press"
              style={{ flexShrink: 0 }}
              onClick={() => onSend(s)}
            >
              <HIcon name="sparkleSm" size={12} color="var(--accent-text)" />
              {s}
            </button>
          ))}
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 9 }}>
        <span className="chip chip-sm chip-accent chip-press">
          <HIcon name="sparkleSm" size={12} color="var(--accent-text)" />
          Claude Code
          <HIcon name="chevD" size={11} color="var(--accent-text)" />
        </span>
        <span className="chip chip-sm chip-press">
          <HIcon name="branch" size={12} color="var(--muted)" />
          main
        </span>
      </div>
      <div
        className={`field${focus ? ' focus' : ''}`}
        style={{
          height: 'auto',
          minHeight: 46,
          padding: '8px 10px 8px 12px',
          alignItems: 'center',
        }}
      >
        <HIcon name="attach" size={18} color="var(--faint)" />
        <input
          value={val}
          onChange={(e) => setVal(e.target.value)}
          onFocus={() => setFocus(true)}
          onBlur={() => setFocus(false)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') submit();
          }}
          placeholder="Ask the agent to build something…"
          style={{
            flex: 1,
            border: 'none',
            outline: 'none',
            background: 'transparent',
            font: 'inherit',
            fontSize: 14.5,
            color: 'var(--text)',
          }}
        />
        <button
          onClick={submit}
          className="btn btn-primary btn-icon btn-sm"
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            opacity: val.trim() && !running ? 1 : 0.5,
          }}
        >
          <HIcon name="send" size={16} color="var(--on-accent)" />
        </button>
      </div>
    </div>
  );
}

// ── Files pane ───────────────────────────────────────────────────
export function FilesPane({ onOpen }: { onOpen: () => void }) {
  return (
    <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: 12 }}>
        <div className="field" style={{ height: 40 }}>
          <HIcon name="search" size={16} color="var(--faint)" />
          <span className="ph" style={{ fontSize: 14 }}>
            Find file…
          </span>
        </div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 8px 12px' }}>
        {TREE.map((t, i) => (
          <div
            key={i}
            onClick={() => t.ic === 'file' && onOpen()}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              height: 40,
              padding: `0 10px 0 ${10 + t.d * 17}px`,
              borderRadius: 9,
              background: t.cur ? 'var(--accent-soft)' : 'transparent',
              cursor: t.ic === 'file' ? 'pointer' : 'default',
            }}
          >
            {t.ic === 'folder' ? (
              <HIcon name={t.open ? 'chevD' : 'chevR'} size={12} color="var(--faint)" />
            ) : (
              <span style={{ width: 12 }} />
            )}
            <HIcon name={t.ic} size={16} color={t.cur ? 'var(--accent-text)' : 'var(--muted)'} />
            <span
              className="mono"
              style={{
                fontSize: 13.5,
                fontWeight: t.cur ? 600 : 500,
                color: t.cur ? 'var(--text)' : 'var(--text-2)',
                flex: 1,
              }}
            >
              {t.n}
            </span>
            {t.badge && (
              <span
                className="mono"
                style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--accent-text)' }}
              >
                {t.badge}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Editor pane ──────────────────────────────────────────────────
export function EditorPane({ onAskAI }: { onAskAI: () => void }) {
  return (
    <div
      style={{
        flex: 1,
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--surface)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'stretch',
          height: 40,
          borderBottom: '1px solid var(--border)',
          background: 'var(--surface-2)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 7,
            padding: '0 14px',
            background: 'var(--surface)',
            borderRight: '1px solid var(--border)',
            borderTop: '2px solid var(--accent)',
          }}
        >
          <HIcon name="file" size={13} color="var(--accent-text)" />
          <span className="mono" style={{ fontSize: 12.5, fontWeight: 600 }}>
            middleware.ts
          </span>
          <span className="dot" style={{ background: 'var(--accent)' }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '0 14px' }}>
          <HIcon name="file" size={13} color="var(--faint)" />
          <span className="mono" style={{ fontSize: 12.5, color: 'var(--muted)' }}>
            server.ts
          </span>
        </div>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 8px' }}>
        <Code lines={FILE_MIDDLEWARE} />
      </div>
      <div
        style={{
          height: 46,
          borderTop: '1px solid var(--border)',
          background: 'var(--surface-2)',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '0 14px',
        }}
      >
        <span className="mono" style={{ fontSize: 11, color: 'var(--muted)' }}>
          TS · Ln 6 · 2 edits
        </span>
        <div style={{ flex: 1 }} />
        <button className="chip chip-sm chip-accent chip-press" onClick={onAskAI}>
          <HIcon name="command" size={12} color="var(--accent-text)" />
          Edit with AI
        </button>
      </div>
    </div>
  );
}

// ── Terminal pane ────────────────────────────────────────────────
function TermRow({ children, c, prompt }: { children: ReactNode; c?: string; prompt?: boolean }) {
  return (
    <div
      className="mono"
      style={{
        fontSize: 12,
        lineHeight: 1.7,
        color: c || 'rgba(220,220,212,0.92)',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
      }}
    >
      {prompt && <span style={{ color: 'var(--accent-text)' }}>$ </span>}
      {children}
    </div>
  );
}

export function TerminalPane() {
  return (
    <div
      style={{
        flex: 1,
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--term-bg)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '9px 14px',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
        }}
      >
        <span className="dot dot-live" style={{ background: 'var(--good)' }} />
        <span className="mono" style={{ fontSize: 12, color: 'rgba(220,220,212,0.85)' }}>
          bash · agent session
        </span>
        <div style={{ flex: 1 }} />
        <HIcon name="plus" size={15} color="rgba(220,220,212,0.5)" />
        <HIcon name="copy" size={14} color="rgba(220,220,212,0.5)" />
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: 14 }}>
        <TermRow prompt c="rgba(240,240,233,0.95)">
          claude "add JWT auth middleware"
        </TermRow>
        <TermRow c="rgba(160,160,152,0.9)">● Claude Code · analyzing repo…</TermRow>
        <TermRow c="rgba(160,160,152,0.9)"> ↳ read src/server.ts, src/auth/</TermRow>
        <TermRow c="var(--accent-text)">✎ editing src/auth/middleware.ts</TermRow>
        <TermRow> + 24 lines − 3 lines</TermRow>
        <TermRow prompt c="rgba(240,240,233,0.95)">
          npm run test auth
        </TermRow>
        <TermRow c="#7fd99a"> ✓ 14 passing (1.2s)</TermRow>
        <TermRow prompt c="rgba(240,240,233,0.95)">
          <span
            style={{
              display: 'inline-block',
              width: 8,
              height: 15,
              background: 'rgba(240,240,233,0.9)',
              verticalAlign: 'text-bottom',
              animation: 'pulse 1.1s steps(1) infinite',
            }}
          />
        </TermRow>
      </div>
      <div style={{ padding: 12, borderTop: '1px solid rgba(255,255,255,0.07)' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 9,
            background: 'rgba(255,255,255,0.06)',
            borderRadius: 10,
            padding: '0 12px',
            height: 42,
          }}
        >
          <span className="mono" style={{ color: 'var(--accent-text)', fontSize: 13 }}>
            $
          </span>
          <span className="mono" style={{ flex: 1, fontSize: 13, color: 'rgba(220,220,212,0.55)' }}>
            run a command…
          </span>
          <HIcon name="command" size={15} color="rgba(220,220,212,0.45)" />
        </div>
      </div>
    </div>
  );
}

// ── Preview pane ─────────────────────────────────────────────────
export function PreviewPane() {
  return (
    <div
      style={{
        flex: 1,
        minHeight: 0,
        overflowY: 'auto',
        padding: 14,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      <div style={{ fontSize: 12.5, color: 'var(--muted)', fontWeight: 600 }}>
        Running apps · auto subdomains
      </div>
      {PORTS.map((p, i) => (
        <div
          key={i}
          className="card"
          style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 12 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 11,
                background: 'var(--elevated)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <HIcon name="globe" size={18} color="var(--muted)" />
            </div>
            <div style={{ flex: 1 }}>
              <div className="mono" style={{ fontSize: 14, fontWeight: 600 }}>
                {p.name}
                <span style={{ color: 'var(--faint)', fontWeight: 400 }}> :{p.port}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                <StatusDot on={p.on} live={p.on} />
                <span style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600 }}>
                  {p.on ? 'live' : 'stopped'}
                </span>
              </div>
            </div>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              height: 36,
              borderRadius: 9,
              background: 'var(--surface-2)',
              border: '1px solid var(--border-soft)',
              padding: '0 11px',
            }}
          >
            <HIcon name="lock" size={12} color="var(--faint)" />
            <span
              className="mono"
              style={{
                fontSize: 11,
                color: 'var(--text-2)',
                flex: 1,
                overflow: 'hidden',
                whiteSpace: 'nowrap',
                textOverflow: 'ellipsis',
              }}
            >
              storefront-{p.port}.sawadev.io
            </span>
            <HIcon name="copy" size={14} color="var(--faint)" />
          </div>
          <button
            className={`btn btn-sm ${p.on ? 'btn-primary' : 'btn-outline'}`}
            style={{ opacity: p.on ? 1 : 0.6 }}
          >
            <HIcon name="external" size={14} color={p.on ? 'var(--on-accent)' : 'var(--text)'} />
            Open in browser
          </button>
        </div>
      ))}
    </div>
  );
}
