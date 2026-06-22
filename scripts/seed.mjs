// Seed invoices from db/seed/invoices.json.
//
//   node --env-file=.env.local scripts/seed.mjs
//
// Idempotent: upserts on the unique invoice_number, so re-running refreshes the
// rows rather than duplicating them. The JSON's top-level `id` (e.g.
// "inv-2026-0412") is not a uuid, so the database generates the uuid primary key
// and invoice_number is the stable seed key.

import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { neon } from "@neondatabase/serverless";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set. Run `neonctl env pull` first.");
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);

const { invoices } = JSON.parse(
  await readFile(join(root, "db", "seed", "invoices.json"), "utf8"),
);

let count = 0;
for (const inv of invoices) {
  await sql`
    INSERT INTO invoices (
      invoice_number, customer_name, billing_email, billing_address,
      payment_terms, status, payment_status, currency,
      issue_date, due_date, paid_date, memo, tax_rate, discount,
      line_items, activity
    ) VALUES (
      ${inv.invoiceNumber}, ${inv.customerName}, ${inv.billingEmail ?? null}, ${inv.billingAddress ?? null},
      ${inv.paymentTerms ?? null}, ${inv.status}, ${inv.paymentStatus}, ${inv.currency},
      ${inv.issueDate}, ${inv.dueDate ?? null}, ${inv.paidDate ?? null}, ${inv.memo ?? null},
      ${inv.taxRate ?? 0}, ${inv.discount ?? 0},
      ${JSON.stringify(inv.lineItems ?? [])}::jsonb, ${JSON.stringify(inv.activity ?? [])}::jsonb
    )
    ON CONFLICT (invoice_number) DO UPDATE SET
      customer_name   = EXCLUDED.customer_name,
      billing_email   = EXCLUDED.billing_email,
      billing_address = EXCLUDED.billing_address,
      payment_terms   = EXCLUDED.payment_terms,
      status          = EXCLUDED.status,
      payment_status  = EXCLUDED.payment_status,
      currency        = EXCLUDED.currency,
      issue_date      = EXCLUDED.issue_date,
      due_date        = EXCLUDED.due_date,
      paid_date       = EXCLUDED.paid_date,
      memo            = EXCLUDED.memo,
      tax_rate        = EXCLUDED.tax_rate,
      discount        = EXCLUDED.discount,
      line_items      = EXCLUDED.line_items,
      activity        = EXCLUDED.activity,
      updated_at      = now()
  `;
  count++;
}

console.log(`Seeded ${count} invoice(s).`);
