import { Badge } from "@/components/ui/Badge";
import type { InvoiceStatus } from "@/lib/invoices";

// Lifecycle status is encoded by weight/border — never color. Color is reserved
// strictly for risk, so the one accent stays unmissable. (The generic pill shell
// lives in the Badge primitive; the per-status treatment is the domain rule.)
export function StatusBadge({ status }: { status: InvoiceStatus }) {
  switch (status) {
    case "Draft":
      return (
        <Badge className="border border-dashed border-faint text-faint">
          Draft
        </Badge>
      );
    case "Sent":
      return <Badge className="border border-line text-muted">Sent</Badge>;
    case "Paid":
      return (
        <Badge className="text-muted">
          <span aria-hidden>✓</span> Paid
        </Badge>
      );
    case "Void":
      return <Badge className="text-faint line-through">Void</Badge>;
  }
}
