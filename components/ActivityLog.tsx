import { formatDateTime } from "@/lib/format";
import type { ActivityEntry } from "@/lib/invoices";

// Audit trail, collapsed by default (native <details>). Most recent first.
export function ActivityLog({ activity }: { activity: ActivityEntry[] }) {
  return (
    <details className="mt-10 border-t border-line pt-8">
      <summary className="cursor-pointer select-none text-xs uppercase tracking-wider text-faint">
        Activity ({activity.length})
      </summary>
      {activity.length === 0 ? (
        <p className="mt-4 text-sm text-muted">No activity yet.</p>
      ) : (
        <ol className="mt-4 space-y-3">
          {[...activity].reverse().map((entry) => (
            <li key={entry.id} className="flex flex-wrap gap-x-3 text-sm">
              <span className="whitespace-nowrap tabular-nums text-faint">
                {formatDateTime(entry.timestamp)}
              </span>
              <span className="text-ink">{entry.action}</span>
              <span className="text-muted">· {entry.actor}</span>
            </li>
          ))}
        </ol>
      )}
    </details>
  );
}
