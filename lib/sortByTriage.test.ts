import { describe, it, expect } from "vitest";
import { sortByTriage, type TriageItem } from "./sortByTriage";
import type { InvoiceStatus } from "./invoices";
import type { DueDateRiskLevel } from "./getDueDateRisk";

type Row = TriageItem & { id: string };

function row(
  id: string,
  status: InvoiceStatus,
  dueDate: string | null,
  level: DueDateRiskLevel,
  daysOverdue = 0,
): Row {
  return { id, invoice: { status, dueDate }, risk: { level, daysOverdue } };
}

describe("sortByTriage", () => {
  it("orders by triage tier, then within-tier direction", () => {
    const input: Row[] = [
      row("paid", "Paid", "2026-05-16", "none"),
      row("ok-late", "Sent", "2026-05-28", "ok"),
      row("overdue-mild", "Sent", "2026-04-29", "overdue", 5),
      row("void", "Void", "2026-06-01", "none"),
      row("due-soon-late", "Sent", "2026-05-08", "due-soon"),
      row("overdue-bad", "Sent", "2026-04-10", "overdue", 24),
      row("draft-ok", "Draft", "2026-05-20", "ok"),
      row("due-soon-early", "Sent", "2026-05-06", "due-soon"),
    ];

    const sorted = sortByTriage(input).map((r) => r.id);

    expect(sorted).toEqual([
      "overdue-bad", // tier 1: most overdue first
      "overdue-mild",
      "due-soon-early", // tier 2: soonest due first
      "due-soon-late",
      "draft-ok", // tier 3: active/ok + drafts, due date ascending
      "ok-late",
      "paid", // tier 4
      "void", // tier 5 (last)
    ]);
  });

  it("does not mutate the input array", () => {
    const input: Row[] = [
      row("a", "Paid", "2026-05-16", "none"),
      row("b", "Sent", "2026-04-10", "overdue", 24),
    ];
    const before = input.map((r) => r.id);

    sortByTriage(input);

    expect(input.map((r) => r.id)).toEqual(before);
  });

  it("sorts invoices without a due date last within their tier", () => {
    const input: Row[] = [
      row("no-due", "Sent", null, "ok"),
      row("has-due", "Sent", "2026-05-01", "ok"),
    ];

    expect(sortByTriage(input).map((r) => r.id)).toEqual(["has-due", "no-due"]);
  });
});
