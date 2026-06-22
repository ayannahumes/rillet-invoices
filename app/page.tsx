import {
  listInvoices,
  type PaymentStatus,
  type InvoiceStatus,
} from "@/lib/invoices";
import { calculateInvoiceTotal } from "@/lib/calculateInvoiceTotal";
import { getDueDateRisk } from "@/lib/getDueDateRisk";

// The seed data is authored around this date, so the crafted risk states
// (overdue / due-soon / ok) show up. Swap for `new Date()` once data is live.
const CURRENT_DATE = "2026-05-04";

function formatMoney(amount: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount);
}

// Format a 'YYYY-MM-DD' or ISO timestamp in UTC, so dates don't drift a day
// across server timezones.
function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(value));
}

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

// Lifecycle status is encoded by weight/border — never color. Color is reserved
// strictly for risk, so the one accent stays unmissable.
function StatusBadge({ status }: { status: InvoiceStatus }) {
  const base =
    "inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs leading-none";
  switch (status) {
    case "Draft":
      return (
        <span className={`${base} border border-dashed border-faint text-faint`}>
          Draft
        </span>
      );
    case "Sent":
      return (
        <span className={`${base} border border-line text-muted`}>Sent</span>
      );
    case "Paid":
      return (
        <span className={`${base} text-muted`}>
          <span aria-hidden>✓</span> Paid
        </span>
      );
    case "Void":
      return <span className={`${base} text-faint line-through`}>Void</span>;
  }
}

function RiskCell({
  risk,
  dueDate,
}: {
  risk: ReturnType<typeof getDueDateRisk>;
  dueDate: string | null;
}) {
  if (!dueDate) return <span className="text-faint">—</span>;
  const date = formatDate(dueDate);

  if (risk.level === "overdue") {
    return (
      <span className="text-muted">
        {date} ·{" "}
        <span className="font-medium text-overdue">
          {risk.daysOverdue} day{risk.daysOverdue === 1 ? "" : "s"} overdue
        </span>
      </span>
    );
  }
  if (risk.level === "due-soon") {
    return (
      <span className="text-muted">
        {date} · <span className="text-due-soon">due soon</span>
      </span>
    );
  }
  return <span className="text-muted">{date}</span>;
}

export default async function Home() {
  const invoices = await listInvoices();

  if (invoices.length === 0) {
    return (
      <main className="mx-auto flex min-h-[60vh] max-w-5xl flex-col items-center justify-center px-6 text-center">
        <h1 className="font-serif text-4xl font-medium text-ink">Invoices</h1>
        <p className="mt-3 text-muted">No invoices yet.</p>
        <button
          type="button"
          className="mt-6 rounded border border-line px-4 py-2 text-sm text-ink transition-colors hover:bg-surface"
        >
          New invoice
        </button>
      </main>
    );
  }

  const rows = invoices.map((invoice) => ({
    invoice,
    totals: calculateInvoiceTotal(invoice),
    risk: getDueDateRisk(invoice, CURRENT_DATE),
  }));

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
    <main className="mx-auto max-w-5xl px-6 py-10 md:px-8">
      <h1 className="font-serif text-4xl font-medium text-ink">Invoices</h1>

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

      <div className="mt-10 overflow-hidden rounded-lg border border-line bg-surface">
        <table className="w-full text-sm">
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
              <tr
                key={invoice.id}
                className="border-b border-line last:border-0"
              >
                <td className="px-5 py-4">
                  <div className="text-ink">{invoice.customerName}</div>
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
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
