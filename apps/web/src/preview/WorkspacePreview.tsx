import { useState } from 'react';
import { useAddPort, usePorts, useRemovePort } from '../api/hooks';
import { HIcon } from '../icons';

/** Gestion des ports exposés et liens de preview (sous-domaines Caddy). */
export function WorkspacePreview({ workspaceId }: { workspaceId: string }) {
  const { data: ports = [], isLoading } = usePorts(workspaceId);
  const addM = useAddPort(workspaceId);
  const removeM = useRemovePort(workspaceId);
  const [port, setPort] = useState('');

  const submit = () => {
    const n = Number(port);
    if (Number.isInteger(n) && n > 0 && n < 65536) {
      addM.mutate(n, { onSuccess: () => setPort('') });
    }
  };

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: 16 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-2)', marginBottom: 12 }}>
        EXPOSED PORTS
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <label className="field" style={{ flex: 1 }}>
          <HIcon name="globe" size={15} color="var(--faint)" />
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
              fontSize: 14,
              color: 'var(--text)',
            }}
          />
        </label>
        <button
          type="button"
          className="btn btn-primary"
          onClick={submit}
          disabled={addM.isPending || !port}
        >
          <HIcon name="plus" size={15} color="var(--on-accent)" />
          Expose
        </button>
      </div>

      {isLoading && <div style={{ color: 'var(--faint)', fontSize: 13 }}>Loading…</div>}
      {!isLoading && ports.length === 0 && (
        <div style={{ color: 'var(--faint)', fontSize: 13 }}>
          No port exposed yet. Run an app, then expose its port to get a preview URL.
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {ports.map((p) => (
          <div
            key={p.port}
            className="card"
            style={{ padding: 14, display: 'flex', alignItems: 'center', gap: 12 }}
          >
            <span className="chip chip-sm">:{p.port}</span>
            <a
              href={p.url}
              target="_blank"
              rel="noreferrer"
              className="mono"
              style={{ flex: 1, minWidth: 0, fontSize: 12.5, color: 'var(--accent-text)' }}
            >
              {p.url}
            </a>
            <a href={p.url} target="_blank" rel="noreferrer" className="btn btn-soft btn-sm">
              <HIcon name="external" size={14} color="var(--text)" />
            </a>
            <button
              type="button"
              className="btn btn-soft btn-sm"
              style={{ color: 'var(--danger)' }}
              onClick={() => removeM.mutate(p.port)}
            >
              <HIcon name="trash" size={14} color="var(--danger)" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
