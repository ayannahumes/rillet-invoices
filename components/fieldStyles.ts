// Shared form-input styling, used by the invoice form fields and the line-item
// editor so they stay visually identical from one place.
const BASE =
  "w-full rounded border bg-surface px-3 py-2 text-sm text-ink outline-none";

/**
 * Input classes with exactly one border color (avoids Tailwind's
 * conflicting-utility ambiguity). Pass `hasError` to swap to the risk-accent
 * border that signals an invalid field; `extra` appends utilities (e.g.
 * "text-right tabular-nums").
 */
export function inputClass(hasError = false, extra = ""): string {
  const border = hasError
    ? "border-overdue focus:border-overdue"
    : "border-line focus:border-ink";
  return `${BASE} ${border} ${extra}`.trim();
}

/** Default (no-error) input classes — for inputs without validation. */
export const INPUT = inputClass();
