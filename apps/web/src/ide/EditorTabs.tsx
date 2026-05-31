import { useRef, useState } from 'react';
import { HIcon } from '../icons';

/** Barre d'onglets des fichiers ouverts. */
export function EditorTabs({
  tabs,
  active,
  dirty = [],
  preview = null,
  onActivate,
  onClose,
  onPromote,
}: {
  tabs: string[];
  active: string | null;
  /** Chemins ayant des modifications non sauvegardées (point rouge). */
  dirty?: string[];
  /** Onglet temporaire (aperçu) : nom en italique. */
  preview?: string | null;
  onActivate: (path: string) => void;
  onClose: (path: string) => void;
  /** Double-clic sur un onglet temporaire → l'épingle. */
  onPromote?: (path: string) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Molette souris (deltaY vertical) → défilement horizontal des onglets.
  // Le tactile et le trackpad horizontal fonctionnent déjà via overflow-x.
  const onWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    const el = scrollRef.current;
    if (!el || el.scrollWidth <= el.clientWidth) return;
    const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    if (delta !== 0) el.scrollLeft += delta;
  };

  if (tabs.length === 0) return null;
  return (
    <div
      ref={scrollRef}
      onWheel={onWheel}
      style={{
        display: 'flex',
        alignItems: 'stretch',
        height: 38,
        flexShrink: 0,
        background: 'var(--surface-2)',
        borderBottom: '1px solid var(--border)',
        overflowX: 'auto',
        overflowY: 'hidden',
        overscrollBehaviorX: 'contain',
      }}
    >
      {tabs.map((path) => (
        <Tab
          key={path}
          path={path}
          on={path === active}
          dirty={dirty.includes(path)}
          preview={path === preview}
          onActivate={onActivate}
          onClose={onClose}
          onPromote={onPromote}
        />
      ))}
    </div>
  );
}

function Tab({
  path,
  on,
  dirty,
  preview,
  onActivate,
  onClose,
  onPromote,
}: {
  path: string;
  on: boolean;
  dirty: boolean;
  preview: boolean;
  onActivate: (path: string) => void;
  onClose: (path: string) => void;
  onPromote?: (path: string) => void;
}) {
  const [hover, setHover] = useState(false);
  const name = path.split('/').pop() ?? path;
  // Onglet modifié : point rouge tant qu'on ne survole pas la zone de fermeture.
  const showDot = dirty && !hover;
  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 7,
        padding: '0 8px 0 14px',
        background: on ? 'var(--surface)' : 'transparent',
        borderRight: '1px solid var(--border)',
        borderTop: on ? '2px solid var(--accent)' : '2px solid transparent',
        whiteSpace: 'nowrap',
      }}
    >
      <button
        type="button"
        onClick={() => onActivate(path)}
        onDoubleClick={() => onPromote?.(path)}
        title={preview ? `${path} (preview — double-click to keep open)` : path}
        style={{
          border: 'none',
          background: 'transparent',
          cursor: 'pointer',
          font: 'inherit',
          display: 'flex',
          alignItems: 'center',
          gap: 7,
          color: on ? 'var(--text)' : 'var(--muted)',
        }}
      >
        <HIcon name="file" size={12} color={on ? 'var(--accent-text)' : 'var(--faint)'} />
        <span
          className="mono"
          style={{
            fontSize: 12,
            fontWeight: on ? 600 : 500,
            fontStyle: preview ? 'italic' : 'normal',
          }}
        >
          {name}
        </span>
      </button>
      <button
        type="button"
        onClick={() => onClose(path)}
        aria-label={showDot ? `${name} has unsaved changes` : `Close ${name}`}
        title={showDot ? 'Unsaved changes' : `Close ${name}`}
        style={{
          border: 'none',
          background: 'transparent',
          cursor: 'pointer',
          padding: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 16,
          height: 16,
          color: 'var(--faint)',
        }}
      >
        {showDot ? (
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: 'var(--danger, #e5484d)',
            }}
          />
        ) : (
          <HIcon name="x" size={12} color="currentColor" />
        )}
      </button>
    </div>
  );
}
