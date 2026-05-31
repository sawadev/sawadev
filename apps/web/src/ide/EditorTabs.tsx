import { HIcon } from '../icons';

/** Barre d'onglets des fichiers ouverts. */
export function EditorTabs({
  tabs,
  active,
  onActivate,
  onClose,
}: {
  tabs: string[];
  active: string | null;
  onActivate: (path: string) => void;
  onClose: (path: string) => void;
}) {
  if (tabs.length === 0) return null;
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'stretch',
        height: 38,
        flexShrink: 0,
        background: 'var(--surface-2)',
        borderBottom: '1px solid var(--border)',
        overflowX: 'auto',
      }}
    >
      {tabs.map((path) => {
        const on = path === active;
        const name = path.split('/').pop() ?? path;
        return (
          <div
            key={path}
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
              title={path}
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
              <span className="mono" style={{ fontSize: 12, fontWeight: on ? 600 : 500 }}>
                {name}
              </span>
            </button>
            <button
              type="button"
              onClick={() => onClose(path)}
              aria-label={`Close ${name}`}
              style={{
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                padding: 2,
                display: 'flex',
                color: 'var(--faint)',
              }}
            >
              <HIcon name="x" size={12} color="currentColor" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
