/**
 * Sum amounts grouped by currency. Used for the dashboard's per-currency
 * Outstanding / Overdue totals — currencies are never combined (no conversion).
 */
export function sumByCurrency(
  items: { currency: string; amount: number }[],
): Map<string, number> {
  const totals = new Map<string, number>();
  for (const { currency, amount } of items) {
    totals.set(currency, (totals.get(currency) ?? 0) + amount);
  }
  return totals;
}
