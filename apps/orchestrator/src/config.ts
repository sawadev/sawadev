import { resolve } from 'node:path';

/**
 * Configuration d'instance lue depuis l'environnement.
 * Valeurs par défaut adaptées au dev local (macOS / Vite sur :5173).
 */
export interface AppConfig {
  port: number;
  dbPath: string;
  /** Relying Party ID WebAuthn = domaine (sans port). 'localhost' en dev. */
  rpID: string;
  /** Nom affiché dans le prompt passkey. */
  rpName: string;
  /** Origine attendue des réponses WebAuthn (schéma + hôte + port). */
  rpOrigin: string;
  /** Pose le flag Secure sur le cookie de session (HTTPS uniquement). */
  cookieSecure: boolean;
  /** Durée de vie d'une session, en secondes. */
  sessionTtlSec: number;
  /** Échecs de login tolérés avant bannissement de l'IP. */
  maxLoginFails: number;
  /** Durée du bannissement, en secondes. */
  banDurationSec: number;
  /** Image Docker par défaut des workspaces. */
  workspaceImage: string;
  /** Dossier hôte (absolu) contenant les volumes bind des workspaces. */
  workspacesDir: string;
  /** Réseau Docker auquel rattacher les workspaces. */
  dockerNetwork: string;
  /** Domaine de base pour les sous-domaines de preview (ex. example.com). */
  domain: string;
  /** URL de l'API Admin de Caddy (jamais exposée publiquement). */
  caddyAdmin: string;
  /** Schéma des URLs de preview (https en prod, http en dev local). */
  previewScheme: 'http' | 'https';
  /** Dossier du build front à servir (prod). Vide = désactivé (dev Vite). */
  webDist: string;
  /** Inactivité avant arrêt auto d'un workspace 'idle-stop', en secondes. */
  idleTimeoutSec: number;
  /** URL de l'orchestrateur **joignable depuis un conteneur workspace** (serveur MCP). */
  mcpSelfUrl: string;
  /** Modèle Ollama servi par le conteneur Gemma partagé. */
  gemmaModel: string;
  /** URL du conteneur Gemma (Ollama) joignable depuis l'orchestrateur. */
  gemmaUrl: string;
}

function envStr(key: string, fallback: string): string {
  const v = Bun.env[key];
  return v && v.length > 0 ? v : fallback;
}

function envInt(key: string, fallback: number): number {
  const v = Bun.env[key];
  if (!v) return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

let cached: AppConfig | null = null;

export function getConfig(): AppConfig {
  if (cached) return cached;
  const rpOrigin = envStr('RP_ORIGIN', 'http://localhost:5173');
  const domain = envStr('DOMAIN', 'localhost');
  const port = envInt('PORT', 8787);
  cached = {
    port,
    dbPath: envStr('DB_PATH', './data/sawadev.db'),
    rpID: envStr('RP_ID', 'localhost'),
    rpName: envStr('RP_NAME', 'sawadev'),
    rpOrigin,
    cookieSecure: rpOrigin.startsWith('https://'),
    sessionTtlSec: envInt('SESSION_TTL_SEC', 60 * 60 * 24 * 30),
    maxLoginFails: envInt('MAX_LOGIN_FAILS', 5),
    banDurationSec: envInt('BAN_DURATION_SEC', 60 * 15),
    workspaceImage: envStr('WORKSPACE_IMAGE', 'node:20-bookworm-slim'),
    workspacesDir: resolve(envStr('WORKSPACES_DIR', './data/workspaces')),
    dockerNetwork: envStr('DOCKER_NETWORK', 'sawadev_net'),
    domain,
    caddyAdmin: envStr('CADDY_ADMIN', 'http://localhost:2019'),
    previewScheme: envStr('PREVIEW_SCHEME', rpOrigin.startsWith('https://') ? 'https' : 'http') as
      | 'http'
      | 'https',
    webDist: envStr('WEB_DIST', ''),
    idleTimeoutSec: envInt('IDLE_TIMEOUT_SEC', 60 * 30),
    // Dev : orchestrateur sur l'hôte → host.docker.internal ; prod : service `orchestrator` du réseau.
    mcpSelfUrl: envStr(
      'MCP_SELF_URL',
      domain === 'localhost'
        ? `http://host.docker.internal:${port}`
        : `http://orchestrator:${port}`,
    ),
    gemmaModel: envStr('GEMMA_MODEL', 'gemma3:1b'),
    // Dev : port publié sur l'hôte ; prod : DNS du conteneur sur le réseau sawadev.
    gemmaUrl: envStr(
      'GEMMA_URL',
      domain === 'localhost' ? 'http://localhost:11434' : 'http://sawadev-gemma:11434',
    ),
  };
  return cached;
}

/** Réinitialise le cache (tests). */
export function resetConfigCache(): void {
  cached = null;
}
