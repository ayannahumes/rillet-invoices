// Minimal forward-only migration runner for Neon Postgres.
//
//   node --env-file=.env.local scripts/migrate.mjs
//
// Applies every *.sql file in db/migrations (sorted by name) that hasn't been
// applied yet. Each migration runs inside a transaction and is recorded in the
// schema_migrations table, so re-running is a no-op.
//
// Uses the WebSocket Pool (not the HTTP client) because migration files contain
// multiple statements, which the HTTP/extended protocol rejects.

import { readdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { Pool, neonConfig } from "@neondatabase/serverless";

neonConfig.webSocketConstructor = globalThis.WebSocket;

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const migrationsDir = join(root, "db", "migrations");

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set. Run `neonctl env pull` first.");
  process.exit(1);
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

try {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name        text PRIMARY KEY,
      applied_at  timestamptz NOT NULL DEFAULT now()
    )
  `);

  const applied = new Set(
    (await pool.query("SELECT name FROM schema_migrations")).rows.map(
      (r) => r.name,
    ),
  );

  const files = (await readdir(migrationsDir))
    .filter((f) => f.endsWith(".sql"))
    .sort();

  let count = 0;
  for (const file of files) {
    if (applied.has(file)) continue;

    const statements = await readFile(join(migrationsDir, file), "utf8");
    console.log(`Applying ${file}...`);

    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(statements);
      await client.query(
        "INSERT INTO schema_migrations (name) VALUES ($1)",
        [file],
      );
      await client.query("COMMIT");
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }

    count++;
  }

  console.log(count ? `Applied ${count} migration(s).` : "Already up to date.");
} finally {
  await pool.end();
}
