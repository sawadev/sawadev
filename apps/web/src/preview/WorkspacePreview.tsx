import type { Port } from '@sawadev/shared';
import { useState } from 'react';
import { useAddPort, usePorts, useRemovePort } from '../api/hooks';
import { HIcon } from '../icons';
import { EmptyState } from '../ide/modules/primitives';
import { COMPACT, useElementWidth } from '../ide/useElementWidth';

/** Gestion des ports exposés et liens de preview (sous-domaines Caddy). */
export function WorkspacePreview({ workspaceId }: { workspaceId: string }) {
  const [ref, width] = useElementWidth();
  const compact = width > 0 && width < COMPACT;
  const { data: ports = [], isLoading } = usePorts(workspaceId);
  const addM = useAddPort(workspaceId);
  const removeM = useRemovePort(workspaceId);
  const [port, setPort] = useState('');

  const n = Number(port);
  const valid = Number.isInteger(n) && n > 0 && n < 65536;
  const submit = () => {
    if (!valid) return;
    addM.mutate(n, { onSuccess: () => setPort('') });
  };

  return (
    <div ref={ref} style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
      {/* barre d'ajout : port → URL de preview */}
      <div style={{ flexShrink: 0, padding: '8px 10px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <label className="field" style={{ flex: 1, height: 34 }}>
            <HIcon name="globe" size={14} color="var(--faint)" />
            <input
              type="number"
              inputMode="numeric"
              value={port}
              onChange={(e) => setPort(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submit()}
              placeholder="Port (e.g. 3000)"
              style={{
                border: 'none',
                outline: 'none',
                background: 'transparent',
                flex: 1,
                minWidth: 0,
                fontSize: 13,
                color: 'var(--text)',
              }}
            />
          </label>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={submit}
            disabled={addM.isPending || !valid}
          >
            <HIcon name="plus" size={14} color="var(--on-accent)" />
            {!compact && 'Expose'}
          </button>
        </div>
        {addM.isError && (
          <div style={{ fontSize: 11.5, color: 'var(--danger)', marginTop: 6 }}>
            Couldn't expose this port. Is it already exposed?
          </div>
        )}
      </div>

      <div style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
        {!isLoading && ports.length === 0 ? (
          <EmptyState
            icon="globe"
            title="No ports exposed"
            desc="Run an app in the workspace, then expose its port to get a public preview URL."
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 10 }}>
            {ports.map((p) => (
              <PortCard
                key={p.port}
                port={p}
                onRemove={() => removeM.mutate(p.port)}
                busy={removeM.isPending}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function PortCard({ port, onRemove, busy }: { port: Port; onRemove: () => void; busy: boolean }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard?.writeText(port.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };
  return (
    <div className="mod-card">
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span className="chip chip-sm mono" style={{ flexShrink: 0 }}>
          :{port.port}
        </span>
        <a
          href={port.url}
          target="_blank"
          rel="noreferrer"
          className="mono"
          title={port.url}
          style={{
            flex: 1,
            minWidth: 0,
            fontSize: 12,
            color: 'var(--accent-text)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {port.url.replace(/^https?:\/\//, '')}
        </a>
        <button
          type="button"
          className="btn btn-ghost btn-icon btn-sm"
          aria-label="Copy URL"
          title={copied ? 'Copied' : 'Copy URL'}
          onClick={copy}
        >
          <HIcon
            name={copied ? 'check' : 'copy'}
            size={14}
            color={copied ? 'var(--good)' : 'var(--muted)'}
          />
        </button>
        <a
          href={port.url}
          target="_blank"
          rel="noreferrer"
          className="btn btn-ghost btn-icon btn-sm"
          aria-label="Open in new tab"
          title="Open"
        >
          <HIcon name="external" size={14} color="var(--muted)" />
        </a>
        <button
          type="button"
          className="btn btn-ghost btn-icon btn-sm"
          aria-label="Remove port"
          title="Remove"
          disabled={busy}
          onClick={onRemove}
        >
          <HIcon name="trash" size={14} color="var(--danger)" />
        </button>
      </div>
    </div>
  );
}
