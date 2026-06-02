/** État d'un service (tool) managé. */
export type ToolStatus = 'running' | 'stopped';

/** Entrée du catalogue de services prêts à lancer. */
export interface ToolType {
  type: string;
  label: string;
  icon: string;
  image: string;
  defaultPort: number;
  description: string;
}

/** Infos de connexion d'un service (affichées dans l'UI ; aussi écrites dans tools.env en M6). */
export interface ToolConnection {
  host: string;
  port: number;
  database?: string;
  username?: string;
  password?: string;
  url?: string;
}

/** Instance de service rattachée à un workspace. */
export interface ToolInstance {
  id: string;
  type: string;
  name: string;
  status: ToolStatus;
  connection: ToolConnection;
  createdAt: number;
}

/** Corps de POST /api/workspaces/:id/tools. */
export interface CreateToolRequest {
  type: string;
}
