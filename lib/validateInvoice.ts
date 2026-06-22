// Pure validation for the invoice create/edit form. Returns a flat map of
// field-keyed error messages; line-item errors use "lineItems.<index>.<field>".

export interface InvoiceFormLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  accountCode?: string;
}

export interface InvoiceFormInput {
  invoiceNumber: string;
  customerName: string;
  currency: string;
  issueDate: string; // 'YYYY-MM-DD'
  dueDate?: string | null;
  taxRate: number; // fraction 0–1
  discount: number; // absolute, >= 0
  lineItems: InvoiceFormLineItem[];
}

export type InvoiceFormErrors = Record<string, string>;

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function isValidDate(value: string): boolean {
  if (!DATE_RE.test(value)) return false;
  const t = Date.parse(`${value}T00:00:00Z`);
  return !Number.isNaN(t);
}

export function validateInvoiceForm(input: InvoiceFormInput): {
  valid: boolean;
  errors: InvoiceFormErrors;
} {
  const errors: InvoiceFormErrors = {};

  if (!input.invoiceNumber?.trim()) {
    errors.invoiceNumber = "Invoice number is required.";
  }
  if (!input.customerName?.trim()) {
    errors.customerName = "Customer name is required.";
  }
  if (!input.currency?.trim()) {
    errors.currency = "Currency is required.";
  }

  if (!input.issueDate || !isValidDate(input.issueDate)) {
    errors.issueDate = "A valid issue date is required.";
  }

  if (input.dueDate) {
    if (!isValidDate(input.dueDate)) {
      errors.dueDate = "Due date must be a valid date.";
    } else if (isValidDate(input.issueDate) && input.dueDate < input.issueDate) {
      errors.dueDate = "Due date cannot be before the issue date.";
    }
  }

  if (!Number.isFinite(input.taxRate) || input.taxRate < 0 || input.taxRate > 1) {
    errors.taxRate = "Tax rate must be between 0 and 1 (e.g. 0.085).";
  }
  if (!Number.isFinite(input.discount) || input.discount < 0) {
    errors.discount = "Discount cannot be negative.";
  }

  if (!input.lineItems || input.lineItems.length === 0) {
    errors.lineItems = "Add at least one line item.";
  } else {
    input.lineItems.forEach((item, i) => {
      if (!item.description?.trim()) {
        errors[`lineItems.${i}.description`] = "Description is required.";
      }
      if (!Number.isFinite(item.quantity) || item.quantity <= 0) {
        errors[`lineItems.${i}.quantity`] = "Quantity must be greater than 0.";
      }
      if (!Number.isFinite(item.unitPrice) || item.unitPrice < 0) {
        errors[`lineItems.${i}.unitPrice`] = "Unit price cannot be negative.";
      }
    });
  }

  return { valid: Object.keys(errors).length === 0, errors };
}
