import type { Workspace } from '@sawadev/shared';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useDeleteWorkspace, useRenameWorkspace } from '../api/hooks';
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
  const rename = useRenameWorkspace();
  const [name, setName] = useState(workspace.name);
  const [confirm, setConfirm] = useState('');
  const [showDelete, setShowDelete] = useState(false);
  const canRename = !!name.trim() && name.trim() !== workspace.name && !rename.isPending;
  const canDelete = confirm.trim() === workspace.name && !del.isPending;
  const onRename = () => {
    if (canRename) rename.mutate({ id: workspace.id, name: name.trim() });
  };

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
            <div
              style={{
                fontSize: 15,
                fontWeight: 700,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {workspace.name}
            </div>
            <span className="mono id-tag" style={{ marginTop: 3 }}>
              {workspace.id}
            </span>
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
          {/* Renommer */}
          <div style={{ marginBottom: 18 }}>
            <div
              style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-2)', marginBottom: 6 }}
            >
              Name
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                className="modal-input"
                style={{ marginTop: 0 }}
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && canRename) onRename();
                }}
                placeholder="Workspace name"
                spellCheck={false}
              />
              <button
                type="button"
                className="btn btn-soft btn-sm"
                style={{ flexShrink: 0 }}
                disabled={!canRename}
                onClick={onRename}
              >
                {rename.isPending ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>

          <div className="danger-zone">
            <button
              type="button"
              className="danger-toggle"
              aria-expanded={showDelete}
              onClick={() => setShowDelete((v) => !v)}
            >
              <HIcon name="trash" size={14} color="var(--danger)" />
              <span style={{ flex: 1, textAlign: 'left' }}>Delete workspace</span>
              <HIcon name={showDelete ? 'chevD' : 'chevR'} size={14} color="var(--danger)" />
            </button>
            {showDelete && (
              <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: 12.5, color: 'var(--muted)', lineHeight: 1.5 }}>
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
            )}
          </div>
        </div>
      </div>
    </div>,
    modalRoot(),
  );
}
