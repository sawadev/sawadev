import { useEffect, useState } from 'react';
import { useFileContent, useSaveFile } from '../api/hooks';
import { HIcon } from '../icons';
import { CodeEditor } from './CodeEditor';

interface Props {
  workspaceId: string;
  path: string | null;
}

/** Charge un fichier, l'édite via CodeMirror et le sauvegarde (PUT). */
export function WorkspaceFileEditor({ workspaceId, path }: Props) {
  const { data, isLoading, isError } = useFileContent(workspaceId, path);
  const save = useSaveFile(workspaceId);
  const [draft, setDraft] = useState('');
  const [loadedPath, setLoadedPath] = useState<string | null>(null);

  // Réinitialise le brouillon à chaque nouveau contenu chargé.
  useEffect(() => {
    if (data && path) {
      setDraft(data.content);
      setLoadedPath(path);
    }
  }, [data, path]);

  if (!path) {
    return <Centered>Select a file in the tree to edit it.</Centered>;
  }
  if (isLoading || loadedPath !== path) return <Centered>Loading {path}…</Centered>;
  if (isError) return <Centered>Could not open {path}.</Centered>;

  const dirty = draft !== data?.content;
  const doSave = () => {
    if (dirty) save.mutate({ path, content: draft });
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '8px 12px',
          borderBottom: '1px solid var(--border-soft)',
          flexShrink: 0,
        }}
      >
        <HIcon name="file" size={14} color="var(--faint)" />
        <span
          className="mono"
          style={{ fontSize: 12.5, color: 'var(--text-2)', flex: 1, minWidth: 0 }}
        >
          {path}
          {dirty ? ' •' : ''}
        </span>
        <button
          type="button"
          className="btn btn-primary btn-sm"
          onClick={doSave}
          disabled={!dirty || save.isPending}
        >
          {save.isPending ? 'Saving…' : 'Save'}
        </button>
      </div>
      <div style={{ flex: 1, minHeight: 0 }}>
        <CodeEditor path={path} value={draft} onChange={setDraft} onSave={doSave} />
      </div>
    </div>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--faint)',
        fontSize: 13.5,
        padding: 20,
        textAlign: 'center',
      }}
    >
      {children}
    </div>
  );
}
