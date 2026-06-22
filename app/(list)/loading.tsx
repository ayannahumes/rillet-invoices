import { PageShell } from "@/components/ui/PageShell";
import { InvoicesHeader } from "@/components/InvoicesHeader";
import { InvoiceListSkeleton } from "@/components/InvoiceListSkeleton";

// Route-level loading UI. Next shows this while the (dynamic) invoices query
// streams in — on initial load, refresh, AND when navigating back to the list —
// so the user never sees a blank page. The static header renders immediately;
// only the list area shows the skeleton.
export default function Loading() {
  return (
    <PageShell width="lg">
      <InvoicesHeader />
      <InvoiceListSkeleton />
    </PageShell>
  );
}
