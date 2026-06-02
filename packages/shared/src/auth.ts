/** État d'authentification renvoyé par GET /api/auth/state. */
export interface AuthState {
  /** Vrai si le mot de passe admin a déjà été défini (1ère install faite). */
  setupDone: boolean;
  /** Vrai si la requête courante porte une session valide. */
  authenticated: boolean;
  /** Vrai si au moins une passkey est enregistrée. */
  hasPasskey: boolean;
}

/** Corps de POST /api/auth/setup et /api/auth/login. */
export interface PasswordRequest {
  password: string;
}

/** Corps de POST /api/auth/password (changement de mot de passe, session requise). */
export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

/** Réponse générique d'une action d'auth réussie. */
export interface AuthResult {
  authenticated: true;
}

/**
 * Les échanges WebAuthn transportent les objets JSON natifs de l'API
 * (PublicKeyCredentialCreationOptionsJSON, etc.). On les type côté front via
 * `@simplewebauthn/browser` ; ici on n'expose que l'enveloppe applicative.
 */
export interface PasskeyRegisterVerifyRequest {
  label?: string;
  // `response` = RegistrationResponseJSON (typé par @simplewebauthn côté front)
  response: unknown;
}

export interface PasskeyLoginVerifyRequest {
  // `response` = AuthenticationResponseJSON
  response: unknown;
}

/** Erreur d'auth normalisée renvoyée au client. */
export interface AuthError {
  error: string;
  /** Présent en cas de bannissement : secondes restantes. */
  retryAfter?: number;
}

/** Une passkey enregistrée (jamais la clé publique brute). */
export interface PasskeyInfo {
  id: string;
  label: string | null;
  createdAt: number;
  lastUsedAt: number | null;
}
