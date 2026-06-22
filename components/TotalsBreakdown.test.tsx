import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { TotalsBreakdown } from "./TotalsBreakdown";
import type { InvoiceTotals } from "@/lib/calculateInvoiceTotal";

const totals: InvoiceTotals = {
  subtotal: 1200,
  discount: 0,
  taxAmount: 102,
  total: 1302,
};

describe("TotalsBreakdown", () => {
  it("renders subtotal, tax, and total as label/value pairs", () => {
    render(<TotalsBreakdown totals={totals} currency="USD" />);
    expect(screen.getByText("Subtotal")).toBeInTheDocument();
    expect(screen.getByText("$1,200.00")).toBeInTheDocument();
    expect(screen.getByText("Total")).toBeInTheDocument();
    expect(screen.getByText("$1,302.00")).toBeInTheDocument();
  });

  it("hides the Discount row when there is no discount", () => {
    render(<TotalsBreakdown totals={totals} currency="USD" />);
    expect(screen.queryByText("Discount")).not.toBeInTheDocument();
  });

  it("shows the Discount row (negative) when present", () => {
    render(
      <TotalsBreakdown
        totals={{ ...totals, discount: 100 }}
        currency="USD"
      />,
    );
    expect(screen.getByText("Discount")).toBeInTheDocument();
    expect(screen.getByText("−$100.00")).toBeInTheDocument();
  });

  it("shows the tax rate only when taxRate is provided", () => {
    const { rerender } = render(
      <TotalsBreakdown totals={totals} currency="USD" />,
    );
    expect(screen.getByText("Tax")).toBeInTheDocument();

    rerender(<TotalsBreakdown totals={totals} currency="USD" taxRate={0.085} />);
    expect(screen.getByText("Tax (8.5%)")).toBeInTheDocument();
  });

  it("formats in the given currency", () => {
    render(<TotalsBreakdown totals={totals} currency="GBP" />);
    expect(screen.getByText("£1,302.00")).toBeInTheDocument();
  });
});
