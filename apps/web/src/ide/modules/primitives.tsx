import type { ReactNode } from 'react';
import { HIcon } from '../../icons';
import { renderAnsi } from '../../ui/Ansi';

/** Statuts unifiés des modules (Quick Actions, Services). */
export type ModuleStatus = 'active' | 'done' | 'failed' | 'running' | 'stopped';

const STATUS: Record<ModuleStatus, { label: string; color: string; live?: boolean }> = {
  active: { label: 'Running', color: 'var(--warn)', live: true },
  done: { label: 'Done', color: 'var(--good)' },
  failed: { label: 'Failed', color: 'var(--danger)' },
  running: { label: 'Running', color: 'var(--good)', live: true },
  stopped: { label: 'Stopped', color: 'var(--muted)' },
};

/** Badge d'état (pastille colorée + libellé). */
export function StatusBadge({ status, label }: { status: ModuleStatus; label?: string }) {
  const s = STATUS[status];
  return (
    <span className="sbadge" style={{ color: s.color }}>
      <span className={`dot ${s.live ? 'dot-live' : ''}`} style={{ background: s.color }} />
      {label ?? s.label}
    </span>
  );
}

/** Console / sortie monospace scrollable (logs, run output) avec rendu des couleurs ANSI. */
export function OutputView({ text, style }: { text: string; style?: React.CSSProperties }) {
  return (
    <div className="out-view xterm-viewport" style={style}>
      {text ? renderAnsi(text) : '​'}
    </div>
  );
}

/** État vide d'un module : icône + titre + texte + action optionnelle. */
export function EmptyState({
  icon,
  title,
  desc,
  action,
}: {
  icon: string;
  title: string;
  desc?: string;
  action?: ReactNode;
}) {
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
      {desc && <div style={{ fontSize: 12.5, maxWidth: 240, lineHeight: 1.5 }}>{desc}</div>}
      {action && <div style={{ marginTop: 4 }}>{action}</div>}
    </div>
  );
}

/** Barre d'outils d'un module : titre/segmenté à gauche, actions à droite. */
export function ModuleToolbar({ left, right }: { left?: ReactNode; right?: ReactNode }) {
  return (
    <div
      style={{
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '8px 10px',
        borderBottom: '1px solid var(--border)',
      }}
    >
      {left}
      <div style={{ flex: 1 }} />
      {right}
    </div>
  );
}
