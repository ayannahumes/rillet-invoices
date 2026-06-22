import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ToastProvider } from "@/components/ui/Toast";
import { InvoiceForm } from "./InvoiceForm";
import type { Invoice } from "@/lib/invoices";

// Stable router mock so we can assert navigation on success.
const { push, refresh } = vi.hoisted(() => ({
  push: vi.fn(),
  refresh: vi.fn(),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, refresh }),
}));

function renderForm(action = vi.fn()) {
  render(
    <ToastProvider>
      <InvoiceForm action={action} submitLabel="Create invoice" />
    </ToastProvider>,
  );
  return action;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("InvoiceForm validation", () => {
  it("blocks submit on invalid input, shows errors, and focuses the first one", async () => {
    const user = userEvent.setup();
    const action = renderForm();

    await user.click(screen.getByRole("button", { name: "Create invoice" }));

    expect(
      await screen.findByText("Customer name is required."),
    ).toBeInTheDocument();
    expect(screen.getByText("Invoice number is required.")).toBeInTheDocument();
    expect(action).not.toHaveBeenCalled();
    // Focus lands on the first invalid field for keyboard / screen-reader users.
    await waitFor(() =>
      expect(screen.getByLabelText("Customer name")).toHaveFocus(),
    );
  });
});

describe("InvoiceForm line items", () => {
  it("adds and removes line rows", async () => {
    const user = userEvent.setup();
    renderForm();

    expect(screen.getAllByPlaceholderText("Description")).toHaveLength(1);
    await user.click(screen.getByRole("button", { name: "+ Add line" }));
    expect(screen.getAllByPlaceholderText("Description")).toHaveLength(2);
    await user.click(screen.getByRole("button", { name: "Remove line 2" }));
    expect(screen.getAllByPlaceholderText("Description")).toHaveLength(1);
  });
});

describe("InvoiceForm submit", () => {
  it("calls the action with built input and navigates on success", async () => {
    const user = userEvent.setup();
    const action = vi.fn().mockResolvedValue({ ok: true, id: "abc" });
    renderForm(action);

    await user.type(screen.getByLabelText("Customer name"), "Acme");
    await user.type(screen.getByLabelText("Invoice number"), "INV-1");
    await user.type(screen.getByLabelText("Line 1 description"), "Consulting");
    await user.click(screen.getByRole("button", { name: "Create invoice" }));

    await waitFor(() => expect(action).toHaveBeenCalledTimes(1));
    const arg = action.mock.calls[0][0];
    expect(arg).toMatchObject({ customerName: "Acme", invoiceNumber: "INV-1" });
    expect(arg.lineItems[0]).toMatchObject({
      description: "Consulting",
      quantity: 1,
      unitPrice: 0,
    });
    await waitFor(() => expect(push).toHaveBeenCalledWith("/invoices/abc"));
  });
});

const baseInvoice: Invoice = {
  id: "00000000-0000-0000-0000-000000000000",
  invoiceNumber: "INV-1",
  customerName: "Acme",
  billingEmail: null,
  billingAddress: null,
  paymentTerms: null,
  status: "Draft",
  paymentStatus: "Unsent",
  currency: "USD",
  issueDate: "2026-05-01",
  dueDate: null,
  paidDate: null,
  memo: null,
  taxRate: 0.085,
  discount: 0,
  lineItems: [
    { id: "li-1", description: "Work", quantity: 1, unitPrice: 100, accountCode: "" },
  ],
  activity: [],
  createdAt: "2026-05-01T00:00:00Z",
  updatedAt: "2026-05-01T00:00:00Z",
};

describe("InvoiceForm tax rate (percent input)", () => {
  it("pre-fills the tax field as a percent when editing", () => {
    render(
      <ToastProvider>
        <InvoiceForm
          action={vi.fn()}
          initial={baseInvoice}
          submitLabel="Save changes"
        />
      </ToastProvider>,
    );
    // Stored fraction 0.085 shows as "8.5" (no binary-float artifacts).
    expect(screen.getByLabelText("Tax rate (%)")).toHaveValue("8.5");
  });

  it("converts the typed percent back to a fraction on submit", async () => {
    const user = userEvent.setup();
    const action = vi.fn().mockResolvedValue({ ok: true, id: "x" });
    renderForm(action);

    await user.type(screen.getByLabelText("Customer name"), "Acme");
    await user.type(screen.getByLabelText("Invoice number"), "INV-1");
    await user.type(screen.getByLabelText("Line 1 description"), "Consulting");
    const tax = screen.getByLabelText("Tax rate (%)");
    await user.clear(tax);
    await user.type(tax, "8.5");
    await user.click(screen.getByRole("button", { name: "Create invoice" }));

    await waitFor(() => expect(action).toHaveBeenCalledTimes(1));
    expect(action.mock.calls[0][0].taxRate).toBeCloseTo(0.085, 10);
  });
});
