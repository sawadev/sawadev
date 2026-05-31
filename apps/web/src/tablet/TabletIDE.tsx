import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { DeskRail } from '../desktop/DesktopShell';
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

const PANES: { k: string; icon: string; label: string }[] = [
  { k: 'files', icon: 'folder', label: 'Files' },
  { k: 'editor', icon: 'file', label: 'Editor' },
  { k: 'terminal', icon: 'terminal', label: 'Terminal' },
  { k: 'preview', icon: 'globe', label: 'Preview' },
];

/** Intermediate tablet layout: slim rail + single work pane + persistent AI panel. */
export function TabletIDE() {
  const { id } = useParams();
  const workspaceId = id ?? '';

  const [tab, setTab] = useState('editor');
  const files = useOpenFiles();

  const leftPane = {
    files: (
      <FileTree
        workspaceId={workspaceId}
        currentPath={files.active}
        onOpen={(p) => {
          files.open(p);
          setTab('editor');
        }}
      />
    ),
    editor: (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
        <EditorTabs
          tabs={files.tabs}
          active={files.active}
          onActivate={files.setActive}
          onClose={files.close}
        />
        <div style={{ flex: 1, minHeight: 0 }}>
          <WorkspaceFileEditor workspaceId={workspaceId} path={files.active} />
        </div>
      </div>
    ),
    terminal: <WorkspaceTerminal workspaceId={workspaceId} />,
    preview: <WorkspacePreview workspaceId={workspaceId} />,
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
              <StatusDot on live />
              <span style={{ fontSize: 11.5, color: 'var(--muted)' }}>running</span>
            </div>
          </div>
          <StatsChip workspaceId={workspaceId} />
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
      <AgentPanel workspaceId={workspaceId} defaultWidth={416} />
    </div>
  );
}
