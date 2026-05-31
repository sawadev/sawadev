import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { FileTree } from '../editor/FileTree';
import { WorkspaceFileEditor } from '../editor/WorkspaceFileEditor';
import { HIcon } from '../icons';
import { AgentText, Bubble, ToolCard } from '../mobile/panes';
import { WorkspacePreview } from '../preview/WorkspacePreview';
import { WorkspaceTerminal } from '../terminal/Terminal';
import { AIMark, StatusDot } from '../ui';
import { DeskRail } from './DesktopShell';

function DTerm({ workspaceId }: { workspaceId: string }) {
  return (
    <div
      style={{
        height: 220,
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
          alignItems: 'center',
          gap: 7,
          padding: '0 14px',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
        }}
      >
        <HIcon name="terminal" size={12} color="rgba(235,235,230,0.95)" />
        <span
          className="mono"
          style={{ fontSize: 11.5, color: 'rgba(235,235,230,0.95)', fontWeight: 600 }}
        >
          Terminal
        </span>
      </div>
      <div style={{ flex: 1, minHeight: 0 }}>
        <WorkspaceTerminal workspaceId={workspaceId} />
      </div>
    </div>
  );
}

export function DesktopIDE() {
  const { id } = useParams();
  const workspaceId = id ?? '';
  const [openFile, setOpenFile] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
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
          <button
            type="button"
            className={showPreview ? 'btn btn-primary btn-sm' : 'btn btn-outline btn-sm'}
            onClick={() => setShowPreview((v) => !v)}
          >
            <HIcon
              name="globe"
              size={14}
              color={showPreview ? 'var(--on-accent)' : 'var(--text)'}
            />
            Preview
          </button>
        </div>
        <div style={{ flex: 1, minHeight: 0 }}>
          {showPreview ? (
            <WorkspacePreview workspaceId={workspaceId} />
          ) : (
            <WorkspaceFileEditor workspaceId={workspaceId} path={openFile} />
          )}
        </div>
        <DTerm workspaceId={workspaceId} />
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
