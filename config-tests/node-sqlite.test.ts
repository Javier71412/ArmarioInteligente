/**
 * Spike #4 (ADR 0002): node:sqlite must work inside Jest 30 + jest-expo,
 * because repository and migration tests run on it instead of expo-sqlite.
 * API: https://nodejs.org/docs/latest-v24.x/api/sqlite.html (DatabaseSync, prepare().run/all/get).
 */
import { DatabaseSync } from 'node:sqlite';

function openMemoryDb() {
  const db = new DatabaseSync(':memory:');
  db.exec(
    'CREATE TABLE garment (id INTEGER PRIMARY KEY, name TEXT NOT NULL, warmth INTEGER NOT NULL)',
  );
  return db;
}

test('run() inserts and reports changes and lastInsertRowid', () => {
  const db = openMemoryDb();

  const result = db
    .prepare('INSERT INTO garment (name, warmth) VALUES (?, ?)')
    .run('Jersey azul', 3);

  expect(result.changes).toBe(1);
  expect(result.lastInsertRowid).toBe(1);
});

test('all() returns every row and get() the first one or undefined', () => {
  const db = openMemoryDb();
  const insert = db.prepare('INSERT INTO garment (name, warmth) VALUES (?, ?)');
  insert.run('Camiseta', 1);
  insert.run('Abrigo', 5);

  const rows = db.prepare('SELECT name, warmth FROM garment ORDER BY warmth').all();
  const warmest = db.prepare('SELECT name FROM garment WHERE warmth > ?').get(4);
  const missing = db.prepare('SELECT name FROM garment WHERE warmth > ?').get(9);

  expect(rows).toEqual([
    { name: 'Camiseta', warmth: 1 },
    { name: 'Abrigo', warmth: 5 },
  ]);
  expect(warmest).toEqual({ name: 'Abrigo' });
  expect(missing).toBeUndefined();
});

test('PRAGMA user_version can be read and written (migration runner)', () => {
  const db = openMemoryDb();

  db.exec('PRAGMA user_version = 3');

  expect(db.prepare('PRAGMA user_version').get()).toEqual({ user_version: 3 });
});

test('a failed transaction rolls back (migration stays at N-1)', () => {
  const db = openMemoryDb();

  db.exec('BEGIN');
  db.prepare('INSERT INTO garment (name, warmth) VALUES (?, ?)').run('Bufanda', 2);
  expect(() => db.exec('INSERT INTO missing_table VALUES (1)')).toThrow(/no such table/);
  db.exec('ROLLBACK');

  expect(db.prepare('SELECT COUNT(*) AS n FROM garment').get()).toEqual({ n: 0 });
});

test('reports the bundled SQLite version', () => {
  const db = openMemoryDb();

  const row = db.prepare('SELECT sqlite_version() AS version').get() as { version: string };

  expect(row.version).toMatch(/^3\.\d+\.\d+$/);
});
