"use client";

import Link from "next/link";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteInvoiceAction, voidInvoiceAction } from "@/app/invoices/actions";
import { useToast } from "@/components/Toast";
import type { InvoiceStatus } from "@/lib/invoices";

const BTN =
  "rounded border border-line px-3 py-1.5 text-sm text-ink transition-colors hover:bg-bg disabled:opacity-50";

export function InvoiceActions({
  id,
  status,
}: {
  id: string;
  status: InvoiceStatus;
}) {
  const router = useRouter();
  const { toast, confirm } = useToast();
  const [pending, startTransition] = useTransition();

  const isDraft = status === "Draft";
  const isVoid = status === "Void";
  const editable = status === "Draft" || status === "Sent";

  async function handleDelete() {
    const ok = await confirm(
      "Delete this draft invoice? It hasn't been issued, so it can be removed permanently. This cannot be undone.",
      { confirmLabel: "Delete" },
    );
    if (!ok) return;
    startTransition(async () => {
      const res = await deleteInvoiceAction(id);
      if (res.ok) {
        toast("Invoice deleted.", "success");
        router.push("/");
      } else {
        toast(res.error, "error");
      }
    });
  }

  async function handleVoid() {
    const ok = await confirm(
      "This invoice has been issued, so it can't be deleted — removing it would break the audit trail. " +
        "Voiding keeps the record on file and marks it cancelled. Void this invoice?",
      { confirmLabel: "Void" },
    );
    if (!ok) return;
    startTransition(async () => {
      const res = await voidInvoiceAction(id);
      if (res.ok) {
        toast("Invoice voided.", "warning");
        router.refresh();
      } else {
        toast(res.error, "error");
      }
    });
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex items-center gap-2">
        {editable && (
          <Link href={`/invoices/${id}/edit`} className={BTN}>
            Edit
          </Link>
        )}
        {isDraft ? (
          <button type="button" onClick={handleDelete} disabled={pending} className={BTN}>
            Delete
          </button>
        ) : isVoid ? null : (
          <button type="button" onClick={handleVoid} disabled={pending} className={BTN}>
            Void
          </button>
        )}
      </div>
    </div>
  );
}
