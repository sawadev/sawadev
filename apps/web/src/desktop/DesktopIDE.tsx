import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { FileTree } from '../editor/FileTree';
import { WorkspaceFileEditor } from '../editor/WorkspaceFileEditor';
import { HIcon } from '../icons';
import { AgentPanel } from '../ide/AgentPanel';
import { EditorTabs } from '../ide/EditorTabs';
import { StatsChip } from '../ide/StatsChip';
import { useOpenFiles } from '../ide/useOpenFiles';
import { WorkspacePreview } from '../preview/WorkspacePreview';
import { WorkspaceTerminal } from '../terminal/Terminal';
import { StatusDot } from '../ui';
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
  const files = useOpenFiles();
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
          <FileTree workspaceId={workspaceId} currentPath={files.active} onOpen={files.open} />
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
          <StatsChip workspaceId={workspaceId} />
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
        {!showPreview && (
          <EditorTabs
            tabs={files.tabs}
            active={files.active}
            onActivate={files.setActive}
            onClose={files.close}
          />
        )}
        <div style={{ flex: 1, minHeight: 0 }}>
          {showPreview ? (
            <WorkspacePreview workspaceId={workspaceId} />
          ) : (
            <WorkspaceFileEditor workspaceId={workspaceId} path={files.active} />
          )}
        </div>
        <DTerm workspaceId={workspaceId} />
      </div>
      {/* AI panel — redimensionnable + repliable */}
      <AgentPanel workspaceId={workspaceId} />
    </div>
  );
}
