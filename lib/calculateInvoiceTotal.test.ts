import { describe, it, expect } from "vitest";
import { calculateInvoiceTotal } from "./calculateInvoiceTotal";

describe("calculateInvoiceTotal", () => {
  // INV-2026-0412 (Acme Labs). Hand-verified:
  //   line 1: 1 × 12000        = 12000
  //   line 2: 1,480,000 × 0.012 = 17760
  //   subtotal                 = 29760
  //   after discount (0)       = 29760
  //   tax: 29760 × 0.085       = 2529.6   (raw float is 2529.6000000000004 → must round)
  //   total: 29760 + 2529.6    = 32289.6
  it("computes totals for the Acme Labs invoice (the tax-step float case)", () => {
    const result = calculateInvoiceTotal({
      lineItems: [
        { quantity: 1, unitPrice: 12000 },
        { quantity: 1_480_000, unitPrice: 0.012 },
      ],
      discount: 0,
      taxRate: 0.085,
    });

    expect(result.subtotal).toBe(29760);
    expect(result.discount).toBe(0);
    expect(result.taxAmount).toBe(2529.6);
    expect(result.total).toBe(32289.6);
  });

  // INV-2026-0413 (Brightline Health). Zero tax, non-zero discount:
  //   subtotal: 40×275 + 12×225 = 11000 + 2700 = 13700
  //   after discount (1000)     = 12700
  //   tax: 12700 × 0            = 0
  //   total                     = 12700
  it("handles a zero tax rate with a non-zero discount", () => {
    const result = calculateInvoiceTotal({
      lineItems: [
        { quantity: 40, unitPrice: 275 },
        { quantity: 12, unitPrice: 225 },
      ],
      discount: 1000,
      taxRate: 0,
    });

    expect(result.subtotal).toBe(13700);
    expect(result.discount).toBe(1000);
    expect(result.taxAmount).toBe(0);
    expect(result.total).toBe(12700);
  });

  // INV-2026-0408 (Juniper Supply Co., CAD). Single line, 13% tax, no discount:
  //   subtotal: 1 × 8500 = 8500
  //   tax: 8500 × 0.13   = 1105
  //   total              = 9605
  it("computes totals for the Juniper invoice (CAD, 13% tax)", () => {
    const result = calculateInvoiceTotal({
      lineItems: [{ quantity: 1, unitPrice: 8500 }],
      discount: 0,
      taxRate: 0.13,
    });

    expect(result.subtotal).toBe(8500);
    expect(result.discount).toBe(0);
    expect(result.taxAmount).toBe(1105);
    expect(result.total).toBe(9605);
  });

  // INV-2026-0399 (Northwind Analytics, GBP). Two lines, 20% VAT, discount 2500:
  //   subtotal: 48000 + 6000 = 54000
  //   after discount (2500)  = 51500
  //   tax: 51500 × 0.2       = 10300
  //   total                  = 61800
  it("computes totals for the Northwind invoice (GBP, 20% VAT, discount)", () => {
    const result = calculateInvoiceTotal({
      lineItems: [
        { quantity: 1, unitPrice: 48000 },
        { quantity: 1, unitPrice: 6000 },
      ],
      discount: 2500,
      taxRate: 0.2,
    });

    expect(result.subtotal).toBe(54000);
    expect(result.discount).toBe(2500);
    expect(result.taxAmount).toBe(10300);
    expect(result.total).toBe(61800);
  });

  // INV-2026-0414 (Acme Labs, voided). Another tax-step float case:
  //   subtotal: 1 × 17880 = 17880
  //   tax: 17880 × 0.085  = 1519.8   (raw float is 1519.8000000000002 → must round)
  //   total               = 19399.8
  it("rounds the tax step for the Acme voided invoice", () => {
    const result = calculateInvoiceTotal({
      lineItems: [{ quantity: 1, unitPrice: 17880 }],
      discount: 0,
      taxRate: 0.085,
    });

    expect(result.subtotal).toBe(17880);
    expect(result.taxAmount).toBe(1519.8);
    expect(result.total).toBe(19399.8);
  });

  // Edge: no line items → everything zero.
  it("returns zeros for an invoice with no line items", () => {
    const result = calculateInvoiceTotal({
      lineItems: [],
      discount: 0,
      taxRate: 0.085,
    });

    expect(result.subtotal).toBe(0);
    expect(result.discount).toBe(0);
    expect(result.taxAmount).toBe(0);
    expect(result.total).toBe(0);
  });

  // Edge: the subtotal itself needs rounding. 3 × 0.1 = 0.30000000000000004 in
  // IEEE-754; this exercises the rounding on the subtotal path (not just tax).
  it("rounds a sub-cent subtotal (3 × 0.1)", () => {
    const result = calculateInvoiceTotal({
      lineItems: [{ quantity: 3, unitPrice: 0.1 }],
      discount: 0,
      taxRate: 0,
    });

    expect(result.subtotal).toBe(0.3);
    expect(result.total).toBe(0.3);
  });
});
