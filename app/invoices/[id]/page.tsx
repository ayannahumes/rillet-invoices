import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getInvoiceById } from "@/lib/invoices";
import { calculateInvoiceTotal } from "@/lib/calculateInvoiceTotal";
import { getDueDateRisk } from "@/lib/getDueDateRisk";
import { CURRENT_DATE } from "@/lib/currentDate";
import { formatMoney, formatDate } from "@/lib/format";
import { StatusBadge } from "@/components/StatusBadge";
import { DueDisplay } from "@/components/DueDisplay";
import { TotalsBreakdown } from "@/components/TotalsBreakdown";
import { ActivityLog } from "@/components/ActivityLog";
import { InvoiceActions } from "@/components/InvoiceActions";
import { PageShell } from "@/components/ui/PageShell";
import { Heading } from "@/components/ui/Heading";
import { BackLink } from "@/components/ui/BackLink";
import { Card } from "@/components/ui/Card";
import { Field } from "@/components/ui/Field";
import { maybeDelay } from "@/lib/devDelay";

export const dynamic = "force-dynamic";

// Deduped within a request so generateMetadata and the page share one query.
const loadInvoice = cache(getInvoiceById);

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const invoice = await loadInvoice(id);
  if (!invoice) return { title: "Invoice not found" };
  return { title: `${invoice.customerName} · ${invoice.invoiceNumber}` };
}

export default async function InvoiceDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await maybeDelay(); // dev-only: SLOW_MS=2500 npm run start
  const invoice = await loadInvoice(id);
  if (!invoice) notFound();

  const totals = calculateInvoiceTotal(invoice);
  const risk = getDueDateRisk(invoice, CURRENT_DATE);

  // The dates-footer "Due" mirrors the row rule (drafts aren't sent; voids have
  // no due date), but as a plain date — no risk accent in the neutral footer.
  const dueDateLabel =
    invoice.status === "Draft"
      ? "Not sent"
      : invoice.status === "Void"
        ? "—"
        : invoice.dueDate
          ? formatDate(invoice.dueDate)
          : "—";

  return (
    <PageShell width="md">
      <BackLink href="/">Invoices</BackLink>

      <header className="mt-4 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <Heading className="break-words">{invoice.customerName}</Heading>
          <p className="mt-1 text-faint">{invoice.invoiceNumber}</p>
        </div>
        <InvoiceActions id={invoice.id} status={invoice.status} />
      </header>

      <dl className="mt-8 grid grid-cols-1 gap-x-12 gap-y-6 sm:grid-cols-2">
        <Field label="Status">
          <StatusBadge status={invoice.status} />
        </Field>
        <Field label="Payment status">{invoice.paymentStatus}</Field>
        <Field label="Terms">{invoice.paymentTerms ?? "—"}</Field>
        <Field label="Due">
          <DueDisplay status={invoice.status} risk={risk} dueDate={invoice.dueDate} />
        </Field>
        <Field label="Bill to">
          <div>{invoice.billingEmail ?? "—"}</div>
          {invoice.billingAddress && (
            <div className="text-muted">{invoice.billingAddress}</div>
          )}
        </Field>
        <Field label="Currency">{invoice.currency}</Field>
      </dl>

      <section className="mt-10">
        <h2 className="eyebrow">Line items</h2>
        <Card className="mt-3 overflow-hidden">
          {/* Mobile: stacked cards (no horizontal scroll). */}
          <ul className="divide-y divide-line sm:hidden">
            {invoice.lineItems.map((item) => (
              <li key={item.id} className="px-5 py-4">
                <div className="flex items-baseline justify-between gap-3">
                  <div className="min-w-0 text-ink">{item.description}</div>
                  <div className="shrink-0 text-right text-ink tabular-nums">
                    {formatMoney(
                      item.quantity * item.unitPrice,
                      invoice.currency,
                    )}
                  </div>
                </div>
                <div className="mt-1 text-xs text-muted tabular-nums">
                  {item.accountCode} · {item.quantity.toLocaleString("en-US")} ×{" "}
                  {formatMoney(item.unitPrice, invoice.currency)}
                </div>
              </li>
            ))}
          </ul>

          {/* sm and up: full data table. */}
          <table className="hidden w-full text-sm sm:table">
            <caption className="sr-only">Line items</caption>
            <thead>
              <tr className="border-b border-line text-left text-xs uppercase tracking-wider text-faint">
                <th scope="col" className="px-5 py-3 font-medium">
                  Description
                </th>
                <th scope="col" className="px-5 py-3 font-medium">
                  Account
                </th>
                <th scope="col" className="px-5 py-3 text-right font-medium">
                  Qty
                </th>
                <th scope="col" className="px-5 py-3 text-right font-medium">
                  Unit price
                </th>
                <th scope="col" className="px-5 py-3 text-right font-medium">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody>
              {invoice.lineItems.map((item) => (
                <tr key={item.id} className="border-b border-line last:border-0">
                  <td className="px-5 py-4 text-ink">{item.description}</td>
                  <td className="px-5 py-4 text-muted">{item.accountCode}</td>
                  <td className="px-5 py-4 text-right text-muted tabular-nums">
                    {item.quantity.toLocaleString("en-US")}
                  </td>
                  <td className="px-5 py-4 text-right text-muted tabular-nums">
                    {formatMoney(item.unitPrice, invoice.currency)}
                  </td>
                  <td className="px-5 py-4 text-right text-ink tabular-nums">
                    {formatMoney(
                      item.quantity * item.unitPrice,
                      invoice.currency,
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        {/* Totals breakdown */}
        <div className="mt-6 flex justify-end">
          <TotalsBreakdown
            totals={totals}
            currency={invoice.currency}
            taxRate={invoice.taxRate}
          />
        </div>
      </section>

      <section className="mt-10">
        <h2 className="eyebrow">Memo</h2>
        <p className="mt-2 text-ink">{invoice.memo ?? "—"}</p>
      </section>

      <dl className="mt-10 grid grid-cols-2 gap-x-12 gap-y-6 border-t border-line pt-8 sm:grid-cols-4">
        <Field label="Issued">{formatDate(invoice.issueDate)}</Field>
        <Field label="Due">{dueDateLabel}</Field>
        {invoice.paidDate && (
          <Field label="Paid">{formatDate(invoice.paidDate)}</Field>
        )}
        <Field label="Created">{formatDate(invoice.createdAt)}</Field>
        <Field label="Last updated">{formatDate(invoice.updatedAt)}</Field>
      </dl>

      <ActivityLog activity={invoice.activity} />
    </PageShell>
  );
}
