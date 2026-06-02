/** Canal de mise à jour de l'orchestrateur (SPEC §5 quinquies). */
export type Channel = 'stable' | 'beta';

/** Réponse de GET /api/system/version (PLAN §5.1). */
export interface SystemVersion {
  current: string;
  latest: string;
  channel: Channel;
}

/** Rôle d'un conteneur de l'écosystème sawadev. */
export type ContainerRole = 'dev' | 'gemma' | 'updater' | 'infra' | 'other';

export interface DockerPort {
  private: number;
  public?: number;
}

/** Un conteneur de l'écosystème (aperçu lecture seule). */
export interface DockerContainer {
  id: string;
  name: string;
  image: string;
  /** running | exited | created… */
  state: string;
  /** Texte lisible (« Up 3 hours »). */
  status: string;
  role: ContainerRole;
  workspaceId: string | null;
  /** Noms des réseaux sawadev auxquels le conteneur est attaché. */
  networks: string[];
  ports: DockerPort[];
}

export interface DockerNetwork {
  id: string;
  name: string;
  driver: string;
  containers: number;
}

/** Réponse de GET /api/system/docker (lecture seule). */
export interface DockerOverview {
  networks: DockerNetwork[];
  containers: DockerContainer[];
}
