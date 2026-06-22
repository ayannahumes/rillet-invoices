import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/invoices", () => ({
  createInvoice: vi.fn(),
  updateInvoice: vi.fn(),
  deleteInvoiceDraft: vi.fn(),
  voidInvoice: vi.fn(),
}));

import { revalidatePath } from "next/cache";
import {
  createInvoice,
  updateInvoice,
  deleteInvoiceDraft,
  voidInvoice,
} from "@/lib/invoices";
import {
  createInvoiceAction,
  updateInvoiceAction,
  deleteInvoiceAction,
  voidInvoiceAction,
  type InvoiceActionInput,
} from "./actions";

const validInput: InvoiceActionInput = {
  invoiceNumber: "INV-1",
  customerName: "Acme",
  currency: "USD",
  issueDate: "2026-05-01",
  dueDate: "2026-05-28",
  taxRate: 0.1,
  discount: 0,
  lineItems: [
    { id: "x", description: "Work", quantity: 1, unitPrice: 100, accountCode: "" },
  ],
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("createInvoiceAction", () => {
  it("rejects invalid input without persisting", async () => {
    const result = await createInvoiceAction({
      ...validInput,
      customerName: "",
      invoiceNumber: "",
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.customerName).toBeTruthy();
    expect(createInvoice).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("persists with Draft/Unsent + an audit entry, then revalidates", async () => {
    vi.mocked(createInvoice).mockResolvedValue({ id: "new-id" } as never);
    const result = await createInvoiceAction(validInput);

    expect(result).toEqual({ ok: true, id: "new-id" });
    const arg = vi.mocked(createInvoice).mock.calls[0][0];
    expect(arg).toMatchObject({
      customerName: "Acme",
      status: "Draft",
      paymentStatus: "Unsent",
    });
    expect(arg.activity).toHaveLength(1);
    expect(arg.activity![0].action).toBe("Created invoice");
    expect(revalidatePath).toHaveBeenCalledWith("/");
  });
});

describe("updateInvoiceAction", () => {
  it("rejects invalid input without persisting", async () => {
    const result = await updateInvoiceAction("id-1", {
      ...validInput,
      currency: "",
    });
    expect(result.ok).toBe(false);
    expect(updateInvoice).not.toHaveBeenCalled();
  });

  it("updates and revalidates both the list and the detail page", async () => {
    vi.mocked(updateInvoice).mockResolvedValue({ id: "id-1" } as never);
    const result = await updateInvoiceAction("id-1", validInput);

    expect(result).toEqual({ ok: true, id: "id-1" });
    expect(updateInvoice).toHaveBeenCalledWith("id-1", validInput);
    expect(revalidatePath).toHaveBeenCalledWith("/");
    expect(revalidatePath).toHaveBeenCalledWith("/invoices/id-1");
  });
});

describe("deleteInvoiceAction", () => {
  it("returns ok and revalidates on success", async () => {
    vi.mocked(deleteInvoiceDraft).mockResolvedValue(undefined);
    expect(await deleteInvoiceAction("id-1")).toEqual({ ok: true });
    expect(revalidatePath).toHaveBeenCalledWith("/");
  });

  it("surfaces the domain error and skips revalidation on failure", async () => {
    vi.mocked(deleteInvoiceDraft).mockRejectedValue(
      new Error("Only draft invoices can be deleted. Void it instead."),
    );
    const result = await deleteInvoiceAction("id-1");
    expect(result).toEqual({
      ok: false,
      error: "Only draft invoices can be deleted. Void it instead.",
    });
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});

describe("voidInvoiceAction", () => {
  it("returns ok and revalidates list + detail on success", async () => {
    vi.mocked(voidInvoice).mockResolvedValue({ id: "id-1" } as never);
    expect(await voidInvoiceAction("id-1")).toEqual({ ok: true });
    expect(revalidatePath).toHaveBeenCalledWith("/");
    expect(revalidatePath).toHaveBeenCalledWith("/invoices/id-1");
  });

  it("surfaces the domain error on failure", async () => {
    vi.mocked(voidInvoice).mockRejectedValue(
      new Error("Draft invoices are deleted, not voided."),
    );
    const result = await voidInvoiceAction("id-1");
    expect(result).toEqual({
      ok: false,
      error: "Draft invoices are deleted, not voided.",
    });
  });
});
