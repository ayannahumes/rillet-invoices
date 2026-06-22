import type { LineItem } from "./invoices";

export interface InvoiceTotals {
  /** Sum of line item amounts, rounded to cents. */
  subtotal: number;
  /** Absolute discount applied, rounded to cents. */
  discount: number;
  /** Tax on (subtotal − discount), rounded to cents. */
  taxAmount: number;
  /** (subtotal − discount) + taxAmount, rounded to cents. */
  total: number;
}

/** The minimal shape needed to compute totals — structurally compatible with {@link Invoice}. */
export interface CalculableInvoice {
  lineItems: Pick<LineItem, "quantity" | "unitPrice">[];
  discount: number; // absolute amount
  taxRate: number; // fraction, e.g. 0.085
}

/**
 * Round to cents (2 decimals). Money in IEEE-754 doubles is lossy — e.g.
 * 29760 × 0.085 evaluates to 2529.6000000000004 — so every monetary output is
 * rounded here. Number.EPSILON nudges values sitting just below a half-cent
 * boundary up to the correct rounding.
 */
function roundToCents(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/**
 * Compute an invoice's derived totals from its line items, discount, and tax
 * rate. Nothing here is persisted — totals are always recomputed from inputs.
 */
export function calculateInvoiceTotal(invoice: CalculableInvoice): InvoiceTotals {
  const { lineItems, discount, taxRate } = invoice;

  const subtotal = roundToCents(
    lineItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0),
  );
  const roundedDiscount = roundToCents(discount);
  const taxable = subtotal - roundedDiscount;
  const taxAmount = roundToCents(taxable * taxRate);
  const total = roundToCents(taxable + taxAmount);

  return { subtotal, discount: roundedDiscount, taxAmount, total };
}
