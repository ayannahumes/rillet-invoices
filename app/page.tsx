import { Suspense } from "react";
import Link from "next/link";
import { listInvoices, type PaymentStatus } from "@/lib/invoices";
import { calculateInvoiceTotal } from "@/lib/calculateInvoiceTotal";
import { getDueDateRisk } from "@/lib/getDueDateRisk";
import { sortByTriage } from "@/lib/sortByTriage";
import { CURRENT_DATE } from "@/lib/currentDate";
import { formatMoney, formatDate } from "@/lib/format";
import { StatusBadge } from "@/components/StatusBadge";
import { RiskCell } from "@/components/RiskCell";
import { InvoiceRow } from "@/components/InvoiceRow";
import { maybeDelay } from "@/lib/devDelay";

// Always query per request — the invoices list is live data, and this is also
// what lets a runtime DB failure surface to app/error.tsx instead of being
// frozen into a build-time prerender.
export const dynamic = "force-dynamic";

// "Outstanding" = issued and awaiting payment (sent & unpaid). Excludes drafts,
// paid, and void.
const OUTSTANDING_STATUSES: PaymentStatus[] = ["Open", "Overdue"];

function sumByCurrency(
  items: { currency: string; amount: number }[],
): Map<string, number> {
  const totals = new Map<string, number>();
  for (const { currency, amount } of items) {
    totals.set(currency, (totals.get(currency) ?? 0) + amount);
  }
  return totals;
}

function formatCurrencyTotals(totals: Map<string, number>): string {
  if (totals.size === 0) return "—";
  return [...totals.entries()]
    .map(([currency, amount]) => formatMoney(amount, currency))
    .join(" · ");
}

// Shimmer fallback for the body only (the header renders instantly). As an
// in-page Suspense boundary this streams on the initial/hard load (and refresh)
// but is preserved during client navigations, so returning to the list does
// NOT re-show the skeleton. The `skeleton` class delays the reveal ~400ms so
// fast loads don't flash it.
function InvoiceListSkeleton() {
  return (
    <div className="skeleton">
      <div className="mt-8 flex flex-wrap gap-x-16 gap-y-6">
        {[0, 1].map((i) => (
          <div key={i} className="space-y-2">
            <div className="h-3 w-20 shimmer rounded" />
            <div className="h-6 w-36 shimmer rounded" />
          </div>
        ))}
      </div>
      <div className="mt-10 overflow-hidden rounded-lg border border-line bg-surface">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-6 border-b border-line px-5 py-4 last:border-0"
          >
            <div className="flex-1 space-y-2">
              <div className="h-4 w-40 shimmer rounded" />
              <div className="h-3 w-24 shimmer rounded" />
            </div>
            <div className="h-4 w-16 shimmer rounded" />
            <div className="h-4 w-32 shimmer rounded" />
            <div className="h-4 w-24 shimmer rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

async function InvoiceListBody() {
  await maybeDelay(); // dev-only: SLOW_MS=2500 npm run start
  const invoices = await listInvoices();

  if (invoices.length === 0) {
    return <p className="mt-8 text-muted">No invoices yet.</p>;
  }

  // Fixed default order: triage priority (overdue → due-soon → active/ok →
  // paid → void), using each row's already-computed risk.
  const rows = sortByTriage(
    invoices.map((invoice) => ({
      invoice,
      totals: calculateInvoiceTotal(invoice),
      risk: getDueDateRisk(invoice, CURRENT_DATE),
    })),
  );

  const outstanding = sumByCurrency(
    rows
      .filter((r) => OUTSTANDING_STATUSES.includes(r.invoice.paymentStatus))
      .map((r) => ({ currency: r.invoice.currency, amount: r.totals.total })),
  );

  const overdueRows = rows.filter((r) => r.risk.level === "overdue");
  const overdue = sumByCurrency(
    overdueRows.map((r) => ({
      currency: r.invoice.currency,
      amount: r.totals.total,
    })),
  );

  return (
    <>
      <section className="mt-8 flex flex-wrap gap-x-16 gap-y-6">
        <div>
          <div className="text-xs uppercase tracking-wider text-faint">
            Outstanding
          </div>
          <div className="mt-1 text-xl text-ink tabular-nums">
            {formatCurrencyTotals(outstanding)}
          </div>
        </div>
        <div>
          <div className="text-xs uppercase tracking-wider text-faint">
            Overdue
          </div>
          <div className="mt-1 text-xl tabular-nums">
            <span className={overdueRows.length > 0 ? "text-overdue" : "text-ink"}>
              {overdueRows.length} invoice{overdueRows.length === 1 ? "" : "s"}
            </span>
            {overdueRows.length > 0 && (
              <span className="text-muted">
                {" · "}
                {formatCurrencyTotals(overdue)}
              </span>
            )}
          </div>
        </div>
      </section>

      <div className="mt-10 overflow-x-auto rounded-lg border border-line bg-surface">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs uppercase tracking-wider text-faint">
              <th className="px-5 py-3 font-medium">Customer</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium">Due / risk</th>
              <th className="px-5 py-3 text-right font-medium">Amount</th>
              <th className="px-5 py-3 font-medium">Updated</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ invoice, totals, risk }) => (
              <InvoiceRow key={invoice.id} href={`/invoices/${invoice.id}`}>
                <td className="px-5 py-4">
                  <Link
                    href={`/invoices/${invoice.id}`}
                    className="text-ink hover:underline"
                  >
                    {invoice.customerName}
                  </Link>
                  <div className="text-xs text-faint">
                    {invoice.invoiceNumber}
                  </div>
                </td>
                <td className="px-5 py-4">
                  <StatusBadge status={invoice.status} />
                </td>
                <td className="px-5 py-4">
                  <RiskCell risk={risk} dueDate={invoice.dueDate} />
                </td>
                <td className="px-5 py-4 text-right text-ink tabular-nums">
                  {formatMoney(totals.total, invoice.currency)}
                </td>
                <td className="px-5 py-4 text-muted">
                  {formatDate(invoice.updatedAt)}
                </td>
              </InvoiceRow>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

export default function Home() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-10 md:px-8">
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-serif text-4xl font-medium text-ink">Invoices</h1>
        <Link
          href="/invoices/new"
          className="rounded border border-line px-4 py-2 text-sm text-ink transition-colors hover:bg-surface"
        >
          New invoice
        </Link>
      </div>

      <Suspense fallback={<InvoiceListSkeleton />}>
        <InvoiceListBody />
      </Suspense>
    </main>
  );
}
