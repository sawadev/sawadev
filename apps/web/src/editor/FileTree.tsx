import type { FileNode } from '@sawadev/shared';
import { useQueryClient } from '@tanstack/react-query';
import {
  ChevronDown,
  ChevronRight,
  Copy,
  File as FileIcon,
  FilePlus,
  FileText,
  Folder as FolderIcon,
  FolderOpen,
  FolderPlus,
  MoreVertical,
  Pencil,
  Plus,
  Trash2,
  Upload,
} from 'lucide-react';
import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { uploadFile } from '../api/files';
import { useFileTreeActions, useFiles } from '../api/hooks';
import { useIde } from '../ide/ide-context';
import { Menu, type MenuItem } from '../ui/Menu';
import { useFileWatch } from './useFileWatch';

interface TreeProps {
  workspaceId: string;
  currentPath: string | null;
  /** `persistent` = ouverture épinglée (double-clic) ; sinon aperçu temporaire (clic simple). */
  onOpen: (path: string, persistent?: boolean) => void;
}

type NodeType = 'file' | 'dir';
interface Selected {
  path: string;
  type: NodeType;
}
type Editing = { kind: 'rename'; path: string } | { kind: 'create'; dir: string; type: NodeType };

const ICON = 15;
const parentDir = (p: string) => (p.includes('/') ? p.slice(0, p.lastIndexOf('/')) : '');
const join = (dir: string, name: string) => (dir ? `${dir}/${name}` : name);

/** Nom de copie libre : « base copy.ext », puis « base copy 2.ext »… */
function copyName(name: string, existing: Set<string>): string {
  const dot = name.lastIndexOf('.');
  const stem = dot > 0 ? name.slice(0, dot) : name;
  const ext = dot > 0 ? name.slice(dot) : '';
  let candidate = `${stem} copy${ext}`;
  let n = 2;
  while (existing.has(candidate)) candidate = `${stem} copy ${n++}${ext}`;
  return candidate;
}

/** Le drag transporte-t-il des fichiers de l'OS (import) plutôt qu'un nœud de l'arbre ? */
const isFileDrag = (e: React.DragEvent) => Array.from(e.dataTransfer.types).includes('Files');

/** Aplati récursivement une entrée déposée (fichier ou dossier) en { chemin relatif, fichier }. */
function collectEntries(
  entry: FileSystemEntry,
  prefix: string,
): Promise<{ path: string; file: File }[]> {
  if (entry.isFile) {
    return new Promise((resolve, reject) =>
      (entry as FileSystemFileEntry).file(
        (file) => resolve([{ path: prefix + entry.name, file }]),
        reject,
      ),
    );
  }
  if (entry.isDirectory) {
    const reader = (entry as FileSystemDirectoryEntry).createReader();
    return new Promise((resolve, reject) => {
      const out: { path: string; file: File }[] = [];
      const readBatch = () =>
        reader.readEntries(async (batch) => {
          if (!batch.length) return resolve(out);
          for (const e of batch) out.push(...(await collectEntries(e, `${prefix}${entry.name}/`)));
          readBatch();
        }, reject);
      readBatch();
    });
  }
  return Promise.resolve([]);
}

interface Ctx {
  workspaceId: string;
  currentPath: string | null;
  selected: Selected | null;
  expanded: string[];
  editing: Editing | null;
  dropDir: string | null;
  dragRef: React.MutableRefObject<{ path: string; name: string; type: NodeType } | null>;
  onOpen: (p: string, persistent?: boolean) => void;
  select: (s: Selected) => void;
  toggle: (dir: string) => void;
  openContext: (e: React.MouseEvent, target: Selected | 'root') => void;
  commit: (name: string) => void;
  cancel: () => void;
  setDropDir: (d: string | null) => void;
  move: (destDir: string) => void;
  upload: (destDir: string, dt: DataTransfer) => void;
}
const TreeCtx = createContext<Ctx | null>(null);
function useTree(): Ctx {
  const c = useContext(TreeCtx);
  if (!c) throw new Error('FileTree context missing');
  return c;
}

/** Arbre de fichiers : création (dropdown), clic-droit, focus, renommage inline, drag & drop. */
export function FileTree({ workspaceId, currentPath, onOpen }: TreeProps) {
  // Dossiers dépliés + sélection viennent du contexte persistant du workspace.
  const { expanded, toggleExpand: toggle, expand, selected, setSelected } = useIde();
  const { newFile, newDir, rename, duplicate, remove } = useFileTreeActions(workspaceId);
  const qc = useQueryClient();

  // Réactivité : surveille la racine + les dossiers dépliés côté serveur.
  const watchDirs = useMemo(() => ['', ...expanded], [expanded]);
  useFileWatch(workspaceId, watchDirs);
  const [editing, setEditing] = useState<Editing | null>(null);
  const [dropDir, setDropDir] = useState<string | null>(null);
  const [menu, setMenu] = useState<{ x: number; y: number; items: MenuItem[] } | null>(null);
  const dragRef = useRef<{ path: string; name: string; type: NodeType } | null>(null);

  const startCreate = (dir: string, type: NodeType) => {
    if (dir) expand(dir);
    setEditing({ kind: 'create', dir, type });
  };
  const cancel = () => setEditing(null);
  const commit = (name: string) => {
    const n = name.trim();
    const e = editing;
    setEditing(null);
    if (!n || !e) return;
    if (e.kind === 'create') {
      const to = join(e.dir, n);
      if (e.type === 'file') newFile.mutate(to);
      else newDir.mutate(to);
    } else {
      const to = join(parentDir(e.path), n);
      if (to !== e.path) rename.mutate({ from: e.path, to });
    }
  };
  const del = (path: string) => {
    if (window.confirm(`Delete ${path}?`)) remove.mutate(path);
  };
  const dup = (path: string) => {
    const dir = parentDir(path);
    const name = path.split('/').pop() ?? path;
    const nodes = qc.getQueryData<FileNode[]>(['files', workspaceId, dir || '/']) ?? [];
    duplicate.mutate({
      from: path,
      to: join(dir, copyName(name, new Set(nodes.map((n) => n.name)))),
    });
    if (dir) expand(dir);
  };

  const createTargetDir = () =>
    !selected ? '' : selected.type === 'dir' ? selected.path : parentDir(selected.path);

  const move = (destDir: string) => {
    const src = dragRef.current;
    dragRef.current = null;
    setDropDir(null);
    if (!src) return;
    // dossier déposé dans lui-même ou un descendant → refusé
    if (src.type === 'dir' && (destDir === src.path || destDir.startsWith(`${src.path}/`))) return;
    if (destDir === parentDir(src.path)) return; // même parent → no-op
    const to = join(destDir, src.name);
    if (to === src.path) return;
    rename.mutate({ from: src.path, to });
    if (destDir) expand(destDir);
  };

  // Téléverse une liste de { chemin relatif, fichier } dans `destDir`.
  const runUpload = async (destDir: string, entries: { path: string; file: File }[]) => {
    if (!entries.length) return;
    if (destDir) expand(destDir);
    for (const { path, file } of entries) {
      await uploadFile(workspaceId, join(destDir, path), file).catch(() => undefined);
    }
    qc.invalidateQueries({ queryKey: ['files', workspaceId] });
  };

  // Import depuis l'OS (drag & drop de fichiers/dossiers). On capture les entrées
  // SYNCHRONEMENT (webkitGetAsEntry n'est valide que pendant l'événement), puis on
  // traverse et téléverse en arrière-plan.
  const upload = (destDir: string, dt: DataTransfer) => {
    setDropDir(null);
    const roots = Array.from(dt.items)
      .map((it) => (it.kind === 'file' ? it.webkitGetAsEntry() : null))
      .filter((x): x is FileSystemEntry => x !== null);
    const flat = Array.from(dt.files);
    void (async () => {
      let entries: { path: string; file: File }[] = [];
      if (roots.length) {
        for (const r of roots) entries.push(...(await collectEntries(r, '')));
      } else {
        entries = flat.map((f) => ({ path: f.name, file: f }));
      }
      await runUpload(destDir, entries);
    })();
  };

  // Import via sélecteur de fichiers natif (entrée « Import… » des menus).
  const importDir = useRef('');
  const fileInput = useRef<HTMLInputElement>(null);
  const triggerImport = (dir: string) => {
    importDir.current = dir;
    fileInput.current?.click();
  };
  const onPickFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    const entries = files.map((f) => ({ path: f.webkitRelativePath || f.name, file: f }));
    void runUpload(importDir.current, entries);
    e.target.value = ''; // permet de ré-importer le même fichier
  };

  const newItems = (dir: string): MenuItem[] => [
    { label: 'New file', icon: <FilePlus size={14} />, onClick: () => startCreate(dir, 'file') },
    { label: 'New folder', icon: <FolderPlus size={14} />, onClick: () => startCreate(dir, 'dir') },
    { label: 'Import…', icon: <Upload size={14} />, onClick: () => triggerImport(dir) },
  ];
  const itemsFor = (target: Selected | 'root'): MenuItem[] => {
    if (target === 'root') return newItems('');
    if (target.type === 'dir')
      return [
        ...newItems(target.path),
        {
          label: 'Rename',
          icon: <Pencil size={14} />,
          onClick: () => setEditing({ kind: 'rename', path: target.path }),
        },
        { label: 'Duplicate', icon: <Copy size={14} />, onClick: () => dup(target.path) },
        {
          label: 'Delete',
          icon: <Trash2 size={14} />,
          danger: true,
          onClick: () => del(target.path),
        },
      ];
    return [
      { label: 'Open', icon: <FileText size={14} />, onClick: () => onOpen(target.path, true) },
      {
        label: 'Rename',
        icon: <Pencil size={14} />,
        onClick: () => setEditing({ kind: 'rename', path: target.path }),
      },
      { label: 'Duplicate', icon: <Copy size={14} />, onClick: () => dup(target.path) },
      {
        label: 'Delete',
        icon: <Trash2 size={14} />,
        danger: true,
        onClick: () => del(target.path),
      },
    ];
  };

  const openContext = (e: React.MouseEvent, target: Selected | 'root') => {
    e.preventDefault();
    e.stopPropagation();
    if (target !== 'root') setSelected(target);
    setMenu({ x: e.clientX, y: e.clientY, items: itemsFor(target) });
  };
  const openNew = (e: React.MouseEvent) => {
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setMenu({ x: r.left, y: r.bottom + 4, items: newItems(createTargetDir()) });
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (editing || !selected) return;
    if (e.key === 'F2') {
      e.preventDefault();
      setEditing({ kind: 'rename', path: selected.path });
    } else if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault();
      del(selected.path);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selected.type === 'file') onOpen(selected.path);
      else toggle(selected.path);
    }
  };

  const ctx: Ctx = {
    workspaceId,
    currentPath,
    selected,
    expanded,
    editing,
    dropDir,
    dragRef,
    onOpen,
    select: setSelected,
    toggle,
    openContext,
    commit,
    cancel,
    setDropDir,
    move,
    upload,
  };

  return (
    <TreeCtx.Provider value={ctx}>
      <input
        ref={fileInput}
        type="file"
        multiple
        onChange={onPickFiles}
        style={{ display: 'none' }}
      />
      <div style={{ fontSize: 13.5, display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div className="ft-toolbar">
          <span className="ft-title">FILES</span>
          <button
            type="button"
            className="btn btn-ghost btn-icon btn-sm"
            title="New…"
            onClick={openNew}
          >
            <Plus size={16} />
          </button>
        </div>
        <div
          className="ft-scroll"
          tabIndex={-1}
          data-drop={dropDir === '' ? '' : undefined}
          onKeyDown={onKeyDown}
          onClick={() => setSelected(null)}
          onContextMenu={(e) => openContext(e, 'root')}
          onDragOver={(e) => {
            if (dragRef.current || isFileDrag(e)) {
              e.preventDefault();
              setDropDir('');
            }
          }}
          onDrop={(e) => {
            e.preventDefault();
            if (isFileDrag(e)) upload('', e.dataTransfer);
            else move('');
          }}
        >
          <DirContents dir="" depth={0} />
        </div>
      </div>
      {menu && (
        <Menu anchor={{ x: menu.x, y: menu.y }} items={menu.items} onClose={() => setMenu(null)} />
      )}
    </TreeCtx.Provider>
  );
}

function DirContents({ dir, depth }: { dir: string; depth: number }) {
  const { workspaceId, editing } = useTree();
  const { data: nodes, isLoading } = useFiles(workspaceId, dir || '/');
  const showCreate = editing?.kind === 'create' && editing.dir === dir;
  if (isLoading)
    return (
      <div className="ft-muted" style={{ paddingLeft: 12 + depth * 14 }}>
        Loading…
      </div>
    );
  return (
    <>
      {showCreate && <CreateRow depth={depth} type={editing.type} />}
      {nodes?.length ? (
        nodes.map((n) =>
          n.type === 'dir' ? (
            <DirNode key={n.path} node={n} depth={depth} />
          ) : (
            <Row key={n.path} node={n} type="file" depth={depth} />
          ),
        )
      ) : !showCreate && depth === 0 ? (
        <div className="ft-muted" style={{ paddingLeft: 14 }}>
          Empty
        </div>
      ) : null}
    </>
  );
}

function DirNode({ node, depth }: { node: FileNode; depth: number }) {
  const { expanded } = useTree();
  const open = expanded.includes(node.path);
  return (
    <>
      <Row node={node} type="dir" depth={depth} open={open} />
      {open && <DirContents dir={node.path} depth={depth + 1} />}
    </>
  );
}

function Row({
  node,
  type,
  depth,
  open,
}: {
  node: FileNode;
  type: NodeType;
  depth: number;
  open?: boolean;
}) {
  const t = useTree();
  const renaming = t.editing?.kind === 'rename' && t.editing.path === node.path;
  const sel = t.selected?.path === node.path;
  const active = type === 'file' && t.currentPath === node.path;
  const destDir = type === 'dir' ? node.path : parentDir(node.path);
  const isDrop = t.dropDir === destDir && t.dragRef.current?.path !== node.path;

  const onMain = () => {
    t.select({ path: node.path, type });
    if (type === 'file') t.onOpen(node.path);
    else t.toggle(node.path);
  };

  return (
    <div
      className="ft-row"
      data-selected={sel ? '' : undefined}
      data-active={active ? '' : undefined}
      data-drop={isDrop ? '' : undefined}
      style={{ paddingLeft: 6 + depth * 14 }}
      draggable={!renaming}
      onDragStart={(e) => {
        t.dragRef.current = { path: node.path, name: node.name, type };
        e.dataTransfer.effectAllowed = 'move';
      }}
      onDragEnd={() => {
        t.dragRef.current = null;
        t.setDropDir(null);
      }}
      onDragOver={(e) => {
        if (t.dragRef.current || isFileDrag(e)) {
          e.preventDefault();
          e.stopPropagation();
          t.setDropDir(destDir);
        }
      }}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (isFileDrag(e)) t.upload(destDir, e.dataTransfer);
        else t.move(destDir);
      }}
      onContextMenu={(e) => t.openContext(e, { path: node.path, type })}
    >
      <button
        type="button"
        className="ft-main"
        onClick={(e) => {
          e.stopPropagation();
          onMain();
        }}
        onDoubleClick={(e) => {
          e.stopPropagation();
          if (type === 'file') t.onOpen(node.path, true); // épingle l'onglet
        }}
      >
        {type === 'dir' ? (
          open ? (
            <ChevronDown size={13} className="ft-chev" />
          ) : (
            <ChevronRight size={13} className="ft-chev" />
          )
        ) : (
          <span className="ft-chev-spacer" />
        )}
        {type === 'dir' ? (
          open ? (
            <FolderOpen size={ICON} />
          ) : (
            <FolderIcon size={ICON} />
          )
        ) : (
          <FileIcon size={ICON} />
        )}
        {renaming ? (
          <InlineInput initial={node.name} onCommit={t.commit} onCancel={t.cancel} />
        ) : (
          <span className="ft-label">{node.name}</span>
        )}
      </button>
      {!renaming && (
        <button
          type="button"
          className="ft-actions"
          title="More…"
          onClick={(e) => {
            e.stopPropagation();
            t.openContext(e, { path: node.path, type });
          }}
        >
          <MoreVertical size={14} />
        </button>
      )}
    </div>
  );
}

function CreateRow({ depth, type }: { depth: number; type: NodeType }) {
  const t = useTree();
  return (
    <div className="ft-row" style={{ paddingLeft: 6 + depth * 14 }}>
      <div className="ft-main" style={{ cursor: 'default' }}>
        <span className="ft-chev-spacer" />
        {type === 'dir' ? <FolderIcon size={ICON} /> : <FileIcon size={ICON} />}
        <InlineInput initial="" onCommit={t.commit} onCancel={t.cancel} />
      </div>
    </div>
  );
}

function InlineInput({
  initial,
  onCommit,
  onCancel,
}: {
  initial: string;
  onCommit: (v: string) => void;
  onCancel: () => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const done = useRef(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.focus();
    const dot = initial.lastIndexOf('.');
    el.setSelectionRange(0, dot > 0 ? dot : initial.length);
  }, [initial]);
  const finish = (save: boolean, val: string) => {
    if (done.current) return;
    done.current = true;
    if (save) onCommit(val);
    else onCancel();
  };
  return (
    <input
      ref={ref}
      className="ft-input"
      defaultValue={initial}
      spellCheck={false}
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => {
        e.stopPropagation();
        if (e.key === 'Enter') finish(true, e.currentTarget.value);
        else if (e.key === 'Escape') finish(false, '');
      }}
      onBlur={(e) => finish(true, e.currentTarget.value)}
    />
  );
}
