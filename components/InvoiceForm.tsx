"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";
import { calculateInvoiceTotal } from "@/lib/calculateInvoiceTotal";
import { validateInvoiceForm } from "@/lib/validateInvoice";
import { num } from "@/lib/parseNumber";
import { fractionToPercent, percentToFraction } from "@/lib/percent";
import { buttonClass } from "@/components/ui/Button";
import { TotalsBreakdown } from "@/components/TotalsBreakdown";
import { INPUT } from "@/components/fieldStyles";
import {
  LineItemsEditor,
  emptyRow,
  type LineRow,
} from "@/components/LineItemsEditor";
import type { Invoice } from "@/lib/invoices";
import type {
  InvoiceActionInput,
  FormActionResult,
} from "@/app/invoices/actions";

const LABEL = "block eyebrow";

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
    taxRate: initial ? fractionToPercent(initial.taxRate) : "0",
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
  const focusErrorRef = useRef(false);

  // After a failed submit, move focus to the first invalid field so keyboard /
  // screen-reader users land on the problem instead of having to hunt for it.
  useEffect(() => {
    if (!focusErrorRef.current) return;
    focusErrorRef.current = false;
    formRef.current
      ?.querySelector<HTMLElement>('[aria-invalid="true"]')
      ?.focus();
  }, [errors]);

  const setField = (k: keyof typeof fields, v: string) =>
    setFields((f) => ({ ...f, [k]: v }));

  // Live totals from the current (parsed) inputs.
  const totals = calculateInvoiceTotal({
    lineItems: rows.map((r) => ({
      quantity: num(r.quantity) || 0,
      unitPrice: num(r.unitPrice) || 0,
    })),
    discount: num(fields.discount) || 0,
    taxRate: percentToFraction(fields.taxRate) || 0,
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
      taxRate: percentToFraction(fields.taxRate),
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
          label="Tax rate (%)"
          placeholder="8.5"
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

      <LineItemsEditor
        rows={rows}
        setRows={setRows}
        errors={errors}
        currency={fields.currency || "USD"}
      />

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
        <TotalsBreakdown totals={totals} currency={fields.currency || "USD"} />
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
