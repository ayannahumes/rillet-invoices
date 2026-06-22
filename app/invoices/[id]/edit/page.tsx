import Link from "next/link";
import { notFound } from "next/navigation";
import { getInvoiceById } from "@/lib/invoices";
import { InvoiceForm } from "@/components/InvoiceForm";
import { updateInvoiceAction } from "@/app/invoices/actions";

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
    <main className="mx-auto max-w-3xl px-6 py-10 md:px-8">
      <Link
        href={`/invoices/${id}`}
        className="text-sm text-muted hover:text-ink"
      >
        ← {invoice.invoiceNumber}
      </Link>
      <h1 className="mt-4 font-serif text-4xl font-medium text-ink">
        Edit invoice
      </h1>
      <div className="mt-8">
        <InvoiceForm
          action={action}
          initial={invoice}
          submitLabel="Save changes"
        />
      </div>
    </main>
  );
}
