import type { AgentProvider } from '@sawadev/shared';
import type { CSSProperties } from 'react';
import claude from '../assets/providers/claude.png';
import codex from '../assets/providers/codex.svg';
import cursor from '../assets/providers/cursor.svg';
import { HIcon } from '../icons';

const LOGO: Record<'anthropic' | 'openai' | 'cursor', string> = {
  anthropic: claude,
  openai: codex,
  cursor,
};

/**
 * Logo d'un fournisseur d'agent. `badge` = pastille blanche arrondie (avatar des
 * réponses, lisible en clair/sombre) ; sinon le logo seul (inline, ex. dans une chip).
 * Gemma (local) n'a pas de logo de marque → puce « cpu ».
 */
export function ProviderLogo({
  provider,
  size = 22,
  badge = false,
  round = false,
  style,
}: {
  provider: AgentProvider;
  size?: number;
  badge?: boolean;
  /** Pastille ronde plutôt que carré arrondi. */
  round?: boolean;
  style?: CSSProperties;
}) {
  const inner = Math.round(size * (badge ? 0.66 : 1));
  const img =
    provider === 'gemma' ? (
      <HIcon name="cpu" size={inner} color="var(--accent-text)" />
    ) : (
      <img
        src={LOGO[provider]}
        alt=""
        width={inner}
        height={inner}
        style={{ display: 'block', objectFit: 'contain' }}
      />
    );
  if (!badge) return <span style={{ display: 'inline-flex', ...style }}>{img}</span>;
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: round ? '50%' : size * 0.32,
        flexShrink: 0,
        background: '#fff',
        border: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...style,
      }}
    >
      {img}
    </div>
  );
}
