# Rillet Invoice Workspace

A CRUD invoice workspace for an accounting manager: create, review, edit, void,
and delete customer invoices while keeping the data trustworthy and audit-ready.
The interface aims to feel like serious finance software — precise, calm, dense
without clutter, and easy to scan.

**Point of view: calm by default, depth on demand.** The list surfaces only what
you need to triage and trust (status, due-date risk, amount); detail and history
reveal themselves when you ask for them.

---

## Live app

**▶ [rillet-invoices.vercel.app](https://rillet-invoices.vercel.app)**

To run it yourself, see **Run locally** below.

## What to try (≈2-minute tour)

The seed data is authored so the triage states are visible immediately.

1. **The list** — rows are sorted by triage priority (overdue → due-soon →
   active → paid → void), and the cards up top show **Outstanding and Overdue
   grouped by currency** (USD and CAD are never summed together). Risk is the
   only thing in color.
2. **Open an overdue invoice** — see line items, the **totals breakdown**
   (subtotal → discount → tax → total, all derived), both statuses, customer
   details, memo, and a collapsed **activity log**.
3. **Create one** (New invoice) — watch totals recompute live as you type; enter
   tax as a percent (e.g. `8.5`); leave a required field empty and tab away to
   see it flag red on blur, or submit to flag all and jump focus to the first.
4. **Edit it** — change fields or add/remove line items; totals follow.
5. **The signature decision — void vs. delete.** On a **draft**, the action is
   **Delete** (it never went out). On a **sent/paid** invoice, the only
   destructive action is **Void** — it keeps the record and writes an activity
   entry, because deleting an issued invoice would destroy the audit trail. Both
   ask for confirmation in a focus-trapped dialog.
6. **Switch your OS to dark mode** and **shrink to a phone width** — both adapt
   (no horizontal scroll; the table becomes stacked cards).

## Run locally

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

## Design decisions (and why they fit a finance workflow)

An accounting manager needs to **trust the numbers, triage fast, and never
corrupt the record.** Every choice below maps to one of those needs.

- **One accent, reserved for risk.** Warm grayscale throughout; the only color
  (overdue red / due-soon amber) marks *due-date risk* and nothing else.
  Lifecycle status is encoded by weight, border, and strikethrough instead.
  *Why it fits:* in an audit-sensitive tool, color has to mean "look here" — if
  everything is colored, nothing is — so the lone accent always points at what's
  financially urgent.
- **Four signals kept visually distinct** — lifecycle status, payment status,
  due-date risk, and amount each render differently (`StatusBadge`, payment text,
  `DueDisplay`, right-aligned tabular figures). *Why it fits:* an accountant
  reasons about these independently ("sent, unpaid, and now overdue"); collapsing
  them would hide state they need to act on.
- **Triage-first list.** Sorted overdue → due-soon → active → paid → void, led by
  Outstanding/Overdue totals **grouped by currency** (never summed across — you
  can't add CAD to USD). *Why it fits:* it answers the manager's first question —
  what needs attention and how much is at risk — before any scrolling.
- **Void vs. delete, enforced server-side.** A draft can be **deleted** (it never
  went out); an issued invoice can only be **voided** — the row and number are
  kept and an activity entry is written. *Why it fits:* deleting a sent invoice
  destroys the audit trail, so the workflow makes that impossible, not just
  discouraged.
- **Mistake-resistant forms.** Fields validate on blur (a bad field gets a red
  border as you leave it) and again on submit, which sends focus to the first
  error; totals recompute live; tax is entered as a percent (stored as a
  fraction); destructive actions confirm first; and submit is disabled +
  re-entry-guarded so an action can't fire twice. *Why it fits:* invoice data is
  high-stakes and repetitive — the form should make the wrong number hard to
  enter.
- **Totals derived, never stored.** Subtotal → discount → tax → total are
  recomputed from the inputs on every render and rounded to cents. *Why it fits:*
  a stored total that silently drifts from its line items is exactly the
  untrustworthy number this user can't tolerate.

## Technical decisions

- **Next.js (App Router) + React + TypeScript.** Server Components fetch invoice
  data directly; **Server Actions** handle create/update/delete/void, so
  mutations update the UI without a full refresh (`revalidatePath` +
  client-side `router` navigation).
- **Persistence: Postgres, single-model.** One `invoices` table queried with
  parameterized SQL via `@neondatabase/serverless`. Customer details are inline
  columns; line items and activity/history are embedded `jsonb`. This matches
  the brief's "single-model" guidance and keeps reads simple — the tradeoff is
  that line items aren't independently queryable, fine at this scope.
  Forward-only SQL migrations live in `db/migrations/`; schema and seed are
  trivial to inspect.
- **Validation at the boundary.** `validateInvoiceForm` (a tested pure function)
  runs inside the Server Actions, not just the form, and the data layer enforces
  state invariants (only drafts deletable; only non-draft/non-void voidable)
  with clear errors. Totals are recomputed server-trusted, never read from the
  client.
- **Accessibility.** Field/label association and error wiring (`aria-invalid` +
  `aria-describedby`), a focus-trapped confirm dialog that restores focus and
  makes the rest of the page `inert`, accessible tables (`scope`, captions), a
  global keyboard focus ring, and WCAG-AA-verified contrast in both light and a
  `prefers-color-scheme` **dark mode** (all color centralized as design tokens
  in `app/globals.css`). Action results post to persistent polite/assertive
  live regions and name the invoice (e.g. "Invoice INV-2026-0412 voided"), so
  screen-reader users get the confirmation too.
- **State coverage.** Calm loading skeletons (route-scoped, so clicking into an
  invoice keeps you on the list until the detail is ready), an empty state, a
  runtime DB-error boundary, and confirm-before-destroy.
- **Testing (Vitest + Testing Library).** 74 tests, scoped to business logic and
  key interactions — totals math, due-date risk, triage sort, validation,
  percent conversion, the delete/void invariants, and the Server Actions — plus
  interaction tests (the confirm dialog's resolve/cancel/Escape/focus/inert
  contract, and the form's on-blur errors, double-submit guard, and
  submit/navigate flow) via happy-dom.

## Data model

A single `Invoice` (see [`db/migrations/0001_init.sql`](db/migrations/0001_init.sql)):
identity + embedded customer/billing fields, `status` (lifecycle) and
`payment_status` (distinct dimensions), `currency`, issue/due/paid dates, `memo`,
`tax_rate`, `discount`, plus embedded `line_items` and `activity` (`jsonb`).
Derived totals are never columns.

## Tradeoffs & what's next

Intentionally out of scope for this build, in rough priority order:

- **LLM Invoice Assistant** (the bonus) — paste messy text → structured,
  human-reviewed draft. Walled off behind "core excellent first."
- **Filtering / search UI** beyond the smart default sort.
- **FX / base-currency consolidation** — currencies are shown natively and never
  summed across; a USD-base rollup with live rates is the next step.
- **Dedicated lifecycle transitions** (Send, Mark Paid) as first-class actions.
- **Void reason capture** + richer audit entries (current void writes a minimal
  activity entry).
- **Schema-based validation** (e.g. Zod) and a **full a11y audit** — today's
  validation is a tested pure function and a11y covers the main flows.

Also intentional: **single tenant, no auth** (per the brief); **embedded line
items** trade queryability for model simplicity; the detail page's secondary
dates footer shows the due date as a plain date while the primary "Due" field
carries the full risk treatment.
