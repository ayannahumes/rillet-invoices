import { sql } from "@/lib/db";

// Always run at request time — this is a live DB connectivity check.
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [row] = await sql`SELECT 1 AS ok, now() AS server_time`;
    return Response.json({ ok: true, db: row });
  } catch (err) {
    return Response.json(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
