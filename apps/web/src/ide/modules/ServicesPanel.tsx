import type { ToolConnection, ToolInstance, ToolType } from '@sawadev/shared';
import { useState } from 'react';
import { useCatalog, useToolActions, useToolLogs, useTools } from '../../api/hooks';
import { HIcon } from '../../icons';
import { COMPACT, useElementWidth } from '../useElementWidth';
import { EmptyState, OutputView, StatusBadge } from './primitives';

/** Module Services : catalogue d'images Docker + cartes start/stop/info/logs (backend mock). */
export function ServicesPanel({ workspaceId }: { workspaceId: string }) {
  const [ref, width] = useElementWidth();
  const compact = width > 0 && width < COMPACT;
  const { data: tools = [], isLoading } = useTools(workspaceId);
  const [adding, setAdding] = useState(false);

  return (
    <div ref={ref} style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
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
        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-2)', flex: 1 }}>
          {tools.length} service{tools.length > 1 ? 's' : ''}
        </span>
        <button
          type="button"
          className="btn btn-soft btn-sm"
          data-on={adding ? '' : undefined}
          onClick={() => setAdding((v) => !v)}
        >
          <HIcon name="plus" size={14} /> Add
        </button>
      </div>

      <div style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
        {adding && <Catalog workspaceId={workspaceId} onDone={() => setAdding(false)} />}

        {!adding && tools.length === 0 && !isLoading ? (
          <EmptyState
            icon="layers"
            title="No services"
            desc="Add a database or managed service (Postgres, Redis, Mongo…) to this workspace."
            action={
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => setAdding(true)}
              >
                <HIcon name="plus" size={14} color="var(--on-accent)" /> Add service
              </button>
            }
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 10 }}>
            {tools.map((t) => (
              <ToolCard key={t.id} workspaceId={workspaceId} tool={t} compact={compact} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Catalog({ workspaceId, onDone }: { workspaceId: string; onDone: () => void }) {
  const { data: catalog = [] } = useCatalog();
  const { add } = useToolActions(workspaceId);
  return (
    <div className="svc-catalog">
      {catalog.map((t: ToolType) => (
        <button
          key={t.type}
          type="button"
          className="svc-cat-card"
          disabled={add.isPending}
          onClick={() => add.mutate(t.type, { onSuccess: onDone })}
        >
          <HIcon name={t.icon} size={20} color="var(--accent-text)" />
          <span style={{ fontSize: 12.5, fontWeight: 600 }}>{t.label}</span>
          <span style={{ fontSize: 10.5, color: 'var(--muted)', lineHeight: 1.3 }}>
            {t.description}
          </span>
        </button>
      ))}
    </div>
  );
}

function ToolCard({
  workspaceId,
  tool,
  compact,
}: {
  workspaceId: string;
  tool: ToolInstance;
  compact: boolean;
}) {
  const { start, stop, remove } = useToolActions(workspaceId);
  const [view, setView] = useState<'none' | 'info' | 'logs'>('none');
  const [confirm, setConfirm] = useState(false);
  const running = tool.status === 'running';

  return (
    <div className="mod-card">
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <HIcon name="layers" size={16} color="var(--text-2)" />
        <div style={{ minWidth: 0, flex: 1 }}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {tool.name}
          </div>
          <StatusBadge status={tool.status} />
        </div>
        <button
          type="button"
          className="btn btn-soft btn-sm"
          disabled={start.isPending || stop.isPending}
          onClick={() => (running ? stop.mutate(tool.id) : start.mutate(tool.id))}
          title={running ? 'Stop' : 'Start'}
        >
          <HIcon
            name={running ? 'stop' : 'play'}
            size={13}
            color={running ? 'var(--danger)' : 'var(--good)'}
          />
          {!compact && (running ? 'Stop' : 'Start')}
        </button>
      </div>

      <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          data-on={view === 'info' ? '' : undefined}
          onClick={() => setView((v) => (v === 'info' ? 'none' : 'info'))}
        >
          <HIcon name="key" size={13} color="var(--muted)" /> Info
        </button>
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          data-on={view === 'logs' ? '' : undefined}
          onClick={() => setView((v) => (v === 'logs' ? 'none' : 'logs'))}
        >
          <HIcon name="terminal" size={13} color="var(--muted)" /> Logs
        </button>
        <div style={{ flex: 1 }} />
        <button
          type="button"
          className="btn btn-ghost btn-icon btn-sm"
          aria-label="Delete service"
          onClick={() => setConfirm(true)}
        >
          <HIcon name="trash" size={14} color="var(--danger)" />
        </button>
      </div>

      {confirm && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
          <span style={{ fontSize: 12, color: 'var(--muted)', flex: 1 }}>Delete {tool.name}?</span>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setConfirm(false)}>
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-sm"
            style={{ background: 'var(--danger)', color: '#fff' }}
            onClick={() => remove.mutate(tool.id)}
          >
            Delete
          </button>
        </div>
      )}

      {view === 'info' && <ConnInfo conn={tool.connection} />}
      {view === 'logs' && <ToolLogs workspaceId={workspaceId} toolId={tool.id} />}
    </div>
  );
}

function ConnInfo({ conn }: { conn: ToolConnection }) {
  const rows: [string, string | undefined][] = [
    ['Host', conn.host],
    ['Port', String(conn.port)],
    ['Database', conn.database],
    ['User', conn.username],
    ['Password', conn.password],
    ['URL', conn.url],
  ];
  return (
    <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
      {rows
        .filter(([, v]) => v)
        .map(([k, v]) => (
          <ConnRow key={k} label={k} value={v as string} secret={k === 'Password'} />
        ))}
    </div>
  );
}

function ConnRow({ label, value, secret }: { label: string; value: string; secret?: boolean }) {
  const [show, setShow] = useState(!secret);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11.5 }}>
      <span style={{ color: 'var(--muted)', width: 64, flexShrink: 0 }}>{label}</span>
      <span
        className="mono"
        style={{
          flex: 1,
          minWidth: 0,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          color: 'var(--text)',
        }}
      >
        {show ? value : '••••••••'}
      </span>
      {secret && (
        <button
          type="button"
          className="btn btn-ghost btn-icon btn-sm"
          aria-label="Reveal"
          onClick={() => setShow((s) => !s)}
        >
          <HIcon name="eye" size={13} color="var(--muted)" />
        </button>
      )}
      <button
        type="button"
        className="btn btn-ghost btn-icon btn-sm"
        aria-label="Copy"
        onClick={() => navigator.clipboard?.writeText(value)}
      >
        <HIcon name="copy" size={13} color="var(--muted)" />
      </button>
    </div>
  );
}

function ToolLogs({ workspaceId, toolId }: { workspaceId: string; toolId: string }) {
  const { data } = useToolLogs(workspaceId, toolId);
  return <OutputView text={data?.logs ?? ''} style={{ marginTop: 8, maxHeight: 160 }} />;
}
