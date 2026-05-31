import { useEffect, useState } from 'react';
import { rawFileUrl } from '../api/files';
import { useFileContent, useSaveFile } from '../api/hooks';
import { HIcon } from '../icons';
import { useIde } from '../ide/ide-context';
import { CodeEditor } from './CodeEditor';
import { ImageViewer } from './ImageViewer';
import { fileKind } from './file-kind';

interface Props {
  workspaceId: string;
  path: string | null;
  /** Notifie le système d'onglets qu'un fichier a (ou non) des modifications non sauvegardées. */
  onDirtyChange?: (path: string, dirty: boolean) => void;
}

/** Aiguille selon le type de fichier : éditeur texte, image, aperçu/édition SVG, ou repli binaire. */
export function WorkspaceFileEditor({ workspaceId, path, onDirtyChange }: Props) {
  const kind = path ? fileKind(path) : 'text';
  const needsText = kind === 'text' || kind === 'svg';

  const ide = useIde();
  const { data, isLoading, isError } = useFileContent(workspaceId, needsText ? path : null);
  const save = useSaveFile(workspaceId);
  const [draft, setDraft] = useState('');
  const [loadedPath, setLoadedPath] = useState<string | null>(null);
  const [svgMode, setSvgMode] = useState<'preview' | 'edit'>('preview');

  // Réinitialise le brouillon à chaque nouveau contenu chargé.
  useEffect(() => {
    if (data && path) {
      setDraft(data.content);
      setLoadedPath(path);
    }
  }, [data, path]);

  // Un SVG s'ouvre toujours en aperçu : on remet le mode à chaque changement de fichier.
  // biome-ignore lint/correctness/useExhaustiveDependencies: reset volontaire sur `path`
  useEffect(() => {
    setSvgMode('preview');
  }, [path]);

  const ready = !needsText || (!isLoading && loadedPath === path && !isError);
  const dirty = needsText && ready && draft !== data?.content;

  // Remonte l'état « modifié » au système d'onglets (point rouge sur l'onglet).
  useEffect(() => {
    if (path) onDirtyChange?.(path, dirty);
  }, [path, dirty, onDirtyChange]);

  if (!path) {
    return <Centered>Select a file in the tree to edit it.</Centered>;
  }

  const doSave = () => {
    if (dirty) save.mutate({ path, content: draft });
  };

  // Image : visionneuse seule.
  if (kind === 'image') {
    return <ImageViewer workspaceId={workspaceId} path={path} />;
  }

  // Binaire non prévisualisable : repli + lien vers les octets bruts.
  if (kind === 'binary') {
    const name = path.split('/').pop() ?? path;
    return (
      <Centered>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
          <HIcon name="file" size={28} color="var(--faint)" />
          <div>No preview available for {name}.</div>
          <a
            className="btn btn-soft btn-sm"
            href={rawFileUrl(workspaceId, path)}
            target="_blank"
            rel="noreferrer"
          >
            <HIcon name="external" size={14} color="currentColor" />
            Open raw
          </a>
        </div>
      </Centered>
    );
  }

  // SVG en aperçu : rendu image + bascule vers l'édition.
  if (kind === 'svg' && svgMode === 'preview') {
    return (
      <div style={{ position: 'relative', height: '100%', minHeight: 0 }}>
        <ImageViewer workspaceId={workspaceId} path={path} />
        <div style={{ position: 'absolute', top: 10, right: 14, zIndex: 4 }}>
          <ViewToggle icon="file" label="Edit" onClick={() => setSvgMode('edit')} />
        </div>
      </div>
    );
  }

  // Texte (et SVG en édition) : chargement / erreur / éditeur.
  if (isLoading || loadedPath !== path) return <Centered>Loading {path}…</Centered>;
  if (isError) return <Centered>Could not open {path}.</Centered>;

  return (
    <div style={{ position: 'relative', height: '100%', minHeight: 0 }}>
      <CodeEditor
        path={path}
        value={draft}
        onChange={setDraft}
        onSave={doSave}
        viewState={ide.getView(path)}
        onViewState={ide.setView}
      />
      <div style={{ position: 'absolute', top: 10, right: 14, zIndex: 4, display: 'flex', gap: 8 }}>
        {kind === 'svg' && (
          <ViewToggle icon="eye" label="Preview" onClick={() => setSvgMode('preview')} />
        )}
        {dirty && (
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={doSave}
            disabled={save.isPending}
          >
            {save.isPending ? 'Saving…' : 'Save'}
          </button>
        )}
      </div>
    </div>
  );
}

/** Bouton de bascule aperçu/édition (style aligné sur le bouton Save). */
function ViewToggle({
  icon,
  label,
  onClick,
}: {
  icon: string;
  label: string;
  onClick: () => void;
}) {
  return (
    <button type="button" className="btn btn-soft btn-sm" onClick={onClick}>
      <HIcon name={icon} size={14} color="currentColor" />
      {label}
    </button>
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
