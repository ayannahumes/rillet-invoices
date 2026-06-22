import type { Invoice } from "./invoices";
import type { DueDateRisk } from "./getDueDateRisk";

/**
 * An item to be triaged: the invoice fields the sort reads, plus its already
 * computed risk. Risk is passed in (from getDueDateRisk) — never recomputed.
 */
export interface TriageItem {
  invoice: Pick<Invoice, "status" | "dueDate">;
  risk: DueDateRisk;
}

/**
 * Triage tiers, lowest sorts first:
 *   0 Overdue → 1 Due soon → 2 Active/Ok (+ Drafts) → 3 Paid → 4 Void
 *
 * Tier comes from the risk level; getDueDateRisk reports "none" for both paid
 * and voided, so those two are split by lifecycle status.
 */
function tier(item: TriageItem): number {
  switch (item.risk.level) {
    case "overdue":
      return 0;
    case "due-soon":
      return 1;
    case "ok":
      return 2;
    case "none":
    default:
      return item.invoice.status === "Void" ? 4 : 3;
  }
}

// Due date as a sortable UTC value; missing due dates sort last within a tier.
function dueValue(item: TriageItem): number {
  const { dueDate } = item.invoice;
  if (!dueDate) return Number.POSITIVE_INFINITY;
  const [year, month, day] = dueDate.split("-").map(Number);
  return Date.UTC(year, month - 1, day);
}

/**
 * Comparator implementing the fixed triage-priority order. Within tiers:
 *   - Overdue: most days overdue first
 *   - everything else: due date ascending (soonest first)
 */
export function compareByTriage(a: TriageItem, b: TriageItem): number {
  const tierDelta = tier(a) - tier(b);
  if (tierDelta !== 0) return tierDelta;

  if (a.risk.level === "overdue" && b.risk.level === "overdue") {
    return b.risk.daysOverdue - a.risk.daysOverdue;
  }
  return dueValue(a) - dueValue(b);
}

/** Return a new array sorted by triage priority (does not mutate the input). */
export function sortByTriage<T extends TriageItem>(items: T[]): T[] {
  return [...items].sort(compareByTriage);
}
