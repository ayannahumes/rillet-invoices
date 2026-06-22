import { Suspense } from "react";
import Link from "next/link";
import { listInvoices, type PaymentStatus } from "@/lib/invoices";
import { calculateInvoiceTotal } from "@/lib/calculateInvoiceTotal";
import { getDueDateRisk } from "@/lib/getDueDateRisk";
import { sortByTriage } from "@/lib/sortByTriage";
import { CURRENT_DATE } from "@/lib/currentDate";
import { sumByCurrency } from "@/lib/sumByCurrency";
import { formatMoney, formatDate } from "@/lib/format";
import { StatusBadge } from "@/components/StatusBadge";
import { DueDisplay } from "@/components/DueDisplay";
import { InvoiceRow } from "@/components/InvoiceRow";
import { InvoicesHeader } from "@/components/InvoicesHeader";
import { InvoiceListSkeleton } from "@/components/InvoiceListSkeleton";
import { PageShell } from "@/components/ui/PageShell";
import { Card } from "@/components/ui/Card";
import { StatCard } from "@/components/StatCard";
import { maybeDelay } from "@/lib/devDelay";

// Always query per request — the invoices list is live data, and this is also
// what lets a runtime DB failure surface to app/error.tsx instead of being
// frozen into a build-time prerender.
export const dynamic = "force-dynamic";

// "Outstanding" = issued and awaiting payment (sent & unpaid). Excludes drafts,
// paid, and void.
const OUTSTANDING_STATUSES: PaymentStatus[] = ["Open", "Overdue"];

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

  const outstandingEntries = [...outstanding.entries()];
  const overdueEntries = [...overdue.entries()];

  return (
    <>
      <section className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {outstandingEntries.length === 0 ? (
          <StatCard label="Outstanding" value="—" valueLabel="None" />
        ) : (
          outstandingEntries.map(([currency, amount]) => (
            <StatCard
              key={`outstanding-${currency}`}
              label={
                <>
                  Outstanding <span aria-hidden="true">·</span> {currency}
                </>
              }
              value={formatMoney(amount, currency)}
            />
          ))
        )}
        {overdueEntries.length === 0 ? (
          <StatCard label="Overdue" value="—" valueLabel="None" />
        ) : (
          overdueEntries.map(([currency, amount]) => (
            <StatCard
              key={`overdue-${currency}`}
              label={
                overdueEntries.length > 1 ? (
                  <>
                    Overdue <span aria-hidden="true">·</span> {currency}
                  </>
                ) : (
                  "Overdue"
                )
              }
              value={formatMoney(amount, currency)}
              tone="overdue"
            />
          ))
        )}
      </section>

      <Card className="mt-10 overflow-hidden">
        {/* Mobile: stacked cards (no horizontal scroll). */}
        <ul className="divide-y divide-line sm:hidden">
          {rows.map(({ invoice, totals, risk }) => {
            // A voided invoice is cancelled: strike its name and amount, and
            // show no due date (passing null gives RiskCell's accessible dash).
            const isVoid = invoice.status === "Void";
            return (
              <li key={invoice.id}>
                <Link
                  href={`/invoices/${invoice.id}`}
                  className="block px-5 py-4 hover:bg-bg"
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <div className="min-w-0">
                      <div
                        className={`truncate ${isVoid ? "text-faint line-through" : "text-ink"}`}
                      >
                        {invoice.customerName}
                      </div>
                      <div className="text-xs text-faint">
                        {invoice.invoiceNumber}
                      </div>
                    </div>
                    <div
                      className={`shrink-0 text-right tabular-nums ${isVoid ? "text-faint line-through" : "text-ink"}`}
                    >
                      {formatMoney(totals.total, invoice.currency)}
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
                    <StatusBadge status={invoice.status} />
                    <span className="text-xs">
                      <DueDisplay
                        status={invoice.status}
                        risk={risk}
                        dueDate={invoice.dueDate}
                      />
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-faint">
                    Updated {formatDate(invoice.updatedAt)}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>

        {/* sm and up: full data table. */}
        <table className="hidden w-full text-sm sm:table">
          <caption className="sr-only">Invoices</caption>
          <thead>
            <tr className="border-b border-line text-left text-xs uppercase tracking-wider text-faint">
              <th scope="col" className="px-5 py-3 font-medium">
                Customer
              </th>
              <th scope="col" className="px-5 py-3 font-medium">
                Status
              </th>
              <th scope="col" className="px-5 py-3 font-medium">
                Due / risk
              </th>
              <th scope="col" className="px-5 py-3 text-right font-medium">
                Amount
              </th>
              <th scope="col" className="px-5 py-3 font-medium">
                Updated
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ invoice, totals, risk }) => {
              // A voided invoice is cancelled: strike its name and amount, and
              // show no due date (passing null gives RiskCell's accessible dash).
              const isVoid = invoice.status === "Void";
              return (
                <InvoiceRow key={invoice.id} href={`/invoices/${invoice.id}`}>
                  <td className="px-5 py-4">
                    <Link
                      href={`/invoices/${invoice.id}`}
                      className={`hover:underline ${isVoid ? "text-faint line-through" : "text-ink"}`}
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
                    <DueDisplay
                      status={invoice.status}
                      risk={risk}
                      dueDate={invoice.dueDate}
                    />
                  </td>
                  <td
                    className={`px-5 py-4 text-right tabular-nums ${isVoid ? "text-faint line-through" : "text-ink"}`}
                  >
                    {formatMoney(totals.total, invoice.currency)}
                  </td>
                  <td className="px-5 py-4 text-muted">
                    {formatDate(invoice.updatedAt)}
                  </td>
                </InvoiceRow>
              );
            })}
          </tbody>
        </table>
      </Card>
    </>
  );
}

export default function Home() {
  return (
    <PageShell width="lg">
      <InvoicesHeader />

      <Suspense fallback={<InvoiceListSkeleton />}>
        <InvoiceListBody />
      </Suspense>
    </PageShell>
  );
}
