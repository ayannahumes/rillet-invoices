import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { DueDisplay } from "./DueDisplay";
import type { DueDateRisk } from "@/lib/getDueDateRisk";

const ok: DueDateRisk = { level: "ok", daysOverdue: 0 };
const overdue: DueDateRisk = { level: "overdue", daysOverdue: 24 };

describe("DueDisplay", () => {
  it("shows 'Not sent' for a Draft, ignoring any due date", () => {
    render(<DueDisplay status="Draft" risk={ok} dueDate="2026-05-28" />);
    expect(screen.getByText("Not sent")).toBeInTheDocument();
  });

  it("shows an accessible dash for a Void invoice", () => {
    render(<DueDisplay status="Void" risk={ok} dueDate="2026-05-28" />);
    expect(screen.getByLabelText("No due date")).toBeInTheDocument();
  });

  it("shows the dated risk treatment for a Sent invoice", () => {
    render(<DueDisplay status="Sent" risk={ok} dueDate="2026-05-28" />);
    expect(screen.getByText("May 28, 2026")).toBeInTheDocument();
    expect(screen.queryByText("Not sent")).not.toBeInTheDocument();
  });

  it("surfaces overdue days for a Sent, overdue invoice", () => {
    render(<DueDisplay status="Sent" risk={overdue} dueDate="2026-04-10" />);
    expect(screen.getByText(/24 days overdue/)).toBeInTheDocument();
  });
});
