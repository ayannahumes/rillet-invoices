// The organization that issues these invoices. Single-tenant for now, so this
// is a constant rather than per-request data; surfaced as the page subtitle.
// `baseCurrency` is display-only context — amounts are always shown in each
// invoice's own currency, never converted.
export const ORG = {
  name: "Northstar Metrics",
  baseCurrency: "USD",
} as const;
