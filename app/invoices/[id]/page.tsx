import { notFound } from "next/navigation";
import { getInvoiceById } from "@/lib/invoices";
import { calculateInvoiceTotal } from "@/lib/calculateInvoiceTotal";
import { getDueDateRisk } from "@/lib/getDueDateRisk";
import { CURRENT_DATE } from "@/lib/currentDate";
import { formatMoney, formatDate } from "@/lib/format";
import { StatusBadge } from "@/components/StatusBadge";
import { RiskCell } from "@/components/RiskCell";
import { ActivityLog } from "@/components/ActivityLog";
import { InvoiceActions } from "@/components/InvoiceActions";
import { PageShell } from "@/components/ui/PageShell";
import { Heading } from "@/components/ui/Heading";
import { BackLink } from "@/components/ui/BackLink";
import { Label } from "@/components/ui/Label";
import { Card } from "@/components/ui/Card";
import { Field } from "@/components/ui/Field";
import { maybeDelay } from "@/lib/devDelay";

export const dynamic = "force-dynamic";

function formatPercent(rate: number): string {
  return `${(rate * 100).toLocaleString("en-US", { maximumFractionDigits: 2 })}%`;
}

export default async function InvoiceDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await maybeDelay(); // dev-only: SLOW_MS=2500 npm run start
  const invoice = await getInvoiceById(id);
  if (!invoice) notFound();

  const totals = calculateInvoiceTotal(invoice);
  const risk = getDueDateRisk(invoice, CURRENT_DATE);

  return (
    <PageShell width="md">
      <BackLink href="/">Invoices</BackLink>

      <header className="mt-4 flex items-start justify-between gap-4">
        <div>
          <Heading>{invoice.customerName}</Heading>
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
          <RiskCell risk={risk} dueDate={invoice.dueDate} />
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
        <Label as="h2">Line items</Label>
        <Card className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs uppercase tracking-wider text-faint">
                <th className="px-5 py-3 font-medium">Description</th>
                <th className="px-5 py-3 font-medium">Account</th>
                <th className="px-5 py-3 text-right font-medium">Qty</th>
                <th className="px-5 py-3 text-right font-medium">Unit price</th>
                <th className="px-5 py-3 text-right font-medium">Amount</th>
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
          <dl className="w-full max-w-xs space-y-2 text-sm tabular-nums">
            <div className="flex justify-between">
              <dt className="text-muted">Subtotal</dt>
              <dd className="text-ink">
                {formatMoney(totals.subtotal, invoice.currency)}
              </dd>
            </div>
            {totals.discount > 0 && (
              <div className="flex justify-between">
                <dt className="text-muted">Discount</dt>
                <dd className="text-ink">
                  −{formatMoney(totals.discount, invoice.currency)}
                </dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-muted">
                Tax ({formatPercent(invoice.taxRate)})
              </dt>
              <dd className="text-ink">
                {formatMoney(totals.taxAmount, invoice.currency)}
              </dd>
            </div>
            <div className="flex justify-between border-t border-line pt-2 text-base">
              <dt className="text-ink">Total</dt>
              <dd className="font-medium text-ink">
                {formatMoney(totals.total, invoice.currency)}
              </dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="mt-10">
        <Label as="h2">Memo</Label>
        <p className="mt-2 text-ink">{invoice.memo ?? "—"}</p>
      </section>

      <dl className="mt-10 grid grid-cols-2 gap-x-12 gap-y-6 border-t border-line pt-8 sm:grid-cols-4">
        <Field label="Issued">{formatDate(invoice.issueDate)}</Field>
        <Field label="Due">
          {invoice.dueDate ? formatDate(invoice.dueDate) : "—"}
        </Field>
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
