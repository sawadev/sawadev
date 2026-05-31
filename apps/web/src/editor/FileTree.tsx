import type { FileNode } from '@sawadev/shared';
import { useState } from 'react';
import { useFiles } from '../api/hooks';
import { HIcon } from '../icons';

interface TreeProps {
  workspaceId: string;
  currentPath: string | null;
  onOpen: (path: string) => void;
}

/** Arbre de fichiers paresseux : chaque dossier charge ses enfants à l'ouverture. */
export function FileTree({ workspaceId, currentPath, onOpen }: TreeProps) {
  return (
    <div style={{ fontSize: 13.5, padding: '4px 0' }}>
      <DirContents
        workspaceId={workspaceId}
        path="/"
        depth={0}
        currentPath={currentPath}
        onOpen={onOpen}
      />
    </div>
  );
}

interface DirProps {
  workspaceId: string;
  path: string;
  depth: number;
  currentPath: string | null;
  onOpen: (path: string) => void;
}

function DirContents({ workspaceId, path, depth, currentPath, onOpen }: DirProps) {
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
          />
        ) : (
          <Row
            key={n.path}
            depth={depth}
            icon="file"
            label={n.name}
            active={n.path === currentPath}
            onClick={() => onOpen(n.path)}
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
      />
      {open && (
        <DirContents
          workspaceId={workspaceId}
          path={node.path}
          depth={depth + 1}
          currentPath={currentPath}
          onOpen={onOpen}
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
}: {
  depth: number;
  label: string;
  icon?: string;
  chevron?: string;
  active?: boolean;
  muted?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        width: '100%',
        border: 'none',
        background: active ? 'var(--accent-soft)' : 'transparent',
        color: muted ? 'var(--faint)' : active ? 'var(--accent-text)' : 'var(--text-2)',
        padding: '5px 10px',
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
  );
}
