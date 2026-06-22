import type { ReactNode } from "react";

export type StatTone = "default" | "overdue" | "due-soon";

// Color is reserved for risk, so the only non-default tones are the risk accents.
const TONE: Record<StatTone, string> = {
  default: "text-ink",
  overdue: "text-overdue",
  "due-soon": "text-due-soon",
};

/**
 * A summary "stat" tile — a small muted label over a large figure on a recessed
 * surface.
 *
 * Accessibility: renders as a self-contained single-pair description list, so a
 * screen reader announces the label/value relationship ("Outstanding USD,
 * $12,000") rather than two loose strings.
 *
 * - `tone` tints the figure with a risk accent. Because color must never be the
 *   sole carrier of meaning, a non-default tone has to be backed by label text
 *   that already states it (e.g. a label of "Overdue").
 * - `valueLabel` overrides the spoken value when the displayed glyph isn't
 *   speech-friendly — e.g. show "—" but announce "None".
 */
export function StatCard({
  label,
  value,
  valueLabel,
  tone = "default",
  className = "",
}: {
  label: ReactNode;
  value: ReactNode;
  valueLabel?: string;
  tone?: StatTone;
  className?: string;
}) {
  return (
    <dl className={`rounded-xl bg-muted-surface px-5 py-4 ${className}`.trim()}>
      <dt className="text-sm text-muted">{label}</dt>
      <dd className={`mt-1 text-2xl font-medium tabular-nums ${TONE[tone]}`}>
        {valueLabel ? (
          <>
            <span aria-hidden="true">{value}</span>
            <span className="sr-only">{valueLabel}</span>
          </>
        ) : (
          value
        )}
      </dd>
    </dl>
  );
}
