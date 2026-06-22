import { formatMoney } from "@/lib/format";
import type { InvoiceTotals } from "@/lib/calculateInvoiceTotal";

function formatPercent(rate: number): string {
  return `${(rate * 100).toLocaleString("en-US", { maximumFractionDigits: 2 })}%`;
}

/**
 * Invoice totals breakdown (Subtotal → Discount → Tax → Total), shared by the
 * detail view and the create/edit form so both render identically.
 *
 * - Rendered as a description list so a screen reader pairs each label with its
 *   amount (e.g. "Subtotal, $1,200.00").
 * - The Discount row only appears when there is one.
 * - `taxRate` (a fraction, e.g. 0.085) is optional: when given, the Tax row
 *   shows the rate — "Tax (8.5%)" — which the detail view wants and the live
 *   form (where the rate is still being typed) omits.
 */
export function TotalsBreakdown({
  totals,
  currency,
  taxRate,
  className = "",
}: {
  totals: InvoiceTotals;
  currency: string;
  taxRate?: number;
  className?: string;
}) {
  return (
    <dl
      className={`w-full max-w-xs space-y-2 text-sm tabular-nums ${className}`.trim()}
    >
      <div className="flex justify-between">
        <dt className="text-muted">Subtotal</dt>
        <dd className="text-ink">{formatMoney(totals.subtotal, currency)}</dd>
      </div>
      {totals.discount > 0 && (
        <div className="flex justify-between">
          <dt className="text-muted">Discount</dt>
          <dd className="text-ink">
            −{formatMoney(totals.discount, currency)}
          </dd>
        </div>
      )}
      <div className="flex justify-between">
        <dt className="text-muted">
          Tax{taxRate !== undefined ? ` (${formatPercent(taxRate)})` : ""}
        </dt>
        <dd className="text-ink">{formatMoney(totals.taxAmount, currency)}</dd>
      </div>
      <div className="flex justify-between border-t border-line pt-2 text-base">
        <dt className="text-ink">Total</dt>
        <dd className="font-medium text-ink">
          {formatMoney(totals.total, currency)}
        </dd>
      </div>
    </dl>
  );
}
