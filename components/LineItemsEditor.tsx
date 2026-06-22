"use client";

import { useEffect, useRef, type Dispatch, type SetStateAction } from "react";
import { formatMoney } from "@/lib/format";
import { num } from "@/lib/parseNumber";
import { INPUT } from "@/components/fieldStyles";

export type LineRow = {
  key: string;
  id?: string;
  description: string;
  quantity: string;
  unitPrice: string;
  accountCode: string;
};

export function emptyRow(): LineRow {
  return {
    key: crypto.randomUUID(),
    description: "",
    quantity: "1",
    unitPrice: "0",
    accountCode: "",
  };
}

/**
 * Editable line-items section of the invoice form. The row state lives in the
 * parent form (it also feeds totals and submit), so `rows`/`setRows`/`errors`/
 * `currency` come in as props. This component owns only the line-item markup and
 * the add/remove keyboard-focus management.
 *
 * Accessibility: each cell input has an `aria-label` (the column headers are
 * visual placeholders only), errors are wired via `aria-invalid` +
 * `aria-describedby`, the remove button is labelled per row and disabled at one
 * row, and the per-line amount carries an `sr-only` label.
 */
export function LineItemsEditor({
  rows,
  setRows,
  errors,
  currency,
}: {
  rows: LineRow[];
  setRows: Dispatch<SetStateAction<LineRow[]>>;
  errors: Record<string, string>;
  currency: string;
}) {
  const addLineBtnRef = useRef<HTMLButtonElement>(null);
  const lineFocusRef = useRef<"none" | "add" | "remove">("none");

  const setRow = (key: string, patch: Partial<LineRow>) =>
    setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...patch } : r)));

  // Keep focus sensible as rows are added/removed: a new row focuses its
  // description input; removing one returns focus to the "Add line" button.
  useEffect(() => {
    const action = lineFocusRef.current;
    if (action === "none") return;
    lineFocusRef.current = "none";
    if (action === "add") {
      document.getElementById(`line-${rows.length - 1}-description`)?.focus();
    } else {
      addLineBtnRef.current?.focus();
    }
  }, [rows.length]);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="eyebrow">Line items</h2>
        <button
          ref={addLineBtnRef}
          type="button"
          onClick={() => {
            lineFocusRef.current = "add";
            setRows((rs) => [...rs, emptyRow()]);
          }}
          className="rounded text-sm text-ink hover:underline"
        >
          + Add line
        </button>
      </div>
      {errors.lineItems && (
        <p className="mt-1 text-xs text-overdue">{errors.lineItems}</p>
      )}

      <div className="mt-3 space-y-3">
        {rows.map((r, i) => {
          const descErr = errors[`lineItems.${i}.description`];
          const qtyErr = errors[`lineItems.${i}.quantity`];
          const priceErr = errors[`lineItems.${i}.unitPrice`];
          return (
            <div key={r.key} className="rounded-lg border border-line p-3">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-12">
                <div className="sm:col-span-5">
                  <input
                    id={`line-${i}-description`}
                    className={INPUT}
                    placeholder="Description"
                    aria-label={`Line ${i + 1} description`}
                    value={r.description}
                    onChange={(e) =>
                      setRow(r.key, { description: e.target.value })
                    }
                    aria-invalid={descErr ? true : undefined}
                    aria-describedby={
                      descErr ? `line-${i}-description-error` : undefined
                    }
                  />
                  {descErr && (
                    <p
                      id={`line-${i}-description-error`}
                      className="mt-1 text-xs text-overdue"
                    >
                      {descErr}
                    </p>
                  )}
                </div>
                <div className="sm:col-span-2">
                  <input
                    id={`line-${i}-account`}
                    className={INPUT}
                    placeholder="Account"
                    aria-label={`Line ${i + 1} account code`}
                    value={r.accountCode}
                    onChange={(e) =>
                      setRow(r.key, { accountCode: e.target.value })
                    }
                  />
                </div>
                <div className="sm:col-span-2">
                  <input
                    id={`line-${i}-quantity`}
                    className={`${INPUT} text-right tabular-nums`}
                    placeholder="Qty"
                    inputMode="decimal"
                    aria-label={`Line ${i + 1} quantity`}
                    value={r.quantity}
                    onChange={(e) =>
                      setRow(r.key, { quantity: e.target.value })
                    }
                    aria-invalid={qtyErr ? true : undefined}
                    aria-describedby={
                      qtyErr ? `line-${i}-quantity-error` : undefined
                    }
                  />
                  {qtyErr && (
                    <p
                      id={`line-${i}-quantity-error`}
                      className="mt-1 text-xs text-overdue"
                    >
                      {qtyErr}
                    </p>
                  )}
                </div>
                <div className="sm:col-span-2">
                  <input
                    id={`line-${i}-unitPrice`}
                    className={`${INPUT} text-right tabular-nums`}
                    placeholder="Unit price"
                    inputMode="decimal"
                    aria-label={`Line ${i + 1} unit price`}
                    value={r.unitPrice}
                    onChange={(e) =>
                      setRow(r.key, { unitPrice: e.target.value })
                    }
                    aria-invalid={priceErr ? true : undefined}
                    aria-describedby={
                      priceErr ? `line-${i}-unitPrice-error` : undefined
                    }
                  />
                  {priceErr && (
                    <p
                      id={`line-${i}-unitPrice-error`}
                      className="mt-1 text-xs text-overdue"
                    >
                      {priceErr}
                    </p>
                  )}
                </div>
                <div className="flex items-center justify-end sm:col-span-1">
                  <button
                    type="button"
                    onClick={() => {
                      lineFocusRef.current = "remove";
                      setRows((rs) => rs.filter((x) => x.key !== r.key));
                    }}
                    disabled={rows.length === 1}
                    className="rounded text-faint hover:text-overdue disabled:cursor-not-allowed disabled:opacity-40"
                    aria-label={`Remove line ${i + 1}`}
                  >
                    <span aria-hidden="true">✕</span>
                  </button>
                </div>
              </div>
              <div className="mt-2 text-right text-sm tabular-nums text-muted">
                <span className="sr-only">Line {i + 1} amount: </span>
                {formatMoney(
                  (num(r.quantity) || 0) * (num(r.unitPrice) || 0),
                  currency,
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
