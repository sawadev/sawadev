import type { AgentProvider, KeyProvider } from '@sawadev/shared';
import claudeLogo from './assets/providers/claude.png';
import codexLogo from './assets/providers/codex.svg';
import cursorLogo from './assets/providers/cursor.svg';

/** Libellés lisibles des fournisseurs d'agents (BYO clés + Gemma local). */
export const PROVIDER_LABEL: Record<AgentProvider, string> = {
  anthropic: 'Claude Code',
  openai: 'Codex CLI',
  cursor: 'Cursor CLI',
  gemma: 'Gemma (local)',
};

/** URL des logos de marque (résolues par Vite). */
const PROVIDER_LOGO: Record<KeyProvider, string> = {
  anthropic: claudeLogo,
  openai: codexLogo,
  cursor: cursorLogo,
};

/** Logo de marque d'un fournisseur d'agent (assets dans `assets/providers/`). */
export function ProviderLogo({
  provider,
  size = 18,
}: {
  provider: KeyProvider;
  size?: number;
}) {
  return (
    <img
      src={PROVIDER_LOGO[provider]}
      alt={PROVIDER_LABEL[provider]}
      width={size}
      height={size}
      style={{ display: 'block', flexShrink: 0, objectFit: 'contain' }}
    />
  );
}
