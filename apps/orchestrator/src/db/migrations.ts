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
];
