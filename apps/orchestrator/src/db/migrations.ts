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
];
