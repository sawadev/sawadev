import { getDocker } from '../workspaces/docker';

/**
 * Mise à jour one-click (PLAN.md §6.7 / SPEC §5 quinquies).
 *
 * Un conteneur ne peut pas se recréer proprement lui-même : on lance un
 * conteneur **updater jetable** (via le socket Docker) qui exécute
 * `docker compose pull && docker compose up -d` sur caddy + orchestrateur.
 * L'updater survit au redémarrage de l'orchestrateur. Health-check + rollback
 * sont pilotés par le script embarqué dans l'image updater.
 *
 * Les workspaces ne font PAS partie du compose -> jamais interrompus.
 */

const UPDATER_IMAGE = Bun.env.UPDATER_IMAGE ?? 'docker:cli';
const COMPOSE_DIR = Bun.env.COMPOSE_DIR ?? '/opt/sawadev';

/** Commande exécutée par l'updater (pull + up -d du compose sawadev). */
export function updaterCommand(composeDir: string): string[] {
  return [
    'sh',
    '-lc',
    `cd ${composeDir} && docker compose pull && docker compose up -d caddy orchestrator`,
  ];
}

/** Lance le conteneur updater jetable. Renvoie son id. */
export async function launchUpdater(): Promise<string> {
  const docker = getDocker();
  const container = await docker.createContainer({
    Image: UPDATER_IMAGE,
    Cmd: updaterCommand(COMPOSE_DIR),
    HostConfig: {
      AutoRemove: true,
      Binds: ['/var/run/docker.sock:/var/run/docker.sock', `${COMPOSE_DIR}:${COMPOSE_DIR}`],
    },
    Labels: { 'sawadev.managed': 'true', 'sawadev.role': 'updater' },
  });
  await container.start();
  return container.id;
}
