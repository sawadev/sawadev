import { useState } from 'react';
import { rawFileUrl } from '../api/files';

/** Affiche une image (ou un SVG en aperçu) servie par la route raw du workspace. */
export function ImageViewer({ workspaceId, path }: { workspaceId: string; path: string }) {
  const [dims, setDims] = useState<{ w: number; h: number } | null>(null);
  const [error, setError] = useState(false);
  const name = path.split('/').pop() ?? path;

  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        padding: 20,
        minHeight: 0,
        // Damier léger pour distinguer la transparence des images.
        backgroundColor: 'var(--surface-2)',
        backgroundImage:
          'linear-gradient(45deg, var(--hover) 25%, transparent 25%), linear-gradient(-45deg, var(--hover) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, var(--hover) 75%), linear-gradient(-45deg, transparent 75%, var(--hover) 75%)',
        backgroundSize: '20px 20px',
        backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0',
      }}
    >
      {error ? (
        <div style={{ color: 'var(--faint)', fontSize: 13.5, textAlign: 'center' }}>
          Could not load image {name}.
        </div>
      ) : (
        <>
          <img
            src={rawFileUrl(workspaceId, path)}
            alt={name}
            onLoad={(e) =>
              setDims({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })
            }
            onError={() => setError(true)}
            style={{
              maxWidth: '100%',
              maxHeight: '100%',
              objectFit: 'contain',
              borderRadius: 6,
              boxShadow: 'var(--shadow-md)',
            }}
          />
          <div className="mono" style={{ fontSize: 11.5, color: 'var(--muted)' }}>
            {name}
            {dims ? ` · ${dims.w}×${dims.h}` : ''}
          </div>
        </>
      )}
    </div>
  );
}
