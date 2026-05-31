import type { ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useUI } from '../context';
import { HIcon } from '../icons';
import { UserMark } from '../ui';

const NAV: { icon: string; to: string; match: (p: string) => boolean }[] = [
  { icon: 'grid', to: '/workspaces', match: (p) => p === '/workspaces' || p === '/' },
  { icon: 'folder', to: '/workspaces/storefront-api', match: (p) => p.startsWith('/workspaces/') },
  { icon: 'gear', to: '/settings', match: (p) => p === '/settings' },
];

/** Persistent left rail used by the desktop dashboard / settings pages. */
export function DeskRail() {
  const nav = useNavigate();
  const { pathname } = useLocation();
  const { theme, toggleTheme } = useUI();
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
      {NAV.map((it, i) => {
        const on = it.match(pathname);
        return (
          <button
            key={i}
            onClick={() => nav(it.to)}
            style={{
              width: 40,
              height: 40,
              borderRadius: 11,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              background: on ? 'var(--surface)' : 'transparent',
              boxShadow: on ? '0 1px 3px rgba(0,0,0,.15)' : 'none',
              border: on ? '1px solid var(--border-soft)' : '1px solid transparent',
            }}
          >
            <HIcon
              name={it.icon}
              size={19}
              color={on ? 'var(--text)' : 'var(--faint)'}
              sw={on ? 1.8 : 1.6}
            />
          </button>
        );
      })}
      <div style={{ flex: 1 }} />
      <button
        onClick={toggleTheme}
        className="btn btn-ghost btn-icon"
        style={{ width: 40, height: 40 }}
      >
        <HIcon name={theme === 'dark' ? 'sun' : 'moon'} size={18} color="var(--muted)" />
      </button>
      <button
        onClick={() => nav('/settings')}
        style={{ border: 'none', background: 'none', padding: 0, cursor: 'pointer' }}
      >
        <UserMark size={32} />
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
