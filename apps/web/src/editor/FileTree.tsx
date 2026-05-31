import type { FileNode } from '@sawadev/shared';
import { useState } from 'react';
import { useFileTreeActions, useFiles } from '../api/hooks';
import { HIcon } from '../icons';

interface TreeProps {
  workspaceId: string;
  currentPath: string | null;
  onOpen: (path: string) => void;
}

interface RowActions {
  onRename: (path: string) => void;
  onDelete: (path: string) => void;
}

/** Arbre de fichiers paresseux + actions (créer / renommer / supprimer). */
export function FileTree({ workspaceId, currentPath, onOpen }: TreeProps) {
  const { newFile, newDir, rename, remove } = useFileTreeActions(workspaceId);

  const actions: RowActions = {
    onRename: (path) => {
      const to = window.prompt('Rename / move to (path):', path);
      if (to && to !== path) rename.mutate({ from: path, to });
    },
    onDelete: (path) => {
      if (window.confirm(`Delete ${path}?`)) remove.mutate(path);
    },
  };

  const createFile = () => {
    const path = window.prompt('New file path (e.g. src/index.ts):');
    if (path?.trim()) newFile.mutate(path.trim());
  };
  const createDir = () => {
    const path = window.prompt('New folder path (e.g. src/lib):');
    if (path?.trim()) newDir.mutate(path.trim());
  };

  return (
    <div style={{ fontSize: 13.5, display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          padding: '6px 8px',
          borderBottom: '1px solid var(--border-soft)',
        }}
      >
        <span
          style={{
            flex: 1,
            fontSize: 11.5,
            fontWeight: 700,
            color: 'var(--muted)',
            paddingLeft: 4,
          }}
        >
          FILES
        </span>
        <button
          type="button"
          className="btn btn-ghost btn-icon btn-sm"
          title="New file"
          onClick={createFile}
        >
          <HIcon name="file" size={14} color="var(--text-2)" />
        </button>
        <button
          type="button"
          className="btn btn-ghost btn-icon btn-sm"
          title="New folder"
          onClick={createDir}
        >
          <HIcon name="folder" size={14} color="var(--text-2)" />
        </button>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 0' }}>
        <DirContents
          workspaceId={workspaceId}
          path="/"
          depth={0}
          currentPath={currentPath}
          onOpen={onOpen}
          actions={actions}
        />
      </div>
    </div>
  );
}

interface DirProps {
  workspaceId: string;
  path: string;
  depth: number;
  currentPath: string | null;
  onOpen: (path: string) => void;
  actions: RowActions;
}

function DirContents({ workspaceId, path, depth, currentPath, onOpen, actions }: DirProps) {
  const { data: nodes, isLoading } = useFiles(workspaceId, path);
  if (isLoading) return <Row depth={depth} label="Loading…" muted />;
  if (!nodes?.length) return depth === 0 ? <Row depth={depth} label="Empty" muted /> : null;
  return (
    <>
      {nodes.map((n) =>
        n.type === 'dir' ? (
          <DirNode
            key={n.path}
            node={n}
            workspaceId={workspaceId}
            depth={depth}
            currentPath={currentPath}
            onOpen={onOpen}
            actions={actions}
          />
        ) : (
          <Row
            key={n.path}
            depth={depth}
            icon="file"
            label={n.name}
            active={n.path === currentPath}
            onClick={() => onOpen(n.path)}
            onRename={() => actions.onRename(n.path)}
            onDelete={() => actions.onDelete(n.path)}
          />
        ),
      )}
    </>
  );
}

function DirNode({
  node,
  workspaceId,
  depth,
  currentPath,
  onOpen,
  actions,
}: { node: FileNode } & Omit<DirProps, 'path'>) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Row
        depth={depth}
        icon="folder"
        label={node.name}
        onClick={() => setOpen((o) => !o)}
        chevron={open ? 'chevD' : 'chevR'}
        onRename={() => actions.onRename(node.path)}
        onDelete={() => actions.onDelete(node.path)}
      />
      {open && (
        <DirContents
          workspaceId={workspaceId}
          path={node.path}
          depth={depth + 1}
          currentPath={currentPath}
          onOpen={onOpen}
          actions={actions}
        />
      )}
    </>
  );
}

function Row({
  depth,
  label,
  icon,
  chevron,
  active,
  muted,
  onClick,
  onRename,
  onDelete,
}: {
  depth: number;
  label: string;
  icon?: string;
  chevron?: string;
  active?: boolean;
  muted?: boolean;
  onClick?: () => void;
  onRename?: () => void;
  onDelete?: () => void;
}) {
  return (
    <div
      className="ft-row"
      style={{
        display: 'flex',
        alignItems: 'center',
        background: active ? 'var(--accent-soft)' : 'transparent',
      }}
    >
      <button
        type="button"
        onClick={onClick}
        onDoubleClick={onRename}
        disabled={!onClick}
        title={onRename ? 'Double-click to rename' : undefined}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          flex: 1,
          minWidth: 0,
          border: 'none',
          background: 'transparent',
          color: muted ? 'var(--faint)' : active ? 'var(--accent-text)' : 'var(--text-2)',
          padding: '5px 4px 5px 10px',
          paddingLeft: 10 + depth * 14,
          cursor: onClick ? 'pointer' : 'default',
          textAlign: 'left',
          font: 'inherit',
        }}
      >
        {chevron ? (
          <HIcon name={chevron} size={12} color="var(--faint)" />
        ) : (
          <span style={{ width: 12 }} />
        )}
        {icon && <HIcon name={icon} size={14} color="currentColor" />}
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {label}
        </span>
      </button>
      {onDelete && (
        <button
          type="button"
          className="ft-del"
          onClick={onDelete}
          title="Delete"
          style={{
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            padding: '0 10px',
            color: 'var(--faint)',
          }}
        >
          <HIcon name="trash" size={13} color="currentColor" />
        </button>
      )}
    </div>
  );
}
