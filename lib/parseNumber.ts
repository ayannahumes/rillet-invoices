/**
 * Parse a form-field string to a number. Returns NaN for non-finite input so
 * callers can fall back with `|| 0` (for display) or let validation reject it.
 */
export function num(value: string): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : NaN;
}
