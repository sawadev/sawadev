import { useMemo, useState } from 'react';
import { useKillTerminal, useTerminals } from '../api/hooks';
import { HIcon } from '../icons';
import { useIde } from '../ide/ide-context';
import { Menu, type MenuItem } from '../ui/Menu';
import { WorkspaceTerminal } from './Terminal';

/**
 * Panneau terminal **multi-onglets** : créer / fermer (détache) / kill (termine) /
 * renommer / rouvrir une session orpheline, + indicateur d'activité, Clear et Maximize.
 * La liste d'onglets vit dans l'état IDE (persisté côté serveur).
 */
export function TerminalPanel({
  workspaceId,
  maximized,
  onToggleMaximize,
}: {
  workspaceId: string;
  maximized?: boolean;
  onToggleMaximize?: () => void;
}) {
  const ide = useIde();
  const { terminals } = ide;
  const active = ide.activeTerminal ?? terminals[0]?.id ?? null;
  const kill = useKillTerminal(workspaceId);
  const { data: live = [] } = useTerminals(workspaceId);

  const [activity, setActivity] = useState<Record<string, boolean>>({});
  const [clearNonces, setClearNonces] = useState<Record<string, number>>({});
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [tabMenu, setTabMenu] = useState<{ id: string; x: number; y: number } | null>(null);
  const [orphanMenu, setOrphanMenu] = useState<{ x: number; y: number } | null>(null);

  // Sessions vivantes côté serveur sans onglet local → proposables à la réouverture.
  const orphans = useMemo(
    () => live.filter((s) => !terminals.some((t) => t.id === s.id)).map((s) => s.id),
    [live, terminals],
  );

  const select = (id: string) => {
    ide.setActiveTerminal(id);
    setActivity((a) => {
      if (!a[id]) return a;
      const { [id]: _, ...rest } = a;
      return rest;
    });
  };
  const mark = (id: string) => setActivity((a) => (a[id] ? a : { ...a, [id]: true }));
  const clearActive = () =>
    active && setClearNonces((n) => ({ ...n, [active]: (n[active] ?? 0) + 1 }));

  const startRename = (id: string, name: string) => {
    setEditing(id);
    setDraft(name);
  };
  const commitRename = (id: string) => {
    const name = draft.trim();
    if (name) ide.renameTerminal(id, name);
    setEditing(null);
  };
  const killSession = (id: string) => {
    kill.mutate(id);
    ide.closeTerminal(id);
  };

  const menuItems = (id: string): MenuItem[] => [
    {
      label: 'Rename',
      icon: <HIcon name="file" size={14} />,
      onClick: () => startRename(id, terminals.find((t) => t.id === id)?.name ?? ''),
    },
    {
      label: 'Kill session',
      danger: true,
      icon: <HIcon name="trash" size={14} />,
      onClick: () => killSession(id),
    },
  ];

  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--term-bg)',
      }}
    >
      {/* Barre d'onglets */}
      <div
        style={{
          height: 34,
          flexShrink: 0,
          display: 'flex',
          alignItems: 'stretch',
          borderBottom: '1px solid var(--border)',
          background: 'var(--surface)',
        }}
      >
        <div className="term-tabs">
          {terminals.map((t) => {
            const on = t.id === active;
            return (
              <div
                key={t.id}
                className="term-tab"
                data-on={on ? '' : undefined}
                onClick={() => select(t.id)}
                onDoubleClick={() => startRename(t.id, t.name)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  setTabMenu({ id: t.id, x: e.clientX, y: e.clientY });
                }}
              >
                <HIcon name="terminal" size={11} color={on ? 'var(--text)' : 'var(--faint)'} />
                {editing === t.id ? (
                  <input
                    className="term-tab-edit"
                    autoFocus
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    onBlur={() => commitRename(t.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') commitRename(t.id);
                      else if (e.key === 'Escape') setEditing(null);
                    }}
                  />
                ) : (
                  <span className="term-tab-name">{t.name}</span>
                )}
                {activity[t.id] && !on && <span className="term-dot" />}
                <button
                  type="button"
                  className="term-tab-x"
                  title="Close (session keeps running)"
                  aria-label="Close terminal"
                  onClick={(e) => {
                    e.stopPropagation();
                    ide.closeTerminal(t.id);
                  }}
                >
                  <HIcon name="x" size={11} color="currentColor" />
                </button>
              </div>
            );
          })}
          <button
            type="button"
            className="term-add"
            title="New terminal"
            aria-label="New terminal"
            onClick={() => ide.addTerminal()}
          >
            <HIcon name="plus" size={13} color="currentColor" />
          </button>
        </div>

        <div style={{ flex: 1 }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 2, padding: '0 6px' }}>
          {orphans.length > 0 && (
            <button
              type="button"
              className="term-tool"
              title="Reopen session"
              aria-label="Reopen session"
              onClick={(e) => setOrphanMenu({ x: e.clientX, y: e.clientY })}
            >
              <HIcon name="history" size={14} color="currentColor" />
            </button>
          )}
          <button
            type="button"
            className="term-tool"
            title="Clear"
            aria-label="Clear terminal"
            disabled={!active}
            onClick={clearActive}
          >
            <HIcon name="refresh" size={13} color="currentColor" />
          </button>
          {onToggleMaximize && (
            <button
              type="button"
              className="term-tool"
              title={maximized ? 'Restore' : 'Maximize'}
              aria-label={maximized ? 'Restore terminal' : 'Maximize terminal'}
              onClick={onToggleMaximize}
            >
              <HIcon name={maximized ? 'chevD' : 'chevU'} size={14} color="currentColor" />
            </button>
          )}
        </div>
      </div>

      {/* Corps : un terminal par onglet (inactifs montés mais cachés). */}
      <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
        {terminals.length === 0 ? (
          <div className="term-empty">
            <button type="button" className="btn btn-soft btn-sm" onClick={() => ide.addTerminal()}>
              <HIcon name="plus" size={14} /> New terminal
            </button>
          </div>
        ) : (
          terminals.map((t) => (
            <div
              key={t.id}
              style={{
                position: 'absolute',
                inset: 0,
                display: t.id === active ? 'block' : 'none',
              }}
            >
              <WorkspaceTerminal
                workspaceId={workspaceId}
                session={t.id}
                active={t.id === active}
                clearNonce={clearNonces[t.id]}
                onActivity={() => {
                  if (t.id !== active) mark(t.id);
                }}
                onBell={() => {
                  if (t.id !== active) mark(t.id);
                }}
              />
            </div>
          ))
        )}
      </div>

      {tabMenu && (
        <Menu
          anchor={{ x: tabMenu.x, y: tabMenu.y }}
          items={menuItems(tabMenu.id)}
          onClose={() => setTabMenu(null)}
        />
      )}
      {orphanMenu && (
        <Menu
          anchor={{ x: orphanMenu.x, y: orphanMenu.y }}
          items={orphans.map((id) => ({
            label: `Session ${id}`,
            icon: <HIcon name="terminal" size={14} />,
            onClick: () => ide.addTerminal(id),
          }))}
          onClose={() => setOrphanMenu(null)}
        />
      )}
    </div>
  );
}
