/** Un port exposé d'un workspace, routé vers un sous-domaine de preview. */
export interface Port {
  workspaceId: string;
  port: number;
  /** Sous-domaine alloué (ex. 'storefront-3000'). */
  subdomain: string;
  /** URL publique complète (ex. 'https://storefront-3000.example.com'). */
  url: string;
}

/** Corps de POST /api/workspaces/:id/ports. */
export interface CreatePortRequest {
  port: number;
}
