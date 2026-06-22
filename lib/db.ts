import { neon } from "@neondatabase/serverless";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set. Did you run `neonctl env pull`?");
}

/**
 * Neon serverless SQL client (queries over HTTP).
 *
 * Use as a tagged template — values are parameterized, so this is safe
 * against SQL injection:
 *
 *   const rows = await sql`SELECT * FROM invoices WHERE id = ${id}`;
 *
 * Works in Server Components, Route Handlers, and Server Actions.
 */
export const sql = neon(process.env.DATABASE_URL);
