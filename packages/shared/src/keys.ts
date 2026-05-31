/** Fournisseurs d'agents connus (clés BYO). */
export type KeyProvider = 'anthropic' | 'openai' | 'cursor';

/** État d'une clé API — la valeur n'est JAMAIS renvoyée au client. */
export interface ApiKeyStatus {
  provider: KeyProvider;
  connected: boolean;
}

/** Corps de PUT /api/settings/keys. */
export interface SetApiKeyRequest {
  provider: KeyProvider;
  key: string;
}
