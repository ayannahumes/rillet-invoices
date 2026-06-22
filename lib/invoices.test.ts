import { describe, it, expect, beforeEach, vi } from "vitest";

// Mock the DB client: every data-layer function goes through sql.query(text, params).
vi.mock("@/lib/db", () => ({ sql: { query: vi.fn() } }));

import { sql } from "@/lib/db";
import {
  getInvoiceById,
  createInvoice,
  updateInvoice,
  deleteInvoiceDraft,
  voidInvoice,
} from "./invoices";

const query = sql.query as unknown as ReturnType<typeof vi.fn>;
const ID = "11111111-1111-1111-1111-111111111111";

function dbRow(overrides: Record<string, unknown> = {}) {
  return {
    id: ID,
    invoice_number: "INV-1",
    customer_name: "Acme",
    billing_email: null,
    billing_address: null,
    payment_terms: null,
    status: "Sent",
    payment_status: "Open",
    currency: "USD",
    issue_date: "2026-05-01",
    due_date: "2026-05-28",
    paid_date: null,
    memo: null,
    tax_rate: "0.085", // driver returns numerics as strings
    discount: "0",
    line_items: [],
    activity: [],
    created_at: "2026-05-01T00:00:00Z",
    updated_at: "2026-05-01T00:00:00Z",
    ...overrides,
  };
}

beforeEach(() => {
  query.mockReset();
});

describe("getInvoiceById", () => {
  it("returns null for a malformed id without hitting the DB", async () => {
    expect(await getInvoiceById("not-a-uuid")).toBeNull();
    expect(query).not.toHaveBeenCalled();
  });

  it("returns null when no row matches", async () => {
    query.mockResolvedValueOnce([]);
    expect(await getInvoiceById(ID)).toBeNull();
  });

  it("maps a row, coercing numeric strings and defaulting json", async () => {
    query.mockResolvedValueOnce([dbRow({ tax_rate: "0.2", discount: "15" })]);
    const inv = await getInvoiceById(ID);
    expect(inv).toMatchObject({
      id: ID,
      invoiceNumber: "INV-1",
      taxRate: 0.2,
      discount: 15,
      lineItems: [],
      activity: [],
    });
    // numerics are real numbers, not the strings the driver returned
    expect(typeof inv!.taxRate).toBe("number");
  });
});

describe("createInvoice", () => {
  it("applies Draft / Unsent / USD defaults and returns the persisted record", async () => {
    query.mockResolvedValueOnce([dbRow()]);
    const created = await createInvoice({
      invoiceNumber: "INV-1",
      customerName: "Acme",
      lineItems: [],
    });

    expect(created.id).toBe(ID);
    const params = query.mock.calls[0][1] as unknown[];
    expect(params[5]).toBe("Draft"); // status
    expect(params[6]).toBe("Unsent"); // payment_status
    expect(params[7]).toBe("USD"); // currency
    expect(params[12]).toBe(0); // tax_rate
    expect(params[13]).toBe(0); // discount
    expect(params[8]).toMatch(/^\d{4}-\d{2}-\d{2}$/); // issue_date defaults to today
  });
});

describe("updateInvoice", () => {
  const input = {
    invoiceNumber: "INV-1",
    customerName: "Acme",
    currency: "USD",
    issueDate: "2026-05-01",
    taxRate: 0,
    discount: 0,
    lineItems: [],
  };

  it("returns null for a malformed id without hitting the DB", async () => {
    expect(await updateInvoice("bad", input)).toBeNull();
    expect(query).not.toHaveBeenCalled();
  });

  it("appends an 'Edited invoice' audit entry", async () => {
    query.mockResolvedValueOnce([dbRow()]);
    await updateInvoice(ID, input);
    const params = query.mock.calls[0][1] as unknown[];
    expect(String(params[13])).toContain("Edited invoice");
  });

  it("returns null when the row does not exist", async () => {
    query.mockResolvedValueOnce([]);
    expect(await updateInvoice(ID, input)).toBeNull();
  });
});

describe("deleteInvoiceDraft (invariant: only drafts are deletable)", () => {
  it("throws for a malformed id without hitting the DB", async () => {
    await expect(deleteInvoiceDraft("bad")).rejects.toThrow("Invoice not found.");
    expect(query).not.toHaveBeenCalled();
  });

  it("resolves when a draft row is deleted", async () => {
    query.mockResolvedValueOnce([{ id: ID }]);
    await expect(deleteInvoiceDraft(ID)).resolves.toBeUndefined();
  });

  it("rejects a non-draft with a 'void it instead' message", async () => {
    query
      .mockResolvedValueOnce([]) // DELETE ... WHERE status='Draft' matched nothing
      .mockResolvedValueOnce([dbRow({ status: "Sent" })]); // but the invoice exists
    await expect(deleteInvoiceDraft(ID)).rejects.toThrow(
      "Only draft invoices can be deleted. Void it instead.",
    );
  });

  it("rejects 'not found' when nothing exists", async () => {
    query.mockResolvedValueOnce([]).mockResolvedValueOnce([]);
    await expect(deleteInvoiceDraft(ID)).rejects.toThrow("Invoice not found.");
  });
});

describe("voidInvoice (invariant: only non-draft, non-void are voidable)", () => {
  it("returns null for a malformed id", async () => {
    expect(await voidInvoice("bad")).toBeNull();
    expect(query).not.toHaveBeenCalled();
  });

  it("voids a non-draft invoice and returns it", async () => {
    query.mockResolvedValueOnce([
      dbRow({ status: "Void", payment_status: "Voided" }),
    ]);
    const result = await voidInvoice(ID);
    expect(result?.status).toBe("Void");
  });

  it("rejects drafts ('deleted, not voided')", async () => {
    query
      .mockResolvedValueOnce([]) // UPDATE matched nothing (it's a draft)
      .mockResolvedValueOnce([dbRow({ status: "Draft" })]);
    await expect(voidInvoice(ID)).rejects.toThrow(
      "Draft invoices are deleted, not voided.",
    );
  });

  it("rejects 'not found' when nothing exists", async () => {
    query.mockResolvedValueOnce([]).mockResolvedValueOnce([]);
    await expect(voidInvoice(ID)).rejects.toThrow("Invoice not found.");
  });

  it("is idempotent: returns the existing record when already void", async () => {
    query
      .mockResolvedValueOnce([]) // UPDATE excluded it (already Void)
      .mockResolvedValueOnce([dbRow({ status: "Void", payment_status: "Voided" })]);
    const result = await voidInvoice(ID);
    expect(result?.status).toBe("Void");
  });
});
