import { useEffect, useState } from 'react';
import { HIcon } from '../icons';
import { WorkspacePreview } from '../preview/WorkspacePreview';
import { WorkspaceTerminal } from '../terminal/Terminal';
import { PanelResizer } from './PanelResizer';

const MIN_W = 300;
const MAX_W = 760;
const RAIL_W = 46;
const WIDTH_KEY = 'sawa.dock.width';
const COLLAPSED_KEY = 'sawa.dock.collapsed';
const MODULE_KEY = 'sawa.dock.module';

type ModuleKey = 'agent' | 'preview' | 'git' | 'service' | 'actions';
const MODULES: { key: ModuleKey; label: string; icon: string }[] = [
  { key: 'agent', label: 'AI Agent', icon: 'sparkle' },
  { key: 'preview', label: 'Preview', icon: 'globe' },
  { key: 'git', label: 'Git', icon: 'branch' },
  { key: 'service', label: 'Service', icon: 'layers' },
  { key: 'actions', label: 'Quick Actions', icon: 'bolt' },
];

function readWidth(fallback: number): number {
  const v = Number(localStorage.getItem(WIDTH_KEY));
  return v >= MIN_W && v <= MAX_W ? v : fallback;
}
function readModule(): ModuleKey {
  const v = localStorage.getItem(MODULE_KEY) as ModuleKey | null;
  return v && MODULES.some((m) => m.key === v) ? v : 'agent';
}

/**
 * Dock de droite (desktop & tablette) hébergeant plusieurs modules :
 * AI Agent, Git, Service, Quick Actions. Redimensionnable + repliable en rail
 * d'icônes (chaque icône rouvre son module). État mémorisé en localStorage.
 */
export function RightDock({
  workspaceId,
  defaultWidth = 392,
  headerHeight = 44,
}: {
  workspaceId: string;
  defaultWidth?: number;
  /** Hauteur du header, alignée sur celle du layout hôte (44 desktop, 56 tablette). */
  headerHeight?: number;
}) {
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(COLLAPSED_KEY) === '1';
    } catch {
      return false;
    }
  });
  const [width, setWidth] = useState(() => {
    try {
      return readWidth(defaultWidth);
    } catch {
      return defaultWidth;
    }
  });
  const [active, setActive] = useState<ModuleKey>(() => {
    try {
      return readModule();
    } catch {
      return 'agent';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(COLLAPSED_KEY, collapsed ? '1' : '0');
    } catch {
      // ignore
    }
  }, [collapsed]);
  useEffect(() => {
    try {
      localStorage.setItem(MODULE_KEY, active);
    } catch {
      // ignore
    }
  }, [active]);

  // Persiste la largeur et refait le fit du terminal xterm (resize fenêtre).
  useEffect(() => {
    try {
      localStorage.setItem(WIDTH_KEY, String(width));
    } catch {
      // ignore
    }
    window.dispatchEvent(new Event('resize'));
  }, [width]);

  // Re-fit du terminal quand on (ré)affiche le module agent ou qu'on déplie.
  // biome-ignore lint/correctness/useExhaustiveDependencies: re-fit voulu au changement de module
  useEffect(() => {
    if (!collapsed) window.dispatchEvent(new Event('resize'));
  }, [active, collapsed]);

  // Panneau ancré à droite : la largeur = distance du curseur au bord droit.
  const onResize = (clientX: number) => {
    const max = Math.min(MAX_W, window.innerWidth - 360);
    setWidth(Math.max(MIN_W, Math.min(max, window.innerWidth - clientX)));
  };

  const openModule = (key: ModuleKey) => {
    setActive(key);
    setCollapsed(false);
  };

  // ── Rail replié : la liste des modules disponibles ──
  if (collapsed) {
    return (
      <div
        style={{
          width: RAIL_W,
          flexShrink: 0,
          borderLeft: '1px solid var(--border)',
          background: 'var(--surface-2)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 4,
          padding: '12px 0',
        }}
      >
        {MODULES.map((m) => (
          <button
            key={m.key}
            type="button"
            onClick={() => openModule(m.key)}
            title={m.label}
            aria-label={m.label}
            className="dock-tab"
            data-on={m.key === active ? '' : undefined}
          >
            <HIcon name={m.icon} size={18} color="currentColor" />
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <button
          type="button"
          onClick={() => setCollapsed(false)}
          className="dock-tab"
          aria-label="Open panel"
          title="Open"
        >
          <HIcon name="chevL" size={16} color="var(--faint)" />
        </button>
      </div>
    );
  }

  // ── Panneau déployé ──
  const activeMod = MODULES.find((m) => m.key === active) ?? MODULES[0];
  return (
    <div
      style={{
        position: 'relative',
        width,
        flexShrink: 0,
        borderLeft: '1px solid var(--border)',
        background: 'var(--surface-2)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <PanelResizer side="left" onResize={onResize} ariaLabel="Resize panel" />
      {/* header : sélecteur de module + repli */}
      <div
        style={{
          height: headerHeight,
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          padding: '0 8px 0 8px',
          borderBottom: '1px solid var(--border)',
          background: 'var(--surface)',
        }}
      >
        {MODULES.map((m) => (
          <button
            key={m.key}
            type="button"
            onClick={() => setActive(m.key)}
            title={m.label}
            aria-label={m.label}
            className="dock-tab"
            data-on={m.key === active ? '' : undefined}
          >
            <HIcon name={m.icon} size={16} color="currentColor" />
          </button>
        ))}
        <span
          style={{
            flex: 1,
            fontSize: 12.5,
            fontWeight: 700,
            paddingLeft: 4,
            color: 'var(--text-2)',
          }}
        >
          {activeMod.label}
        </span>
        <button
          type="button"
          onClick={() => setCollapsed(true)}
          className="btn btn-ghost btn-icon btn-sm"
          aria-label="Hide panel"
          title="Hide panel"
        >
          <HIcon name="chevR" size={16} color="var(--text-2)" />
        </button>
      </div>
      {/* corps : le terminal agent reste monté (caché) pour préserver la session */}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          display: active === 'agent' ? 'block' : 'none',
          background: 'var(--term-bg)',
        }}
      >
        <WorkspaceTerminal workspaceId={workspaceId} kind="agent" />
      </div>
      {active === 'preview' && (
        <div style={{ flex: 1, minHeight: 0, overflow: 'auto', background: 'var(--bg)' }}>
          <WorkspacePreview workspaceId={workspaceId} />
        </div>
      )}
      {active === 'git' && (
        <ModulePane
          icon="branch"
          title="Git"
          desc="Statut, staging, commits et diff du workspace."
        />
      )}
      {active === 'service' && (
        <ModulePane
          icon="layers"
          title="Service"
          desc="Bases de données et services managés (Postgres, Redis…)."
        />
      )}
      {active === 'actions' && (
        <ModulePane
          icon="bolt"
          title="Quick Actions"
          desc="Raccourcis : prévisualisation, ports, redémarrage du workspace…"
        />
      )}
    </div>
  );
}

/** État initial d'un module (en attendant son contenu). */
function ModulePane({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div
      style={{
        flex: 1,
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        padding: 24,
        textAlign: 'center',
        color: 'var(--muted)',
      }}
    >
      <HIcon name={icon} size={26} color="var(--faint)" />
      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-2)' }}>{title}</div>
      <div style={{ fontSize: 12.5, maxWidth: 220, lineHeight: 1.5 }}>{desc}</div>
      <span className="chip chip-sm" style={{ marginTop: 4 }}>
        Bientôt
      </span>
    </div>
  );
}
