"use client";

import { useState, useTransition } from "react";
import { calculateInvoiceTotal } from "@/lib/calculateInvoiceTotal";
import { validateInvoiceForm } from "@/lib/validateInvoice";
import { formatMoney } from "@/lib/format";
import type { Invoice } from "@/lib/invoices";
import type {
  InvoiceActionInput,
  FormActionResult,
} from "@/app/invoices/actions";

type LineRow = {
  key: string;
  id?: string;
  description: string;
  quantity: string;
  unitPrice: string;
  accountCode: string;
};

const INPUT =
  "w-full rounded border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-ink";
const LABEL = "block text-xs uppercase tracking-wider text-faint";

function emptyRow(): LineRow {
  return {
    key: crypto.randomUUID(),
    description: "",
    quantity: "1",
    unitPrice: "0",
    accountCode: "",
  };
}

function num(value: string): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : NaN;
}

export function InvoiceForm({
  action,
  initial,
  submitLabel,
}: {
  action: (input: InvoiceActionInput) => Promise<FormActionResult>;
  initial?: Invoice;
  submitLabel: string;
}) {
  const today = new Date().toISOString().slice(0, 10);

  const [fields, setFields] = useState({
    invoiceNumber: initial?.invoiceNumber ?? "",
    customerName: initial?.customerName ?? "",
    billingEmail: initial?.billingEmail ?? "",
    billingAddress: initial?.billingAddress ?? "",
    paymentTerms: initial?.paymentTerms ?? "",
    currency: initial?.currency ?? "USD",
    issueDate: initial?.issueDate ?? today,
    dueDate: initial?.dueDate ?? "",
    memo: initial?.memo ?? "",
    taxRate: initial ? String(initial.taxRate) : "0",
    discount: initial ? String(initial.discount) : "0",
  });

  const [rows, setRows] = useState<LineRow[]>(
    initial && initial.lineItems.length
      ? initial.lineItems.map((li) => ({
          key: li.id,
          id: li.id,
          description: li.description,
          quantity: String(li.quantity),
          unitPrice: String(li.unitPrice),
          accountCode: li.accountCode,
        }))
      : [emptyRow()],
  );

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const setField = (k: keyof typeof fields, v: string) =>
    setFields((f) => ({ ...f, [k]: v }));
  const setRow = (key: string, patch: Partial<LineRow>) =>
    setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...patch } : r)));

  // Live totals from the current (parsed) inputs.
  const totals = calculateInvoiceTotal({
    lineItems: rows.map((r) => ({
      quantity: num(r.quantity) || 0,
      unitPrice: num(r.unitPrice) || 0,
    })),
    discount: num(fields.discount) || 0,
    taxRate: num(fields.taxRate) || 0,
  });

  function buildInput(): InvoiceActionInput {
    return {
      invoiceNumber: fields.invoiceNumber.trim(),
      customerName: fields.customerName.trim(),
      billingEmail: fields.billingEmail.trim() || null,
      billingAddress: fields.billingAddress.trim() || null,
      paymentTerms: fields.paymentTerms.trim() || null,
      currency: fields.currency.trim(),
      issueDate: fields.issueDate,
      dueDate: fields.dueDate || null,
      memo: fields.memo.trim() || null,
      taxRate: num(fields.taxRate),
      discount: num(fields.discount),
      lineItems: rows.map((r) => ({
        id: r.id ?? crypto.randomUUID(),
        description: r.description.trim(),
        quantity: num(r.quantity),
        unitPrice: num(r.unitPrice),
        accountCode: r.accountCode.trim(),
      })),
    };
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    const input = buildInput();
    const { valid, errors: errs } = validateInvoiceForm(input);
    if (!valid) {
      setErrors(errs);
      return;
    }
    setErrors({});
    startTransition(async () => {
      const result = await action(input);
      // A successful action redirects server-side; only failures return here.
      if (result?.errors) setErrors(result.errors);
      else if (result === undefined) return;
    });
  }

  const err = (key: string) =>
    errors[key] ? (
      <p className="mt-1 text-xs text-overdue">{errors[key]}</p>
    ) : null;

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      <div className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2">
        <div>
          <label className={LABEL}>Customer name</label>
          <input
            className={INPUT}
            value={fields.customerName}
            onChange={(e) => setField("customerName", e.target.value)}
          />
          {err("customerName")}
        </div>
        <div>
          <label className={LABEL}>Invoice number</label>
          <input
            className={INPUT}
            value={fields.invoiceNumber}
            onChange={(e) => setField("invoiceNumber", e.target.value)}
          />
          {err("invoiceNumber")}
        </div>
        <div>
          <label className={LABEL}>Billing email</label>
          <input
            className={INPUT}
            value={fields.billingEmail}
            onChange={(e) => setField("billingEmail", e.target.value)}
          />
        </div>
        <div>
          <label className={LABEL}>Payment terms</label>
          <input
            className={INPUT}
            placeholder="Net 30"
            value={fields.paymentTerms}
            onChange={(e) => setField("paymentTerms", e.target.value)}
          />
        </div>
        <div className="sm:col-span-2">
          <label className={LABEL}>Billing address</label>
          <input
            className={INPUT}
            value={fields.billingAddress}
            onChange={(e) => setField("billingAddress", e.target.value)}
          />
        </div>
        <div>
          <label className={LABEL}>Currency</label>
          <input
            className={INPUT}
            value={fields.currency}
            onChange={(e) => setField("currency", e.target.value)}
          />
          {err("currency")}
        </div>
        <div>
          <label className={LABEL}>Issue date</label>
          <input
            type="date"
            className={INPUT}
            value={fields.issueDate}
            onChange={(e) => setField("issueDate", e.target.value)}
          />
          {err("issueDate")}
        </div>
        <div>
          <label className={LABEL}>Due date</label>
          <input
            type="date"
            className={INPUT}
            value={fields.dueDate}
            onChange={(e) => setField("dueDate", e.target.value)}
          />
          {err("dueDate")}
        </div>
        <div>
          <label className={LABEL}>Tax rate (fraction, e.g. 0.085)</label>
          <input
            className={INPUT}
            value={fields.taxRate}
            onChange={(e) => setField("taxRate", e.target.value)}
          />
          {err("taxRate")}
        </div>
        <div>
          <label className={LABEL}>Discount (amount)</label>
          <input
            className={INPUT}
            value={fields.discount}
            onChange={(e) => setField("discount", e.target.value)}
          />
          {err("discount")}
        </div>
      </div>

      {/* Line items */}
      <div>
        <div className="flex items-center justify-between">
          <h2 className="text-xs uppercase tracking-wider text-faint">
            Line items
          </h2>
          <button
            type="button"
            onClick={() => setRows((rs) => [...rs, emptyRow()])}
            className="text-sm text-ink hover:underline"
          >
            + Add line
          </button>
        </div>
        {err("lineItems")}

        <div className="mt-3 space-y-3">
          {rows.map((r, i) => (
            <div key={r.key} className="rounded-lg border border-line p-3">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-12">
                <div className="sm:col-span-5">
                  <input
                    className={INPUT}
                    placeholder="Description"
                    value={r.description}
                    onChange={(e) => setRow(r.key, { description: e.target.value })}
                  />
                  {err(`lineItems.${i}.description`)}
                </div>
                <div className="sm:col-span-2">
                  <input
                    className={INPUT}
                    placeholder="Account"
                    value={r.accountCode}
                    onChange={(e) => setRow(r.key, { accountCode: e.target.value })}
                  />
                </div>
                <div className="sm:col-span-2">
                  <input
                    className={`${INPUT} text-right tabular-nums`}
                    placeholder="Qty"
                    value={r.quantity}
                    onChange={(e) => setRow(r.key, { quantity: e.target.value })}
                  />
                  {err(`lineItems.${i}.quantity`)}
                </div>
                <div className="sm:col-span-2">
                  <input
                    className={`${INPUT} text-right tabular-nums`}
                    placeholder="Unit price"
                    value={r.unitPrice}
                    onChange={(e) => setRow(r.key, { unitPrice: e.target.value })}
                  />
                  {err(`lineItems.${i}.unitPrice`)}
                </div>
                <div className="flex items-center justify-end sm:col-span-1">
                  <button
                    type="button"
                    onClick={() =>
                      setRows((rs) =>
                        rs.length > 1 ? rs.filter((x) => x.key !== r.key) : rs,
                      )
                    }
                    className="text-faint hover:text-overdue"
                    aria-label="Remove line"
                  >
                    ✕
                  </button>
                </div>
              </div>
              <div className="mt-2 text-right text-sm tabular-nums text-muted">
                {formatMoney(
                  (num(r.quantity) || 0) * (num(r.unitPrice) || 0),
                  fields.currency || "USD",
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Memo */}
      <div>
        <label className={LABEL}>Memo</label>
        <textarea
          className={INPUT}
          rows={2}
          value={fields.memo}
          onChange={(e) => setField("memo", e.target.value)}
        />
      </div>

      {/* Live totals */}
      <div className="flex justify-end">
        <dl className="w-full max-w-xs space-y-2 text-sm tabular-nums">
          <div className="flex justify-between">
            <dt className="text-muted">Subtotal</dt>
            <dd className="text-ink">
              {formatMoney(totals.subtotal, fields.currency || "USD")}
            </dd>
          </div>
          {totals.discount > 0 && (
            <div className="flex justify-between">
              <dt className="text-muted">Discount</dt>
              <dd className="text-ink">
                −{formatMoney(totals.discount, fields.currency || "USD")}
              </dd>
            </div>
          )}
          <div className="flex justify-between">
            <dt className="text-muted">Tax</dt>
            <dd className="text-ink">
              {formatMoney(totals.taxAmount, fields.currency || "USD")}
            </dd>
          </div>
          <div className="flex justify-between border-t border-line pt-2 text-base">
            <dt className="text-ink">Total</dt>
            <dd className="font-medium text-ink">
              {formatMoney(totals.total, fields.currency || "USD")}
            </dd>
          </div>
        </dl>
      </div>

      {formError && <p className="text-sm text-overdue">{formError}</p>}

      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={pending}
          className="rounded bg-ink px-4 py-2 text-sm text-bg disabled:opacity-50"
        >
          {pending ? "Saving…" : submitLabel}
        </button>
      </div>
    </form>
  );
}
