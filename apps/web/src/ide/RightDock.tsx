import type { AgentProvider } from '@sawadev/shared';
import { useEffect, useState } from 'react';
import { useAgentMessages, useApiKeys, useClearChat } from '../api/hooks';
import { HIcon } from '../icons';
import { WorkspacePreview } from '../preview/WorkspacePreview';
import { PanelResizer } from './PanelResizer';
import { useIde } from './ide-context';
import { AgentChat, AgentProviderPicker, resolveProvider } from './modules/AgentChat';
import { GitPanel } from './modules/GitPanel';
import { QuickActions } from './modules/QuickActions';
import { ServicesPanel } from './modules/ServicesPanel';

const MIN_W = 300;
const MAX_W = 760;
const RAIL_W = 46;
const WIDTH_KEY = 'sawa.dock.width';
const COLLAPSED_KEY = 'sawa.dock.collapsed';
const MODULE_KEY = 'sawa.dock.module';

type ModuleKey = 'agent' | 'preview' | 'git' | 'service' | 'actions';
const MODULES: { key: ModuleKey; label: string; icon: string }[] = [
  { key: 'agent', label: 'AI Agent', icon: 'sparkle' },
  { key: 'git', label: 'Git', icon: 'branch' },
  { key: 'service', label: 'Service', icon: 'layers' },
  { key: 'actions', label: 'Quick Actions', icon: 'bolt' },
  { key: 'preview', label: 'Ports', icon: 'globe' },
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

  // Panneau ancré à gauche du rail : largeur = (bord interne du rail) − X du curseur.
  const onResize = (clientX: number) => {
    const right = window.innerWidth - RAIL_W;
    const max = Math.min(MAX_W, window.innerWidth - 360 - RAIL_W);
    setWidth(Math.max(MIN_W, Math.min(max, right - clientX)));
  };

  // Clic sur une icône du rail : ouvre le module, ou referme le panneau si déjà actif.
  const onRailClick = (key: ModuleKey) => {
    if (!collapsed && active === key) setCollapsed(true);
    else {
      setActive(key);
      setCollapsed(false);
    }
  };

  // Provider d'agent (sélecteur dans le header du dock) : mémorisé par workspace, Gemma toujours dispo.
  const ide = useIde();
  const { data: keys = [] } = useApiKeys();
  const connectedProviders: AgentProvider[] = [
    ...keys.filter((k) => k.connected).map((k) => k.provider),
    'gemma',
  ];
  const agentProvider = resolveProvider(ide.agentProvider, connectedProviders);

  // Reset du chat depuis le header du dock (le bouton n'apparaît que s'il y a des messages).
  const clearChat = useClearChat(workspaceId);
  const { data: agentMessages = [] } = useAgentMessages(workspaceId);

  const activeMod = MODULES.find((m) => m.key === active) ?? MODULES[0];

  // Rail d'icônes **toujours visible** + panneau (à sa gauche) du seul module choisi.
  return (
    <div style={{ display: 'flex', flexShrink: 0, height: '100%' }}>
      {!collapsed && (
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
          {/* header : titre du module actif + repli */}
          <div
            style={{
              height: headerHeight,
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              padding: '0 8px',
              borderBottom: '1px solid var(--border)',
              background: 'var(--surface)',
            }}
          >
            {active === 'agent' && agentMessages.length > 0 && (
              <button
                type="button"
                onClick={() => clearChat.mutate()}
                className="btn btn-ghost btn-icon btn-sm"
                aria-label="Reset chat"
                title="Reset chat"
                style={{ marginRight: 2 }}
              >
                <HIcon name="trash" size={14} color="var(--text-2)" />
              </button>
            )}
            <span
              style={{
                fontSize: 12.5,
                fontWeight: 700,
                paddingLeft: active === 'agent' && agentMessages.length > 0 ? 0 : 4,
                color: 'var(--text-2)',
              }}
            >
              {activeMod.label}
            </span>
            {active === 'agent' && connectedProviders.length > 0 && (
              <div style={{ marginLeft: 8 }}>
                <AgentProviderPicker
                  provider={agentProvider}
                  connected={connectedProviders}
                  onChange={ide.setAgentProvider}
                />
              </div>
            )}
            <div style={{ flex: 1 }} />
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
          {active === 'agent' && <AgentChat workspaceId={workspaceId} showPicker={false} />}
          {active === 'preview' && <WorkspacePreview workspaceId={workspaceId} />}
          {active === 'git' && <GitPanel workspaceId={workspaceId} />}
          {active === 'service' && <ServicesPanel workspaceId={workspaceId} />}
          {active === 'actions' && <QuickActions workspaceId={workspaceId} />}
        </div>
      )}

      {/* rail permanent : sélecteur de modules (toujours disponible) */}
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
            onClick={() => onRailClick(m.key)}
            aria-label={m.label}
            className="dock-tab"
            data-on={!collapsed && m.key === active ? '' : undefined}
          >
            <HIcon name={m.icon} size={18} color="currentColor" />
            <span className="ttip" data-place="left">
              {m.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
