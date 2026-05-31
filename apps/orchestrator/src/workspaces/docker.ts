import Docker from 'dockerode';
import { getConfig } from '../config';

/** Labels posés sur tout conteneur géré par sawadev (filtrage strict). */
export const MANAGED_LABEL = 'sawadev.managed';
export const WORKSPACE_LABEL = 'sawadev.workspace';

let docker: Docker | null = null;

export function getDocker(): Docker {
  if (!docker) docker = new Docker();
  return docker;
}

/** Permet d'injecter un client mocké en test. */
export function setDocker(d: Docker): void {
  docker = d;
}

export function containerName(workspaceId: string): string {
  return `sawadev-ws-${workspaceId}`;
}

/** Crée le réseau Docker dédié s'il n'existe pas encore. */
export async function ensureNetwork(): Promise<void> {
  const { dockerNetwork } = getConfig();
  const nets = await getDocker().listNetworks({ filters: { name: [dockerNetwork] } });
  if (nets.some((n) => n.Name === dockerNetwork)) return;
  await getDocker().createNetwork({ Name: dockerNetwork, Driver: 'bridge' });
}

/**
 * Récupère le conteneur d'un workspace **en vérifiant son label** : on ne
 * renvoie jamais un conteneur qui n'est pas géré par sawadev.
 * @returns le handle dockerode, ou null si absent / non géré.
 */
export async function getManagedContainer(workspaceId: string) {
  const containers = await getDocker().listContainers({
    all: true,
    filters: {
      label: [`${MANAGED_LABEL}=true`, `${WORKSPACE_LABEL}=${workspaceId}`],
    },
  });
  const info = containers[0];
  if (!info) return null;
  return getDocker().getContainer(info.Id);
}
