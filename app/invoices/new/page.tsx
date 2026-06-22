import Link from "next/link";
import { InvoiceForm } from "@/components/InvoiceForm";
import { createInvoiceAction } from "@/app/invoices/actions";

export const dynamic = "force-dynamic";

export default function NewInvoice() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-10 md:px-8">
      <Link href="/" className="text-sm text-muted hover:text-ink">
        ← Invoices
      </Link>
      <h1 className="mt-4 font-serif text-4xl font-medium text-ink">
        New invoice
      </h1>
      <div className="mt-8">
        <InvoiceForm
          action={createInvoiceAction}
          submitLabel="Create invoice"
        />
      </div>
    </main>
  );
}
