import { listInvoices } from "@/lib/invoices";
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

function riskLabel(
  risk: ReturnType<typeof getDueDateRisk>,
  dueDate: string | null,
): string {
  if (!dueDate) return "—";
  const date = formatDate(dueDate);
  switch (risk.level) {
    case "overdue":
      return `${date} · ${risk.daysOverdue} day${risk.daysOverdue === 1 ? "" : "s"} overdue`;
    case "due-soon":
      return `${date} · due soon`;
    default:
      return date;
  }
}

export default async function Home() {
  const invoices = await listInvoices();

  if (invoices.length === 0) {
    return (
      <main style={{ padding: "2rem", fontFamily: "sans-serif" }}>
        <h1>Invoices</h1>
        <p>No invoices.</p>
      </main>
    );
  }

  const rows = invoices.map((invoice) => ({
    invoice,
    totals: calculateInvoiceTotal(invoice),
    risk: getDueDateRisk(invoice, CURRENT_DATE),
  }));

  return (
    <main style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>Invoices</h1>
      <table style={{ borderCollapse: "collapse", width: "100%" }}>
        <thead>
          <tr>
            {["Customer", "Status", "Due / risk", "Amount", "Updated"].map(
              (h) => (
                <th
                  key={h}
                  style={{
                    textAlign: "left",
                    borderBottom: "2px solid #000",
                    padding: "0.5rem",
                  }}
                >
                  {h}
                </th>
              ),
            )}
          </tr>
        </thead>
        <tbody>
          {rows.map(({ invoice, totals, risk }) => (
            <tr key={invoice.id}>
              <td style={{ borderBottom: "1px solid #ccc", padding: "0.5rem" }}>
                <div>{invoice.customerName}</div>
                <div style={{ fontSize: "0.8em", color: "#666" }}>
                  {invoice.invoiceNumber}
                </div>
              </td>
              <td style={{ borderBottom: "1px solid #ccc", padding: "0.5rem" }}>
                {invoice.status}
              </td>
              <td style={{ borderBottom: "1px solid #ccc", padding: "0.5rem" }}>
                {riskLabel(risk, invoice.dueDate)}
              </td>
              <td style={{ borderBottom: "1px solid #ccc", padding: "0.5rem" }}>
                {formatMoney(totals.total, invoice.currency)}
              </td>
              <td style={{ borderBottom: "1px solid #ccc", padding: "0.5rem" }}>
                {formatDate(invoice.updatedAt)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
