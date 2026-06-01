import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useStartWorkspace, useWorkspaces } from '../api/hooks';
import { FileTree } from '../editor/FileTree';
import { WorkspaceFileEditor } from '../editor/WorkspaceFileEditor';
import { HIcon } from '../icons';
import { EditorTabs } from '../ide/EditorTabs';
import { IdeStateProvider } from '../ide/IdeState';
import { PanelResizer } from '../ide/PanelResizer';
import { RightDock } from '../ide/RightDock';
import { StatsChip } from '../ide/StatsChip';
import { useIde } from '../ide/ide-context';
import { WorkspaceTerminal } from '../terminal/Terminal';
import { StatusDot } from '../ui';
import { DeskRail } from './DesktopShell';

const TERM_MIN = 90;
const TERM_HEIGHT_KEY = 'sawa.term.height';

function readTermHeight(fallback: number): number {
  const v = Number(localStorage.getItem(TERM_HEIGHT_KEY));
  return v >= TERM_MIN ? v : fallback;
}

const TREE_MIN = 170;
const TREE_MAX = 480;
const TREE_WIDTH_KEY = 'sawa.tree.width';

function readTreeWidth(fallback: number): number {
  const v = Number(localStorage.getItem(TREE_WIDTH_KEY));
  return v >= TREE_MIN && v <= TREE_MAX ? v : fallback;
}

/** Panneau terminal du bas, redimensionnable par glissement de son bord supérieur. */
function DTerm({ workspaceId }: { workspaceId: string }) {
  const [height, setHeight] = useState(() => {
    try {
      return readTermHeight(220);
    } catch {
      return 220;
    }
  });

  // Persiste la hauteur et refait le fit du terminal xterm (qui n'écoute que les
  // resize de fenêtre) à chaque changement de hauteur.
  useEffect(() => {
    try {
      localStorage.setItem(TERM_HEIGHT_KEY, String(height));
    } catch {
      // ignore
    }
    window.dispatchEvent(new Event('resize'));
  }, [height]);

  // Panneau ancré en bas : la hauteur = distance du curseur au bas de la fenêtre.
  const onResize = (clientY: number) => {
    const max = Math.max(TERM_MIN, window.innerHeight - 220);
    setHeight(Math.max(TERM_MIN, Math.min(max, window.innerHeight - clientY)));
  };

  return (
    <div
      style={{
        position: 'relative',
        height,
        flexShrink: 0,
        borderTop: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--term-bg)',
      }}
    >
      <PanelResizer side="top" onResize={onResize} ariaLabel="Resize terminal panel" />
      <div
        style={{
          height: 34,
          display: 'flex',
          alignItems: 'center',
          gap: 7,
          padding: '0 14px',
          borderBottom: '1px solid var(--border)',
          background: 'var(--surface)',
        }}
      >
        <HIcon name="terminal" size={12} color="var(--text-2)" />
        <span className="mono" style={{ fontSize: 11.5, color: 'var(--text)', fontWeight: 600 }}>
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
  return (
    <IdeStateProvider key={workspaceId} workspaceId={workspaceId}>
      <DesktopIDEBody workspaceId={workspaceId} />
    </IdeStateProvider>
  );
}

function DesktopIDEBody({ workspaceId }: { workspaceId: string }) {
  const files = useIde();
  const { data: workspaces = [] } = useWorkspaces();
  const status = workspaces.find((w) => w.id === workspaceId)?.status;
  const running = status === 'running';
  const start = useStartWorkspace();
  const treeRef = useRef<HTMLDivElement>(null);
  const [treeWidth, setTreeWidth] = useState(() => {
    try {
      return readTreeWidth(234);
    } catch {
      return 234;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(TREE_WIDTH_KEY, String(treeWidth));
    } catch {
      // ignore
    }
  }, [treeWidth]);

  // Explorateur ancré à gauche : largeur = X du curseur − bord gauche de la colonne.
  const onTreeResize = (clientX: number) => {
    const left = treeRef.current?.getBoundingClientRect().left ?? 0;
    setTreeWidth(Math.max(TREE_MIN, Math.min(TREE_MAX, clientX - left)));
  };

  return (
    <div style={{ height: '100%', display: 'flex', background: 'var(--bg)' }}>
      <DeskRail />
      {/* file tree */}
      <div
        ref={treeRef}
        style={{
          position: 'relative',
          width: treeWidth,
          flexShrink: 0,
          borderRight: '1px solid var(--border)',
          background: 'var(--surface-2)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <PanelResizer side="right" onResize={onTreeResize} ariaLabel="Resize file explorer" />
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
          <FileTree
            workspaceId={workspaceId}
            currentPath={files.active}
            onOpen={(p, persistent) => (persistent ? files.openPersistent(p) : files.open(p))}
          />
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
            <StatusDot on={running} live={running} />
            <span style={{ fontSize: 12.5, color: 'var(--muted)', fontWeight: 600 }}>
              {status ?? '…'}
            </span>
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
          <div style={{ flex: 1 }} />
        </div>
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
        <DTerm workspaceId={workspaceId} />
      </div>
      {/* AI panel — redimensionnable + repliable */}
      <RightDock workspaceId={workspaceId} />
    </div>
  );
}
