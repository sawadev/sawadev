import { getConfig } from '../config';
import { getDocker } from '../workspaces/docker';

/**
 * Mise à jour one-click (PLAN.md §6.7 / SPEC §5 quinquies).
 *
 * Un conteneur ne peut pas se recréer proprement lui-même : on lance un
 * conteneur **updater jetable** (via le socket Docker) qui exécute
 * `docker compose pull && up -d` sur caddy + orchestrateur, puis un
 * **health-check** ; en cas d'échec, **rollback** vers l'image précédente.
 * L'updater survit au redémarrage de l'orchestrateur. Les workspaces ne font
 * PAS partie du compose -> jamais interrompus.
 */

const UPDATER_IMAGE = Bun.env.UPDATER_IMAGE ?? 'docker:cli';
const COMPOSE_DIR = Bun.env.COMPOSE_DIR ?? '/opt/sawadev';
const HEALTH_URL = Bun.env.UPDATER_HEALTH_URL ?? 'http://orchestrator:8787/api/health';

/**
 * Script de l'updater : pull + up -d, health-check (30×2s), rollback de
 * l'orchestrateur vers l'image précédente si la sonde ne répond pas.
 */
export function updaterScript(composeDir: string, healthUrl: string): string {
  return [
    'set -e',
    `cd ${composeDir}`,
    // Réfs actuelles AVANT pull (pour rollback).
    'ref=$(docker compose config --images 2>/dev/null | grep -i orchestrator | head -1)',
    'prev=$(docker compose images -q orchestrator 2>/dev/null | head -1)',
    'docker compose pull',
    'docker compose up -d',
    // Health-check : jusqu\'à 60s.
    'ok=0; for i in $(seq 1 30); do',
    `  if wget -q -O- ${healthUrl} >/dev/null 2>&1 || curl -fsS ${healthUrl} >/dev/null 2>&1; then ok=1; break; fi`,
    '  sleep 2',
    'done',
    'if [ "$ok" != "1" ]; then',
    '  echo "health-check KO -> rollback"',
    '  if [ -n "$prev" ] && [ -n "$ref" ]; then',
    '    docker tag "$prev" "$ref" && docker compose up -d --force-recreate orchestrator',
    '  fi',
    '  exit 1',
    'fi',
    'echo "update OK"',
  ].join('\n');
}

/** Commande conteneur (sh -c <script>). */
export function updaterCommand(composeDir: string, healthUrl: string): string[] {
  return ['sh', '-c', updaterScript(composeDir, healthUrl)];
}

/** Lance le conteneur updater jetable (sur le réseau sawadev pour le health-check). */
export async function launchUpdater(): Promise<string> {
  const { dockerNetwork } = getConfig();
  const container = await getDocker().createContainer({
    Image: UPDATER_IMAGE,
    Cmd: updaterCommand(COMPOSE_DIR, HEALTH_URL),
    HostConfig: {
      AutoRemove: true,
      NetworkMode: dockerNetwork,
      Binds: ['/var/run/docker.sock:/var/run/docker.sock', `${COMPOSE_DIR}:${COMPOSE_DIR}`],
    },
    Labels: { 'sawadev.managed': 'true', 'sawadev.role': 'updater' },
  });
  await container.start();
  return container.id;
}
