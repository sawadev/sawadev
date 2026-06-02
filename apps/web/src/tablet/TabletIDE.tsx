import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useStartWorkspace, useWorkspaces } from '../api/hooks';
import { DeskRail } from '../desktop/DesktopShell';
import { FileTree } from '../editor/FileTree';
import { WorkspaceFileEditor } from '../editor/WorkspaceFileEditor';
import { HIcon } from '../icons';
import { EditorTabs } from '../ide/EditorTabs';
import { IdeStateProvider } from '../ide/IdeState';
import { RightDock } from '../ide/RightDock';
import { StatsChip } from '../ide/StatsChip';
import { useIde } from '../ide/ide-context';
import { TerminalPanel } from '../terminal/TerminalPanel';
import { StatusDot } from '../ui';

const PANES: { k: string; icon: string; label: string }[] = [
  { k: 'files', icon: 'folder', label: 'Files' },
  { k: 'editor', icon: 'file', label: 'Editor' },
  { k: 'terminal', icon: 'terminal', label: 'Terminal' },
];

/** Intermediate tablet layout: slim rail + single work pane + persistent AI panel. */
export function TabletIDE() {
  const { id } = useParams();
  const workspaceId = id ?? '';
  return (
    <IdeStateProvider key={workspaceId} workspaceId={workspaceId}>
      <TabletIDEBody workspaceId={workspaceId} />
    </IdeStateProvider>
  );
}

function TabletIDEBody({ workspaceId }: { workspaceId: string }) {
  const [tab, setTab] = useState('editor');
  const files = useIde();
  const { data: workspaces = [] } = useWorkspaces();
  const status = workspaces.find((w) => w.id === workspaceId)?.status;
  const running = status === 'running';
  const start = useStartWorkspace();

  const leftPane = {
    files: (
      <FileTree
        workspaceId={workspaceId}
        currentPath={files.active}
        onOpen={(p, persistent) => {
          if (persistent) files.openPersistent(p);
          else files.open(p);
          setTab('editor');
        }}
      />
    ),
    editor: (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
        <EditorTabs
          tabs={files.tabs}
          active={files.active}
          dirty={files.dirty}
          preview={files.preview}
          onActivate={files.setActive}
          onClose={files.close}
          onPromote={files.promote}
        />
        <div style={{ flex: 1, minHeight: 0 }}>
          <WorkspaceFileEditor
            workspaceId={workspaceId}
            path={files.active}
            onDirtyChange={files.setDirty}
          />
        </div>
      </div>
    ),
    terminal: <TerminalPanel workspaceId={workspaceId} />,
  }[tab];

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', background: 'var(--bg)' }}>
      <DeskRail />

      {/* work column */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <div
          style={{
            height: 56,
            flexShrink: 0,
            borderBottom: '1px solid var(--border)',
            background: 'var(--surface)',
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            padding: '0 18px',
          }}
        >
          <div>
            <div className="mono" style={{ fontSize: 14.5, fontWeight: 600, lineHeight: 1.1 }}>
              {workspaceId}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
              <HIcon name="branch" size={11} color="var(--faint)" />
              <span style={{ fontSize: 11.5, color: 'var(--muted)' }}>main</span>
              <StatusDot on={running} live={running} />
              <span style={{ fontSize: 11.5, color: 'var(--muted)' }}>{status ?? '…'}</span>
            </div>
          </div>
          {running ? (
            <StatsChip workspaceId={workspaceId} />
          ) : (
            <button
              type="button"
              className="btn btn-ghost btn-icon btn-sm"
              title={start.isPending ? 'Starting…' : 'Start workspace'}
              aria-label="Start workspace"
              disabled={start.isPending}
              onClick={() => start.mutate(workspaceId)}
            >
              <HIcon name="play" size={14} color="var(--good)" />
            </button>
          )}
          <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
            <div className="seg">
              {PANES.map((p) => (
                <button
                  key={p.k}
                  type="button"
                  className={tab === p.k ? 'on' : ''}
                  onClick={() => setTab(p.k)}
                >
                  <HIcon name={p.icon} size={14} color="currentColor" />
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div
          key={tab}
          className="fade"
          style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}
        >
          {leftPane}
        </div>
      </div>

      {/* persistent AI panel — redimensionnable + repliable */}
      <RightDock workspaceId={workspaceId} defaultWidth={416} headerHeight={56} />
    </div>
  );
}
