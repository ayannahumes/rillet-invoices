import { InvoiceForm } from "@/components/InvoiceForm";
import { createInvoiceAction } from "@/app/invoices/actions";
import { PageShell } from "@/components/ui/PageShell";
import { Heading } from "@/components/ui/Heading";
import { BackLink } from "@/components/ui/BackLink";

export const dynamic = "force-dynamic";

export const metadata = { title: "New invoice" };

export default function NewInvoice() {
  return (
    <PageShell width="md">
      <BackLink href="/">Invoices</BackLink>
      <Heading className="mt-4">New invoice</Heading>
      <div className="mt-8">
        <InvoiceForm
          action={createInvoiceAction}
          submitLabel="Create invoice"
        />
      </div>
    </PageShell>
  );
}
