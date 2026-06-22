import { notFound } from "next/navigation";
import { getInvoiceById } from "@/lib/invoices";
import { InvoiceForm } from "@/components/InvoiceForm";
import { updateInvoiceAction } from "@/app/invoices/actions";
import { PageShell } from "@/components/ui/PageShell";
import { Heading } from "@/components/ui/Heading";
import { BackLink } from "@/components/ui/BackLink";

export const dynamic = "force-dynamic";

export default async function EditInvoice({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const invoice = await getInvoiceById(id);
  if (!invoice) notFound();

  // Bind the invoice id so the form sees the same (input) => result signature.
  const action = updateInvoiceAction.bind(null, id);

  return (
    <PageShell width="md">
      <BackLink href={`/invoices/${id}`}>{invoice.invoiceNumber}</BackLink>
      <Heading className="mt-4">Edit invoice</Heading>
      <div className="mt-8">
        <InvoiceForm
          action={action}
          initial={invoice}
          submitLabel="Save changes"
        />
      </div>
    </PageShell>
  );
}
