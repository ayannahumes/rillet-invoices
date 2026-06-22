# Rillet Invoice Workspace

A CRUD invoice workspace for an accounting manager: create, review, edit, and
delete customer invoices while keeping the data trustworthy and audit-ready. The
interface aims to feel like serious finance software — precise, calm, dense
without clutter, and easy to scan.

## Running it locally

Prerequisites: Node 20+ and a Postgres database (built against
[Neon](https://neon.tech) serverless, but any Postgres works).

```bash
npm install

# 1. Point at a database. Copy the example and fill in your connection string:
cp .env.example .env.local        # then edit DATABASE_URL

# 2. Create the schema and load the sample invoices:
npm run db:migrate
npm run db:seed

# 3. Run it:
npm run dev                       # http://localhost:3000
```

Other scripts: `npm run build` / `npm start` (production), `npm test` (Vitest),
`npm run test:watch`.

> The dev server reads `.env.local`; the migrate/seed scripts run with
> `node --env-file=.env.local`. Both fail loudly if `DATABASE_URL` is unset.

## Design decisions

**One accent, reserved for risk.** The palette is warm grayscale with a single
chromatic accent used *only* for due-date risk (overdue red, due-soon amber).
Lifecycle status (Draft/Sent/Paid/Void) is encoded with weight, border, and
strikethrough — never color — so the one accent that does appear is unmissable.
For an audit-sensitive tool that restraint is the point: color means "look
here," and it never cries wolf.

**Status, payment, due-date risk, and amount are visually distinct.** These are
four separate signals and the list keeps them separate: a `StatusBadge`
(lifecycle), the payment status, a `DueDisplay`/`RiskCell` that surfaces risk in
words *and* color, and right-aligned tabular-figure amounts. Voided rows strike
the customer name and amount and drop the due date to "—"; drafts show "Not
sent," because an unissued invoice has no deadline yet.

**Triage-first list.** The list sorts by triage priority (overdue → due-soon →
active → paid → void) and leads with per-currency Outstanding and Overdue
totals, so the busiest question — "what needs attention and how much is at
risk" — is answered before any scrolling. Currencies are never summed together.

**Forms that prevent mistakes.** Inline validation with field-associated errors,
focus jumps to the first invalid field on submit, live-recomputed totals as you
type, and a confirmation step for destructive actions. Delete is only offered
for drafts; issued invoices are *voided* (kept on file) so the audit trail is
never broken — and that rule is enforced in the backend, not just the UI.

**Totals are always derived, never stored.** Subtotal, tax, and total are
recomputed from line items + discount + tax rate on every render, rounded to
cents at each step. Persisting them would risk drift between the stored number
and the inputs.

## Technical decisions

- **Next.js (App Router) + React + TypeScript.** Server Components fetch invoice
  data directly; **Server Actions** handle create/update/delete/void, so
  mutations update the UI without a full refresh (`revalidatePath` +
  client-side `router` navigation).
- **Persistence: Postgres, single-model.** One `invoices` table. Customer
  details are inline columns; line items and activity/history are embedded
  `jsonb`. This matches the brief's "single-model" guidance and keeps reads
  simple — the tradeoff is that line items aren't independently queryable, which
  is fine at this scope. Forward-only SQL migrations live in `db/migrations/`;
  schema and seed are trivial to inspect.
- **Validation at the boundary.** `validateInvoiceForm` runs inside the Server
  Actions (not just the form), and the data layer enforces state invariants
  (only drafts deletable, only non-draft/non-void voidable) with clear errors.
- **Accessibility.** Field/label association and error wiring (`aria-invalid` +
  `aria-describedby`), a focus-trapped confirm dialog that returns focus and
  makes the rest of the page `inert`, accessible tables (`scope`, captions), a
  global keyboard focus ring, and WCAG-AA-verified contrast in both light and a
  `prefers-color-scheme` **dark mode** (all color is centralized as design
  tokens in `app/globals.css`).
- **Testing (Vitest).** ~70 tests covering the logic that must not break —
  totals math, due-date risk, triage sort, validation, the delete/void
  invariants, the Server Actions — plus interaction tests (the confirm dialog's
  resolve/cancel/Escape/focus/inert contract, and the form's
  validation/focus/submit flow) via Testing Library + happy-dom.

## Data model

A single `Invoice` (see `db/migrations/0001_init.sql`): identity + embedded
customer/billing fields, `status` (lifecycle) and `payment_status` (distinct
dimensions), `currency`, issue/due/paid dates, `memo`, `tax_rate`, `discount`,
plus embedded `line_items` and `activity` (`jsonb`). Derived totals are never
columns.

## Tradeoffs & what's intentionally unfinished

- **LLM Invoice Assistant (bonus): not implemented.** The CRUD workflow, craft,
  and correctness were prioritized over breadth.
- **Single tenant, no auth** — per the brief.
- **Embedded line items** trade queryability for model simplicity (intentional).
- The detail page's secondary dates footer shows the due date as a plain date
  (no risk accent), while the primary "Due" field carries the full risk
  treatment — deliberate, to keep the footer a neutral facts list.
