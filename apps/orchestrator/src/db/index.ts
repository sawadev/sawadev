import { Database } from 'bun:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { getConfig } from '../config';
import { MIGRATIONS } from './migrations';

let db: Database | null = null;

/** Applique les migrations manquantes dans une transaction. */
function migrate(database: Database): void {
  database.run(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id         INTEGER PRIMARY KEY,
      name       TEXT NOT NULL,
      applied_at INTEGER NOT NULL
    );
  `);
  const applied = new Set(
    database
      .query<{ id: number }, []>('SELECT id FROM schema_migrations')
      .all()
      .map((r) => r.id),
  );
  const now = Date.now();
  const tx = database.transaction((migrations: typeof MIGRATIONS) => {
    for (const m of migrations) {
      if (applied.has(m.id)) continue;
      database.run(m.sql);
      database.run('INSERT INTO schema_migrations (id, name, applied_at) VALUES (?, ?, ?)', [
        m.id,
        m.name,
        now,
      ]);
    }
  });
  tx(MIGRATIONS);
}

/** Ouvre (une fois) la base, crée le dossier au besoin, migre. */
export function getDb(): Database {
  if (db) return db;
  const { dbPath } = getConfig();
  if (dbPath !== ':memory:') mkdirSync(dirname(dbPath), { recursive: true });
  db = new Database(dbPath, { create: true });
  db.run('PRAGMA journal_mode = WAL;');
  db.run('PRAGMA foreign_keys = ON;');
  migrate(db);
  return db;
}

/** Remplace la base courante (tests : injection d'une base :memory:). */
export function setDb(database: Database): void {
  db = database;
  migrate(database);
}

/** Ferme et oublie la base (tests). */
export function closeDb(): void {
  db?.close();
  db = null;
}
