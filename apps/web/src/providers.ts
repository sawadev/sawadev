import type { KeyProvider } from '@sawadev/shared';

/** Libellés lisibles des fournisseurs d'agents (BYO clés). */
export const PROVIDER_LABEL: Record<KeyProvider, string> = {
  anthropic: 'Anthropic · Claude Code',
  openai: 'OpenAI · Codex CLI',
  cursor: 'Cursor CLI',
};
