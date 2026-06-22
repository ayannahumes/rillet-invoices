import { describe, it, expect } from "vitest";
import { getDueDateRisk } from "./getDueDateRisk";

describe("getDueDateRisk", () => {
  // Juniper (INV-2026-0408): unpaid, due strictly before current date.
  //   due 2026-04-10, current 2026-05-04 → 24 days overdue
  it("returns overdue with a day count when due date is before current date", () => {
    const result = getDueDateRisk(
      { paymentStatus: "Overdue", dueDate: "2026-04-10" },
      "2026-05-04",
    );

    expect(result.level).toBe("overdue");
    expect(result.daysOverdue).toBe(24);
  });

  // Acme (INV-2026-0412): unpaid, due 24 days out (> 7) → ok
  it("returns ok when the due date is more than 7 days away", () => {
    const result = getDueDateRisk(
      { paymentStatus: "Open", dueDate: "2026-05-28" },
      "2026-05-04",
    );

    expect(result.level).toBe("ok");
    expect(result.daysOverdue).toBe(0);
  });

  // Northwind (INV-2026-0399): paid → none, regardless of dates
  it("returns none for a paid invoice", () => {
    const result = getDueDateRisk(
      { paymentStatus: "Paid", dueDate: "2026-05-16" },
      "2026-05-04",
    );

    expect(result.level).toBe("none");
    expect(result.daysOverdue).toBe(0);
  });

  // Synthetic: unpaid, due 4 days out (within 0–7) → due-soon
  it("returns due-soon when the due date is within 7 days", () => {
    const result = getDueDateRisk(
      { paymentStatus: "Open", dueDate: "2026-05-08" },
      "2026-05-04",
    );

    expect(result.level).toBe("due-soon");
    expect(result.daysOverdue).toBe(0);
  });

  // Edge: due today (0 days) is on-time → due-soon, NOT overdue
  it("treats due-today as due-soon (on-time, not overdue)", () => {
    const result = getDueDateRisk(
      { paymentStatus: "Open", dueDate: "2026-05-04" },
      "2026-05-04",
    );

    expect(result.level).toBe("due-soon");
    expect(result.daysOverdue).toBe(0);
  });

  // Voided invoice → none, even if the due date is in the past.
  it("returns none for a voided invoice", () => {
    const result = getDueDateRisk(
      { paymentStatus: "Voided", dueDate: "2026-04-10" },
      "2026-05-04",
    );

    expect(result.level).toBe("none");
    expect(result.daysOverdue).toBe(0);
  });
});
