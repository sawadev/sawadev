import type { Workspace } from '@sawadev/shared';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useDeleteWorkspace } from '../api/hooks';
import { HIcon } from '../icons';

function modalRoot(): HTMLElement {
  return (document.querySelector('.sawa') as HTMLElement | null) ?? document.body;
}

/**
 * Configuration d'un workspace (modal). Contient la suppression sécurisée :
 * il faut re-saisir le nom exact du workspace pour confirmer.
 */
export function WorkspaceConfig({
  workspace,
  onClose,
}: {
  workspace: Workspace;
  onClose: () => void;
}) {
  const del = useDeleteWorkspace();
  const [confirm, setConfirm] = useState('');
  const canDelete = confirm.trim() === workspace.name && !del.isPending;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const onDelete = () => {
    if (canDelete) del.mutate(workspace.id, { onSuccess: onClose });
  };

  return createPortal(
    <div className="modal-scrim" role="presentation" onClick={onClose}>
      <div
        className="modal-card card rise"
        role="dialog"
        aria-modal="true"
        aria-label="Workspace settings"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-head">
          <HIcon name="gear" size={18} color="var(--text-2)" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 700 }}>Workspace settings</div>
            <div className="mono" style={{ fontSize: 12, color: 'var(--faint)' }}>
              {workspace.id}
            </div>
          </div>
          <button
            type="button"
            className="btn btn-ghost btn-icon btn-sm"
            aria-label="Close"
            onClick={onClose}
          >
            <HIcon name="x" size={16} color="var(--text-2)" />
          </button>
        </div>

        <div className="modal-body">
          <div className="danger-zone">
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--danger)' }}>
              Delete workspace
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 4, lineHeight: 1.5 }}>
              This permanently removes the workspace and its data. Type{' '}
              <b style={{ color: 'var(--text-2)' }}>{workspace.name}</b> to confirm.
            </div>
            <input
              className="modal-input"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder={workspace.name}
              autoComplete="off"
              spellCheck={false}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter' && canDelete) onDelete();
              }}
            />
            <button
              type="button"
              className="btn btn-sm modal-delete"
              data-armed={canDelete ? '' : undefined}
              disabled={!canDelete}
              onClick={onDelete}
            >
              <HIcon name="trash" size={14} color="currentColor" />
              {del.isPending ? 'Deleting…' : 'Delete workspace'}
            </button>
          </div>
        </div>
      </div>
    </div>,
    modalRoot(),
  );
}
