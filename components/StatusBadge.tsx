import type { InvoiceStatus } from "@/lib/invoices";

// Lifecycle status is encoded by weight/border — never color. Color is reserved
// strictly for risk, so the one accent stays unmissable.
export function StatusBadge({ status }: { status: InvoiceStatus }) {
  const base =
    "inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs leading-none";
  switch (status) {
    case "Draft":
      return (
        <span className={`${base} border border-dashed border-faint text-faint`}>
          Draft
        </span>
      );
    case "Sent":
      return (
        <span className={`${base} border border-line text-muted`}>Sent</span>
      );
    case "Paid":
      return (
        <span className={`${base} text-muted`}>
          <span aria-hidden>✓</span> Paid
        </span>
      );
    case "Void":
      return <span className={`${base} text-faint line-through`}>Void</span>;
  }
}
