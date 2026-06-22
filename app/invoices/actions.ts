"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createInvoice,
  updateInvoice,
  deleteInvoiceDraft,
  voidInvoice,
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

export type FormActionResult = { errors: InvoiceFormErrors } | undefined;
export type MutationResult = { error?: string };

function createdEntry(action: string) {
  return {
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    actor: "You",
    action,
  };
}

export async function createInvoiceAction(
  input: InvoiceActionInput,
): Promise<FormActionResult> {
  const { valid, errors } = validateInvoiceForm(input);
  if (!valid) return { errors };

  const created = await createInvoice({
    ...input,
    status: "Draft",
    paymentStatus: "Unsent",
    activity: [createdEntry("Created invoice")],
  });

  revalidatePath("/");
  redirect(`/invoices/${created.id}`);
}

export async function updateInvoiceAction(
  id: string,
  input: InvoiceActionInput,
): Promise<FormActionResult> {
  const { valid, errors } = validateInvoiceForm(input);
  if (!valid) return { errors };

  await updateInvoice(id, input);

  revalidatePath("/");
  revalidatePath(`/invoices/${id}`);
  redirect(`/invoices/${id}`);
}

export async function deleteInvoiceAction(id: string): Promise<MutationResult> {
  try {
    await deleteInvoiceDraft(id);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not delete." };
  }
  revalidatePath("/");
  return {};
}

export async function voidInvoiceAction(id: string): Promise<MutationResult> {
  try {
    await voidInvoice(id);
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not void." };
  }
  revalidatePath("/");
  revalidatePath(`/invoices/${id}`);
  return {};
}
