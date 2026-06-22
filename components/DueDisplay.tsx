import { RiskCell } from "@/components/RiskCell";
import type { DueDateRisk } from "@/lib/getDueDateRisk";
import type { InvoiceStatus } from "@/lib/invoices";

/**
 * The due-date display for an invoice list row. Lifecycle status overrides the
 * risk treatment:
 *   - Draft → "Not sent" (it hasn't been issued, so it has no due date yet)
 *   - Void  → "—" (a voided invoice can't have a due date)
 *   - else  → the dated risk treatment (overdue / due-soon / plain date)
 *
 * Void reuses RiskCell's accessible "No due date" dash by passing a null date.
 */
export function DueDisplay({
  status,
  risk,
  dueDate,
}: {
  status: InvoiceStatus;
  risk: DueDateRisk;
  dueDate: string | null;
}) {
  if (status === "Draft") {
    return <span className="text-faint">Not sent</span>;
  }
  if (status === "Void") {
    return <RiskCell risk={risk} dueDate={null} />;
  }
  return <RiskCell risk={risk} dueDate={dueDate} />;
}
