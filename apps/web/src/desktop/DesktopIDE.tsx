import type { ReactNode } from 'react';
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { FileTree } from '../editor/FileTree';
import { WorkspaceFileEditor } from '../editor/WorkspaceFileEditor';
import { HIcon } from '../icons';
import { AgentText, Bubble, ToolCard } from '../mobile/panes';
import { AIMark, StatusDot } from '../ui';
import { DeskRail } from './DesktopShell';

function DTerm() {
  const L = ({ children, c, p }: { children: ReactNode; c?: string; p?: boolean }) => (
    <div
      className="mono"
      style={{ fontSize: 12, lineHeight: 1.75, color: c || 'rgba(220,220,212,0.9)' }}
    >
      {p && <span style={{ color: 'var(--accent-text)' }}>$ </span>}
      {children}
    </div>
  );
  return (
    <div
      style={{
        height: 196,
        flexShrink: 0,
        borderTop: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--term-bg)',
      }}
    >
      <div
        style={{
          height: 34,
          display: 'flex',
          alignItems: 'stretch',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          paddingLeft: 4,
        }}
      >
        {(
          [
            ['Terminal', true],
            ['Agent · claude', false],
            ['Output', false],
          ] as [string, boolean][]
        ).map(([l, on], i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 7,
              padding: '0 14px',
              borderBottom: on ? '2px solid var(--accent)' : '2px solid transparent',
            }}
          >
            <HIcon
              name="terminal"
              size={12}
              color={on ? 'rgba(235,235,230,0.95)' : 'rgba(220,220,212,0.45)'}
            />
            <span
              className="mono"
              style={{
                fontSize: 11.5,
                color: on ? 'rgba(235,235,230,0.95)' : 'rgba(220,220,212,0.45)',
                fontWeight: on ? 600 : 400,
              }}
            >
              {l}
            </span>
          </div>
        ))}
      </div>
      <div style={{ flex: 1, padding: '12px 16px', overflow: 'hidden' }}>
        <L p c="rgba(240,240,233,0.95)">
          claude "add JWT auth middleware"
        </L>
        <L c="rgba(160,160,152,0.9)">
          ● Claude Code · analyzing repo… ↳ read src/server.ts, src/auth/
        </L>
        <L c="var(--accent-text)">✎ editing src/auth/middleware.ts +24 −3</L>
        <L p c="rgba(240,240,233,0.95)">
          npm run test auth
        </L>
        <L c="#7fd99a"> ✓ 14 passing (1.2s)</L>
        <L p c="rgba(240,240,233,0.95)">
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
        </L>
      </div>
    </div>
  );
}

export function DesktopIDE() {
  const { id } = useParams();
  const workspaceId = id ?? '';
  const [openFile, setOpenFile] = useState<string | null>(null);
  return (
    <div style={{ height: '100%', display: 'flex', background: 'var(--bg)' }}>
      <DeskRail />
      {/* file tree */}
      <div
        style={{
          width: 234,
          flexShrink: 0,
          borderRight: '1px solid var(--border)',
          background: 'var(--surface-2)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            height: 44,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '0 14px',
            borderBottom: '1px solid var(--border)',
          }}
        >
          <span className="mono" style={{ fontSize: 13, fontWeight: 700, flex: 1 }}>
            {workspaceId}
          </span>
        </div>
        <div style={{ flex: 1, overflow: 'auto' }}>
          <FileTree workspaceId={workspaceId} currentPath={openFile} onOpen={setOpenFile} />
        </div>
      </div>
      {/* editor + terminal */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <div
          style={{
            height: 44,
            flexShrink: 0,
            borderBottom: '1px solid var(--border)',
            background: 'var(--surface)',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '0 16px',
          }}
        >
          <span className="chip chip-sm">
            <HIcon name="branch" size={12} color="var(--muted)" />
            main
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <StatusDot on live />
            <span style={{ fontSize: 12.5, color: 'var(--muted)', fontWeight: 600 }}>running</span>
          </div>
          <div style={{ flex: 1 }} />
          <button className="btn btn-outline btn-sm">
            <HIcon name="globe" size={14} color="var(--text)" />
            Preview
          </button>
          <button className="btn btn-outline btn-sm">
            <HIcon name="play" size={14} color="var(--text)" />
            Run
          </button>
        </div>
        <div style={{ flex: 1, minHeight: 0 }}>
          <WorkspaceFileEditor workspaceId={workspaceId} path={openFile} />
        </div>
        <DTerm />
      </div>
      {/* AI panel */}
      <div
        style={{
          width: 392,
          flexShrink: 0,
          borderLeft: '1px solid var(--border)',
          background: 'var(--surface-2)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            height: 48,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '0 16px',
            borderBottom: '1px solid var(--border)',
            background: 'var(--surface)',
          }}
        >
          <AIMark size={26} />
          <span style={{ fontSize: 14, fontWeight: 700, flex: 1 }}>AI Agent</span>
          <span className="chip chip-sm chip-accent">
            Claude Code
            <HIcon name="chevD" size={11} color="var(--accent-text)" />
          </span>
          <HIcon name="history" size={16} color="var(--faint)" />
        </div>
        <div
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: 'auto',
            padding: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 13,
          }}
        >
          <Bubble>Add JWT auth middleware and protect the /orders routes</Bubble>
          <AgentText>I'll verify the bearer token, then guard the orders router.</AgentText>
          <ToolCard
            m={{
              role: 'tool',
              kind: 'cmd',
              icon: 'terminal',
              title: 'Ran command',
              meta: 'npm i jsonwebtoken',
              body: 'out',
            }}
          />
          <ToolCard
            m={{
              role: 'tool',
              kind: 'edit',
              icon: 'diff',
              title: 'Edited',
              meta: 'auth/middleware.ts',
              body: 'diff',
              approve: true,
            }}
          />
          <AgentText muted>Done — 14 tests pass. Want refresh-token rotation too?</AgentText>
        </div>
        <div
          style={{
            flexShrink: 0,
            padding: 14,
            borderTop: '1px solid var(--border)',
            background: 'var(--surface)',
          }}
        >
          <div
            className="field"
            style={{
              height: 'auto',
              minHeight: 52,
              alignItems: 'flex-start',
              padding: 12,
              flexDirection: 'column',
              gap: 12,
            }}
          >
            <span className="ph" style={{ fontSize: 14 }}>
              Ask Claude Code to build, refactor, or debug…
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%' }}>
              <HIcon name="attach" size={17} color="var(--faint)" />
              <span className="chip chip-sm">
                <HIcon name="file" size={12} color="var(--muted)" />3 files
              </span>
              <div style={{ flex: 1 }} />
              <button className="btn btn-primary btn-sm">
                <HIcon name="send" size={14} color="var(--on-accent)" />
                Run
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
