import type { PaymentStatus } from "./invoices";

export type DueDateRiskLevel = "none" | "overdue" | "due-soon" | "ok";

export interface DueDateRisk {
  level: DueDateRiskLevel;
  /** Whole days past the due date; 0 unless level is "overdue". */
  daysOverdue: number;
}

export interface DueDateRiskInput {
  paymentStatus: PaymentStatus;
  dueDate: string | null; // 'YYYY-MM-DD'
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Parse a 'YYYY-MM-DD' string (or pass through a Date) to a UTC-midnight Date,
 * so day differences are computed in date form — never by string comparison —
 * and are immune to local timezone / DST shifts.
 */
function toUtcMidnight(date: string | Date): Date {
  if (date instanceof Date) return date;
  const [year, month, day] = date.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

/**
 * Classify an invoice's due-date risk relative to a reference "current" date.
 *
 * Rules:
 *   - paid/voided                              → "none"
 *   - unpaid & due strictly before current     → "overdue" (with day count)
 *   - unpaid & due 0–7 days out (incl. today)  → "due-soon"
 *   - otherwise                                → "ok"
 *
 * Due-today (0 days) is on-time: "due-soon", not "overdue".
 */
export function getDueDateRisk(
  invoice: DueDateRiskInput,
  currentDate: string | Date,
): DueDateRisk {
  const { paymentStatus, dueDate } = invoice;

  if (paymentStatus === "Paid" || paymentStatus === "Voided") {
    return { level: "none", daysOverdue: 0 };
  }

  // No due date means no deadline to be at risk against.
  if (!dueDate) {
    return { level: "ok", daysOverdue: 0 };
  }

  const due = toUtcMidnight(dueDate).getTime();
  const now = toUtcMidnight(currentDate).getTime();
  const daysUntilDue = Math.round((due - now) / MS_PER_DAY);

  if (daysUntilDue < 0) {
    return { level: "overdue", daysOverdue: -daysUntilDue };
  }
  if (daysUntilDue <= 7) {
    return { level: "due-soon", daysOverdue: 0 };
  }
  return { level: "ok", daysOverdue: 0 };
}
