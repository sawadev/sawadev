/**
 * Migrations idempotentes appliquées au démarrage (PLAN §4).
 * Forward-only : on ajoute des entrées, on ne réécrit jamais les anciennes.
 * Chaque entrée est exécutée une fois puis enregistrée dans schema_migrations.
 */
export interface Migration {
  id: number;
  name: string;
  sql: string;
}

export const MIGRATIONS: Migration[] = [
  {
    id: 1,
    name: 'auth_core',
    sql: /* sql */ `
      CREATE TABLE config (
        key   TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );

      CREATE TABLE app_user (
        id            INTEGER PRIMARY KEY CHECK (id = 1),
        password_hash TEXT NOT NULL,
        created_at    INTEGER NOT NULL
      );

      CREATE TABLE credentials (
        id           TEXT PRIMARY KEY,
        public_key   BLOB NOT NULL,
        counter      INTEGER NOT NULL,
        transports   TEXT,
        label        TEXT,
        created_at   INTEGER NOT NULL,
        last_used_at INTEGER
      );

      CREATE TABLE sessions (
        id         TEXT PRIMARY KEY,
        created_at INTEGER NOT NULL,
        expires_at INTEGER NOT NULL,
        user_agent TEXT,
        ip         TEXT
      );

      CREATE TABLE login_attempts (
        ip           TEXT PRIMARY KEY,
        fails        INTEGER NOT NULL DEFAULT 0,
        banned_until INTEGER
      );
    `,
  },
  {
    id: 2,
    name: 'workspaces',
    sql: /* sql */ `
      CREATE TABLE workspaces (
        id             TEXT PRIMARY KEY,
        name           TEXT NOT NULL,
        image          TEXT NOT NULL,
        container_id   TEXT,
        volume         TEXT NOT NULL,
        lifecycle      TEXT NOT NULL DEFAULT 'always-on',
        created_at     INTEGER NOT NULL,
        last_opened_at INTEGER
      );
    `,
  },
  {
    id: 3,
    name: 'ports',
    sql: /* sql */ `
      CREATE TABLE ports (
        workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
        port         INTEGER NOT NULL,
        subdomain    TEXT NOT NULL UNIQUE,
        PRIMARY KEY (workspace_id, port)
      );
    `,
  },
  {
    id: 4,
    name: 'api_keys',
    sql: /* sql */ `
      CREATE TABLE api_keys (
        provider   TEXT PRIMARY KEY,
        ciphertext BLOB NOT NULL,
        iv         BLOB NOT NULL,
        created_at INTEGER NOT NULL
      );
    `,
  },
  {
    id: 5,
    name: 'workspace_ui_state',
    sql: /* sql */ `
      CREATE TABLE workspace_ui_state (
        workspace_id TEXT PRIMARY KEY REFERENCES workspaces(id) ON DELETE CASCADE,
        state        TEXT NOT NULL,   -- JSON WorkspaceUiState
        updated_at   INTEGER NOT NULL
      );
    `,
  },
  {
    id: 6,
    name: 'quick_actions',
    sql: /* sql */ `
      CREATE TABLE quick_actions (
        id           TEXT PRIMARY KEY,
        workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
        label        TEXT NOT NULL,
        command      TEXT NOT NULL,
        created_at   INTEGER NOT NULL
      );

      CREATE TABLE action_runs (
        id         TEXT PRIMARY KEY,
        action_id  TEXT NOT NULL REFERENCES quick_actions(id) ON DELETE CASCADE,
        status     TEXT NOT NULL,            -- active | done | failed
        exit_code  INTEGER,
        output     TEXT NOT NULL DEFAULT '',
        started_at INTEGER NOT NULL,
        ended_at   INTEGER
      );

      CREATE INDEX idx_action_runs_action ON action_runs(action_id, started_at);
    `,
  },
  {
    id: 7,
    name: 'tools',
    sql: /* sql */ `
      CREATE TABLE tools (
        id           TEXT PRIMARY KEY,
        workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
        type         TEXT NOT NULL,
        name         TEXT NOT NULL,
        status       TEXT NOT NULL,            -- running | stopped
        conn_json    TEXT NOT NULL,            -- JSON ToolConnection
        created_at   INTEGER NOT NULL
      );
    `,
  },
  {
    id: 8,
    name: 'agent_messages',
    sql: /* sql */ `
      CREATE TABLE agent_messages (
        id           TEXT PRIMARY KEY,
        workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
        role         TEXT NOT NULL,            -- user | assistant
        text         TEXT NOT NULL,
        created_at   INTEGER NOT NULL
      );

      CREATE INDEX idx_agent_messages_ws ON agent_messages(workspace_id, created_at);
    `,
  },
  {
    id: 9,
    name: 'agent_messages_provider',
    sql: /* sql */ `
      ALTER TABLE agent_messages ADD COLUMN provider TEXT;
    `,
  },
  {
    id: 10,
    name: 'mcp_tokens',
    sql: /* sql */ `
      CREATE TABLE mcp_tokens (
        workspace_id TEXT PRIMARY KEY REFERENCES workspaces(id) ON DELETE CASCADE,
        token        TEXT NOT NULL UNIQUE,
        created_at   INTEGER NOT NULL
      );
    `,
  },
];
