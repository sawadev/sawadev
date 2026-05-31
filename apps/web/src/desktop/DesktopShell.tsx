import { Settings } from 'lucide-react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

/** Persistent left rail used by the desktop dashboard / settings pages. */
export function DeskRail() {
  const nav = useNavigate();
  return (
    <div
      style={{
        width: 58,
        flexShrink: 0,
        background: 'var(--surface-2)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '14px 0',
        gap: 6,
      }}
    >
      <button
        onClick={() => nav('/workspaces')}
        style={{
          width: 32,
          height: 32,
          borderRadius: 9,
          background: 'var(--bg)',
          border: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 10,
          cursor: 'pointer',
          padding: 0,
        }}
      >
        <span
          style={{
            width: 13,
            height: 13,
            borderRadius: 4,
            background: 'var(--accent)',
            transform: 'rotate(45deg)',
          }}
        />
      </button>
      <div style={{ flex: 1 }} />
      <button
        onClick={() => nav('/settings')}
        aria-label="Settings"
        title="Settings"
        style={{ border: 'none', background: 'none', padding: 0, cursor: 'pointer' }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 16,
            flexShrink: 0,
            background: 'var(--elevated)',
            border: '1px solid var(--border)',
            color: 'var(--text-2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Settings size={17} strokeWidth={1.7} />
        </div>
      </button>
    </div>
  );
}

/** Page chrome for non-IDE desktop pages: rail + scrollable content area. */
export function DeskFrame({ children }: { children: ReactNode }) {
  return (
    <div style={{ height: '100%', display: 'flex', background: 'var(--bg)' }}>
      <DeskRail />
      <div style={{ flex: 1, minWidth: 0, overflowY: 'auto' }}>{children}</div>
    </div>
  );
}
