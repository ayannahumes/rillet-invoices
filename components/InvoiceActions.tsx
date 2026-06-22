"use client";

import Link from "next/link";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteInvoiceAction, voidInvoiceAction } from "@/app/invoices/actions";
import { useToast } from "@/components/Toast";
import { Button, buttonClass } from "@/components/ui/Button";
import type { InvoiceStatus } from "@/lib/invoices";

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
          <Link
            href={`/invoices/${id}/edit`}
            className={buttonClass("outline", "sm")}
          >
            Edit
          </Link>
        )}
        {isDraft ? (
          <Button
            size="sm"
            onClick={handleDelete}
            disabled={pending}
            aria-busy={pending}
          >
            Delete
          </Button>
        ) : isVoid ? null : (
          <Button
            size="sm"
            onClick={handleVoid}
            disabled={pending}
            aria-busy={pending}
          >
            Void
          </Button>
        )}
      </div>
    </div>
  );
}
