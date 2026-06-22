"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/Toast";
import { calculateInvoiceTotal } from "@/lib/calculateInvoiceTotal";
import { validateInvoiceForm } from "@/lib/validateInvoice";
import { formatMoney } from "@/lib/format";
import { buttonClass } from "@/components/ui/Button";
import { labelClass } from "@/components/ui/Label";
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
const LABEL = `block ${labelClass}`;

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

/**
 * A labelled text input with its error wired up for assistive tech: the `<label>`
 * is associated via `htmlFor`/`id`, and when there's an error the input gets
 * `aria-invalid` plus `aria-describedby` pointing at the error message.
 */
function TextField({
  id,
  label,
  value,
  onChange,
  error,
  type = "text",
  placeholder,
  className,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  type?: string;
  placeholder?: string;
  className?: string;
}) {
  const errorId = `${id}-error`;
  return (
    <div className={className}>
      <label htmlFor={id} className={LABEL}>
        {label}
      </label>
      <input
        id={id}
        type={type}
        placeholder={placeholder}
        className={INPUT}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
      />
      {error && (
        <p id={errorId} className="mt-1 text-xs text-overdue">
          {error}
        </p>
      )}
    </div>
  );
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
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const { toast } = useToast();

  const formRef = useRef<HTMLFormElement>(null);
  const addLineBtnRef = useRef<HTMLButtonElement>(null);
  const focusErrorRef = useRef(false);
  const lineFocusRef = useRef<"none" | "add" | "remove">("none");

  // After a failed submit, move focus to the first invalid field so keyboard /
  // screen-reader users land on the problem instead of having to hunt for it.
  useEffect(() => {
    if (!focusErrorRef.current) return;
    focusErrorRef.current = false;
    formRef.current
      ?.querySelector<HTMLElement>('[aria-invalid="true"]')
      ?.focus();
  }, [errors]);

  // Keep focus sensible as line rows are added/removed: a new row focuses its
  // description input; removing a row returns focus to the "Add line" button.
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
    const input = buildInput();
    const { valid, errors: errs } = validateInvoiceForm(input);
    if (!valid) {
      setErrors(errs);
      focusErrorRef.current = true;
      toast("Please fix the highlighted fields.", "warning");
      return;
    }
    setErrors({});
    startTransition(async () => {
      const result = await action(input);
      if (result.ok) {
        toast(initial ? "Invoice saved" : "Invoice created", "success");
        router.push(`/invoices/${result.id}`);
      } else {
        setErrors(result.errors);
        focusErrorRef.current = true;
        toast("Please fix the highlighted fields.", "warning");
      }
    });
  }

  const err = (key: string) =>
    errors[key] ? (
      <p className="mt-1 text-xs text-overdue">{errors[key]}</p>
    ) : null;

  return (
    <form ref={formRef} onSubmit={onSubmit} noValidate className="space-y-8">
      <div className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2">
        <TextField
          id="customerName"
          label="Customer name"
          value={fields.customerName}
          onChange={(v) => setField("customerName", v)}
          error={errors.customerName}
        />
        <TextField
          id="invoiceNumber"
          label="Invoice number"
          value={fields.invoiceNumber}
          onChange={(v) => setField("invoiceNumber", v)}
          error={errors.invoiceNumber}
        />
        <TextField
          id="billingEmail"
          label="Billing email"
          type="email"
          value={fields.billingEmail}
          onChange={(v) => setField("billingEmail", v)}
        />
        <TextField
          id="paymentTerms"
          label="Payment terms"
          placeholder="Net 30"
          value={fields.paymentTerms}
          onChange={(v) => setField("paymentTerms", v)}
        />
        <TextField
          id="billingAddress"
          label="Billing address"
          className="sm:col-span-2"
          value={fields.billingAddress}
          onChange={(v) => setField("billingAddress", v)}
        />
        <TextField
          id="currency"
          label="Currency"
          value={fields.currency}
          onChange={(v) => setField("currency", v)}
          error={errors.currency}
        />
        <TextField
          id="issueDate"
          label="Issue date"
          type="date"
          value={fields.issueDate}
          onChange={(v) => setField("issueDate", v)}
          error={errors.issueDate}
        />
        <TextField
          id="dueDate"
          label="Due date"
          type="date"
          value={fields.dueDate}
          onChange={(v) => setField("dueDate", v)}
          error={errors.dueDate}
        />
        <TextField
          id="taxRate"
          label="Tax rate (fraction, e.g. 0.085)"
          value={fields.taxRate}
          onChange={(v) => setField("taxRate", v)}
          error={errors.taxRate}
        />
        <TextField
          id="discount"
          label="Discount (amount)"
          value={fields.discount}
          onChange={(v) => setField("discount", v)}
          error={errors.discount}
        />
      </div>

      {/* Line items */}
      <div>
        <div className="flex items-center justify-between">
          <h2 className="text-xs uppercase tracking-wider text-faint">
            Line items
          </h2>
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
        {err("lineItems")}

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
                    fields.currency || "USD",
                  )}
                </div>
              </div>
            );
          })}
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

      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={pending}
          aria-busy={pending}
          className={buttonClass("primary")}
        >
          {pending ? "Saving…" : submitLabel}
        </button>
      </div>
    </form>
  );
}
