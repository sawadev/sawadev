import type { ContainerRole, DockerOverview, DockerPort } from '@sawadev/shared';
import { getConfig } from '../config';
import { getDocker } from '../workspaces/docker';

/** Sous-ensemble des résumés dockerode utilisés (facilite le test sans Docker). */
export interface ContainerSummary {
  Id: string;
  Names: string[];
  Image: string;
  State: string;
  Status: string;
  Labels?: Record<string, string>;
  NetworkSettings?: { Networks?: Record<string, unknown> };
  Ports?: { PrivatePort?: number; PublicPort?: number; Type?: string }[];
}
export interface NetworkSummary {
  Id: string;
  Name: string;
  Driver: string;
}

const isSawadevNet = (name: string, configured: string) =>
  name.startsWith('sawadev') || name === configured;

function roleOf(labels: Record<string, string>): ContainerRole {
  const role = labels['sawadev.role'];
  if (role === 'gemma') return 'gemma';
  if (role === 'updater') return 'updater';
  if (labels['sawadev.workspace']) return 'dev';
  if (labels['sawadev.managed'] === 'true') return 'other';
  // Sur un réseau sawadev sans label sawadev → infra (caddy / orchestrateur / proxy).
  return 'infra';
}

function dedupePorts(ports: ContainerSummary['Ports']): DockerPort[] {
  const seen = new Map<number, DockerPort>();
  for (const p of ports ?? []) {
    if (typeof p.PrivatePort !== 'number') continue;
    const existing = seen.get(p.PrivatePort);
    const pub = p.PublicPort || undefined;
    if (!existing || (pub && !existing.public)) {
      seen.set(p.PrivatePort, { private: p.PrivatePort, public: pub });
    }
  }
  return [...seen.values()].sort((a, b) => a.private - b.private);
}

/**
 * Construit l'aperçu à partir des résumés Docker. **Pur** (testable) : ne garde que
 * l'écosystème sawadev (conteneurs sur un réseau sawadev **ou** labellisés `sawadev.managed`).
 */
export function buildOverview(
  containers: ContainerSummary[],
  networks: NetworkSummary[],
  dockerNetwork: string,
): DockerOverview {
  const cs = containers
    .map((c) => {
      const labels = c.Labels ?? {};
      const netNames = Object.keys(c.NetworkSettings?.Networks ?? {});
      const sawaNets = netNames.filter((n) => isSawadevNet(n, dockerNetwork));
      const managed = labels['sawadev.managed'] === 'true';
      if (sawaNets.length === 0 && !managed) return null; // hors écosystème
      return {
        id: c.Id,
        name: (c.Names?.[0] ?? '').replace(/^\//, ''),
        image: c.Image,
        state: c.State,
        status: c.Status,
        role: roleOf(labels),
        workspaceId: labels['sawadev.workspace'] ?? null,
        networks: sawaNets,
        ports: dedupePorts(c.Ports),
      };
    })
    .filter((c): c is NonNullable<typeof c> => c !== null);

  const ns = networks
    .filter((n) => isSawadevNet(n.Name, dockerNetwork))
    .map((n) => ({
      id: n.Id,
      name: n.Name,
      driver: n.Driver,
      containers: cs.filter((c) => c.networks.includes(n.Name)).length,
    }));

  return { networks: ns, containers: cs };
}

/** Aperçu Docker de l'écosystème sawadev (lecture seule). Vide si Docker injoignable. */
export async function getDockerOverview(): Promise<DockerOverview> {
  try {
    const docker = getDocker();
    const [containers, networks] = await Promise.all([
      docker.listContainers({ all: true }),
      docker.listNetworks(),
    ]);
    return buildOverview(
      containers as unknown as ContainerSummary[],
      networks as unknown as NetworkSummary[],
      getConfig().dockerNetwork,
    );
  } catch {
    return { networks: [], containers: [] };
  }
}
