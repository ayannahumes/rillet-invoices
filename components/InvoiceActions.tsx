"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteInvoiceAction, voidInvoiceAction } from "@/app/invoices/actions";
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
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const isDraft = status === "Draft";
  const isVoid = status === "Void";
  const editable = status === "Draft" || status === "Sent";

  function handleDelete() {
    if (
      !window.confirm(
        "Delete this draft invoice? It hasn't been issued, so it can be removed permanently. This cannot be undone.",
      )
    )
      return;
    setError(null);
    startTransition(async () => {
      const res = await deleteInvoiceAction(id);
      if (res.error) setError(res.error);
      else router.push("/");
    });
  }

  function handleVoid() {
    if (
      !window.confirm(
        "This invoice has been issued, so it can't be deleted — removing it would break the audit trail. " +
          "Voiding keeps the record on file and marks it cancelled. Void this invoice?",
      )
    )
      return;
    setError(null);
    startTransition(async () => {
      const res = await voidInvoiceAction(id);
      if (res.error) setError(res.error);
      else router.refresh();
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
      {error && <p className="text-xs text-overdue">{error}</p>}
    </div>
  );
}
