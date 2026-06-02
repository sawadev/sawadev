import type { QuickAction } from '@sawadev/shared';
import { useEffect, useState } from 'react';
import {
  useActionRun,
  useActions,
  useCreateAction,
  useDeleteAction,
  useInvalidateActions,
  useRunAction,
  useUpdateAction,
} from '../../api/hooks';
import { HIcon } from '../../icons';
import { Menu, type MenuItem } from '../../ui/Menu';
import { COMPACT, useElementWidth } from '../useElementWidth';
import { EmptyState, OutputView, StatusBadge } from './primitives';

/** Quick Actions : commandes sh configurables, lancées avec suivi d'état/sortie. */
export function QuickActions({ workspaceId }: { workspaceId: string }) {
  const [ref, width] = useElementWidth();
  const compact = width > 0 && width < COMPACT;
  const { data: actions = [], isLoading } = useActions(workspaceId);

  const [form, setForm] = useState<{ id: string | null; label: string; command: string } | null>(
    null,
  );
  const [openRun, setOpenRun] = useState<{ actionId: string; runId: string } | null>(null);

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
          {actions.length} action{actions.length > 1 ? 's' : ''}
        </span>
        <button
          type="button"
          className="btn btn-soft btn-sm"
          onClick={() => setForm({ id: null, label: '', command: '' })}
        >
          <HIcon name="plus" size={14} /> New
        </button>
      </div>

      <div style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
        {form && (
          <ActionForm workspaceId={workspaceId} initial={form} onClose={() => setForm(null)} />
        )}
        {!form && actions.length === 0 && !isLoading ? (
          <EmptyState
            icon="bolt"
            title="No quick actions"
            desc="Save shell commands (build, test, deploy…) and run them in one click."
            action={
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => setForm({ id: null, label: '', command: '' })}
              >
                <HIcon name="plus" size={14} color="var(--on-accent)" /> New action
              </button>
            }
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 10 }}>
            {actions.map((a) => (
              <ActionCard
                key={a.id}
                workspaceId={workspaceId}
                action={a}
                compact={compact}
                openRunId={openRun?.actionId === a.id ? openRun.runId : null}
                onEdit={() => setForm({ id: a.id, label: a.label, command: a.command })}
                onRunStarted={(runId) => setOpenRun({ actionId: a.id, runId })}
                onCloseRun={() => setOpenRun(null)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ActionCard({
  workspaceId,
  action,
  compact,
  openRunId,
  onEdit,
  onRunStarted,
  onCloseRun,
}: {
  workspaceId: string;
  action: QuickAction;
  compact: boolean;
  openRunId: string | null;
  onEdit: () => void;
  onRunStarted: (runId: string) => void;
  onCloseRun: () => void;
}) {
  const run = useRunAction(workspaceId);
  const del = useDeleteAction(workspaceId);
  const invalidate = useInvalidateActions(workspaceId);
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);

  const onRun = () =>
    run.mutate(action.id, {
      onSuccess: (res) => {
        onRunStarted(res.runId);
        invalidate();
      },
    });

  const menuItems: MenuItem[] = [
    { label: 'Edit', icon: <HIcon name="gear" size={14} />, onClick: onEdit },
    {
      label: 'Delete',
      danger: true,
      icon: <HIcon name="trash" size={14} />,
      onClick: () => del.mutate(action.id),
    },
  ];

  return (
    <div className="mod-card">
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
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
            {action.label}
          </div>
          <div
            className="mono"
            style={{
              fontSize: 11,
              color: 'var(--muted)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              marginTop: 2,
            }}
          >
            {action.command}
          </div>
        </div>
        <button
          type="button"
          className="btn btn-soft btn-sm"
          disabled={run.isPending}
          onClick={onRun}
          title="Run"
        >
          <HIcon name="play" size={13} color="var(--good)" />
          {!compact && 'Run'}
        </button>
        <button
          type="button"
          className="btn btn-ghost btn-icon btn-sm"
          aria-label="Action menu"
          onClick={(e) => setMenu({ x: e.clientX, y: e.clientY })}
        >
          <HIcon name="dotsV" size={15} color="var(--muted)" />
        </button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
        {action.lastRun ? (
          <StatusBadge status={action.lastRun.status} />
        ) : (
          <span style={{ fontSize: 11.5, color: 'var(--faint)' }}>Never run</span>
        )}
      </div>

      {openRunId && <RunOutput workspaceId={workspaceId} runId={openRunId} onClose={onCloseRun} />}

      {menu && (
        <Menu anchor={{ x: menu.x, y: menu.y }} items={menuItems} onClose={() => setMenu(null)} />
      )}
    </div>
  );
}

function RunOutput({
  workspaceId,
  runId,
  onClose,
}: {
  workspaceId: string;
  runId: string;
  onClose: () => void;
}) {
  const { data: run } = useActionRun(workspaceId, runId);
  const invalidate = useInvalidateActions(workspaceId);

  // À la fin du run, rafraîchit le badge « dernier run » de la liste.
  useEffect(() => {
    if (run && run.status !== 'active') invalidate();
  }, [run, invalidate]);

  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        {run && <StatusBadge status={run.status} />}
        {run?.exitCode != null && run.status === 'failed' && (
          <span style={{ fontSize: 11, color: 'var(--danger)' }}>exit {run.exitCode}</span>
        )}
        <div style={{ flex: 1 }} />
        <button
          type="button"
          className="btn btn-ghost btn-icon btn-sm"
          aria-label="Close output"
          onClick={onClose}
        >
          <HIcon name="x" size={14} color="var(--muted)" />
        </button>
      </div>
      <OutputView text={run?.output ?? ''} style={{ maxHeight: 200 }} />
    </div>
  );
}

function ActionForm({
  workspaceId,
  initial,
  onClose,
}: {
  workspaceId: string;
  initial: { id: string | null; label: string; command: string };
  onClose: () => void;
}) {
  const create = useCreateAction(workspaceId);
  const update = useUpdateAction(workspaceId);
  const [label, setLabel] = useState(initial.label);
  const [command, setCommand] = useState(initial.command);
  const busy = create.isPending || update.isPending;
  const valid = label.trim() && command.trim();

  const submit = () => {
    if (!valid) return;
    const body = { label: label.trim(), command: command.trim() };
    if (initial.id) update.mutate({ id: initial.id, ...body }, { onSuccess: onClose });
    else create.mutate(body, { onSuccess: onClose });
  };

  return (
    <div className="mod-card" style={{ margin: 10 }}>
      <input
        className="modal-input"
        style={{ marginTop: 0 }}
        placeholder="Label (e.g. Build)"
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        spellCheck={false}
      />
      <textarea
        className="modal-input mono"
        style={{ marginTop: 8, minHeight: 56, resize: 'vertical', fontSize: 12 }}
        placeholder="Command (e.g. bun run build)"
        value={command}
        onChange={(e) => setCommand(e.target.value)}
        spellCheck={false}
      />
      <div style={{ display: 'flex', gap: 8, marginTop: 8, justifyContent: 'flex-end' }}>
        <button type="button" className="btn btn-ghost btn-sm" onClick={onClose}>
          Cancel
        </button>
        <button
          type="button"
          className="btn btn-primary btn-sm"
          disabled={!valid || busy}
          onClick={submit}
        >
          {initial.id ? 'Save' : 'Create'}
        </button>
      </div>
    </div>
  );
}
