import { useEffect, useRef, useState } from 'react';
import { HIcon } from '../icons';
import { WorkspaceTerminal } from '../terminal/Terminal';
import { AIMark } from '../ui';

const MIN_W = 300;
const MAX_W = 760;
const RAIL_W = 46;
const WIDTH_KEY = 'sawa.ai.width';
const COLLAPSED_KEY = 'sawa.ai.collapsed';

function readWidth(fallback: number): number {
  const v = Number(localStorage.getItem(WIDTH_KEY));
  return v >= MIN_W && v <= MAX_W ? v : fallback;
}

/**
 * Panneau « AI Agent » de droite (desktop & tablette) :
 * - redimensionnable en largeur (poignée sur le bord gauche),
 * - repliable en une languette verticale d'accès facile.
 * État (largeur + repli) mémorisé en localStorage.
 */
export function AgentPanel({
  workspaceId,
  defaultWidth = 392,
}: {
  workspaceId: string;
  defaultWidth?: number;
}) {
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(COLLAPSED_KEY) === '1';
    } catch {
      return false;
    }
  });
  const [width, setWidth] = useState(() => {
    try {
      return readWidth(defaultWidth);
    } catch {
      return defaultWidth;
    }
  });
  const dragging = useRef(false);

  useEffect(() => {
    try {
      localStorage.setItem(COLLAPSED_KEY, collapsed ? '1' : '0');
    } catch {
      // ignore
    }
  }, [collapsed]);

  // Persiste la largeur et refait le fit du terminal xterm (qui n'écoute
  // que les resize de fenêtre) à chaque changement de largeur.
  useEffect(() => {
    try {
      localStorage.setItem(WIDTH_KEY, String(width));
    } catch {
      // ignore
    }
    window.dispatchEvent(new Event('resize'));
  }, [width]);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (!dragging.current) return;
      const max = Math.min(MAX_W, window.innerWidth - 360);
      setWidth(Math.max(MIN_W, Math.min(max, window.innerWidth - e.clientX)));
    };
    const onUp = () => {
      if (!dragging.current) return;
      dragging.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
  }, []);

  // ── Languette repliée ──
  if (collapsed) {
    return (
      <button
        type="button"
        onClick={() => setCollapsed(false)}
        aria-label="Show AI Agent panel"
        title="Show AI Agent"
        style={{
          width: RAIL_W,
          flexShrink: 0,
          border: 'none',
          borderLeft: '1px solid var(--border)',
          background: 'var(--surface-2)',
          cursor: 'pointer',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 12,
          padding: '14px 0',
          color: 'var(--text-2)',
        }}
      >
        <AIMark size={26} />
        <span
          style={{
            writingMode: 'vertical-rl',
            transform: 'rotate(180deg)',
            fontSize: 12.5,
            fontWeight: 700,
            letterSpacing: 0.4,
            color: 'var(--text-2)',
          }}
        >
          AI Agent
        </span>
        <div style={{ flex: 1 }} />
        <HIcon name="chevL" size={16} color="var(--faint)" />
      </button>
    );
  }

  // ── Panneau déployé ──
  return (
    <div
      style={{
        position: 'relative',
        width,
        flexShrink: 0,
        borderLeft: '1px solid var(--border)',
        background: 'var(--surface-2)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* poignée de redimensionnement */}
      <div
        onPointerDown={(e) => {
          e.preventDefault();
          dragging.current = true;
          document.body.style.cursor = 'col-resize';
          document.body.style.userSelect = 'none';
        }}
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize AI Agent panel"
        style={{
          position: 'absolute',
          left: -3,
          top: 0,
          bottom: 0,
          width: 8,
          cursor: 'col-resize',
          zIndex: 5,
        }}
      />
      <div
        style={{
          height: 56,
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          gap: 11,
          padding: '0 14px 0 16px',
          borderBottom: '1px solid var(--border)',
          background: 'var(--surface)',
        }}
      >
        <AIMark size={26} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, lineHeight: 1.1 }}>AI Agent</div>
          <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 2 }}>
            always alongside your work
          </div>
        </div>
        <span className="chip chip-sm chip-accent">Claude Code</span>
        <button
          type="button"
          onClick={() => setCollapsed(true)}
          className="btn btn-ghost btn-icon btn-sm"
          aria-label="Hide AI Agent panel"
          title="Hide panel"
        >
          <HIcon name="chevR" size={16} color="var(--text-2)" />
        </button>
      </div>
      <div style={{ flex: 1, minHeight: 0, background: 'var(--term-bg)' }}>
        <WorkspaceTerminal workspaceId={workspaceId} kind="agent" />
      </div>
    </div>
  );
}
