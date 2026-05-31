/** Canal de mise à jour de l'orchestrateur (SPEC §5 quinquies). */
export type Channel = 'stable' | 'beta';

/** Réponse de GET /api/system/version (PLAN §5.1). */
export interface SystemVersion {
  current: string;
  latest: string;
  channel: Channel;
}
