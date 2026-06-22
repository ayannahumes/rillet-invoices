import { describe, it, expect } from "vitest";
import { validateInvoiceForm, type InvoiceFormInput } from "./validateInvoice";

function valid(): InvoiceFormInput {
  return {
    invoiceNumber: "INV-2026-1000",
    customerName: "Acme Labs",
    currency: "USD",
    issueDate: "2026-05-01",
    dueDate: "2026-05-31",
    taxRate: 0.085,
    discount: 0,
    lineItems: [{ description: "Consulting", quantity: 10, unitPrice: 200 }],
  };
}

describe("validateInvoiceForm", () => {
  it("accepts a well-formed invoice", () => {
    const { valid: ok, errors } = validateInvoiceForm(valid());
    expect(ok).toBe(true);
    expect(errors).toEqual({});
  });

  it("flags missing required fields", () => {
    const { valid: ok, errors } = validateInvoiceForm({
      ...valid(),
      invoiceNumber: "  ",
      customerName: "",
    });
    expect(ok).toBe(false);
    expect(errors.invoiceNumber).toBeTruthy();
    expect(errors.customerName).toBeTruthy();
  });

  it("requires at least one line item", () => {
    const { valid: ok, errors } = validateInvoiceForm({
      ...valid(),
      lineItems: [],
    });
    expect(ok).toBe(false);
    expect(errors.lineItems).toBeTruthy();
  });

  it("flags bad line-item quantity/unitPrice by index", () => {
    const { errors } = validateInvoiceForm({
      ...valid(),
      lineItems: [
        { description: "", quantity: 0, unitPrice: -5 },
        { description: "Ok", quantity: 1, unitPrice: 1 },
      ],
    });
    expect(errors["lineItems.0.description"]).toBeTruthy();
    expect(errors["lineItems.0.quantity"]).toBeTruthy();
    expect(errors["lineItems.0.unitPrice"]).toBeTruthy();
    expect(errors["lineItems.1.description"]).toBeUndefined();
  });

  it("rejects out-of-range tax rate and negative discount", () => {
    const { errors } = validateInvoiceForm({
      ...valid(),
      taxRate: 1.5,
      discount: -10,
    });
    expect(errors.taxRate).toBeTruthy();
    expect(errors.discount).toBeTruthy();
  });

  it("rejects a due date before the issue date", () => {
    const { errors } = validateInvoiceForm({
      ...valid(),
      issueDate: "2026-05-10",
      dueDate: "2026-05-01",
    });
    expect(errors.dueDate).toBeTruthy();
  });
});
