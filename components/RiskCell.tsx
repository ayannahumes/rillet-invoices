import { formatDate } from "@/lib/format";
import type { DueDateRisk } from "@/lib/getDueDateRisk";

// Renders a due date with its risk treatment. The risk accent (red overdue,
// amber due-soon) lives here and nowhere else in the chrome.
export function RiskCell({
  risk,
  dueDate,
}: {
  risk: DueDateRisk;
  dueDate: string | null;
}) {
  if (!dueDate)
    return (
      <span className="text-faint" aria-label="No due date">
        <span aria-hidden="true">—</span>
      </span>
    );
  const date = formatDate(dueDate);

  if (risk.level === "overdue") {
    return (
      <span className="text-muted">
        {date} <span aria-hidden="true">·</span>{" "}
        <span className="font-medium text-overdue">
          {risk.daysOverdue} day{risk.daysOverdue === 1 ? "" : "s"} overdue
        </span>
      </span>
    );
  }
  if (risk.level === "due-soon") {
    return (
      <span className="text-muted">
        {date} <span aria-hidden="true">·</span>{" "}
        <span className="text-due-soon">due soon</span>
      </span>
    );
  }
  return <span className="text-muted">{date}</span>;
}
