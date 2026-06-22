"use server";

import { revalidatePath } from "next/cache";
import {
  createInvoice,
  updateInvoice,
  deleteInvoiceDraft,
  voidInvoice,
  activityEntry,
  type LineItem,
} from "@/lib/invoices";
import {
  validateInvoiceForm,
  type InvoiceFormErrors,
} from "@/lib/validateInvoice";

export interface InvoiceActionInput {
  invoiceNumber: string;
  customerName: string;
  billingEmail?: string | null;
  billingAddress?: string | null;
  paymentTerms?: string | null;
  currency: string;
  issueDate: string;
  dueDate?: string | null;
  memo?: string | null;
  taxRate: number;
  discount: number;
  lineItems: LineItem[];
}

// Client handles navigation + toast based on the result (no server redirect).
export type FormActionResult =
  | { ok: true; id: string }
  | { ok: false; errors: InvoiceFormErrors };
export type MutationResult = { ok: true } | { ok: false; error: string };

export async function createInvoiceAction(
  input: InvoiceActionInput,
): Promise<FormActionResult> {
  const { valid, errors } = validateInvoiceForm(input);
  if (!valid) return { ok: false, errors };

  const created = await createInvoice({
    ...input,
    status: "Draft",
    paymentStatus: "Unsent",
    activity: [activityEntry("Created invoice")],
  });

  revalidatePath("/");
  return { ok: true, id: created.id };
}

export async function updateInvoiceAction(
  id: string,
  input: InvoiceActionInput,
): Promise<FormActionResult> {
  const { valid, errors } = validateInvoiceForm(input);
  if (!valid) return { ok: false, errors };

  await updateInvoice(id, input);

  revalidatePath("/");
  revalidatePath(`/invoices/${id}`);
  return { ok: true, id };
}

export async function deleteInvoiceAction(id: string): Promise<MutationResult> {
  try {
    await deleteInvoiceDraft(id);
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Could not delete." };
  }
  revalidatePath("/");
  return { ok: true };
}

export async function voidInvoiceAction(id: string): Promise<MutationResult> {
  try {
    await voidInvoice(id);
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Could not void." };
  }
  revalidatePath("/");
  revalidatePath(`/invoices/${id}`);
  return { ok: true };
}
