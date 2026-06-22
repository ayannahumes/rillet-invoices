import { sql } from "@/lib/db";

export type InvoiceStatus = "Draft" | "Sent" | "Paid" | "Void";
export type PaymentStatus = "Open" | "Unsent" | "Overdue" | "Paid" | "Voided";

export interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  accountCode: string;
}

export interface ActivityEntry {
  id: string;
  timestamp: string; // ISO 8601
  actor: string;
  action: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  customerName: string;
  billingEmail: string | null;
  billingAddress: string | null;
  paymentTerms: string | null;
  status: InvoiceStatus;
  paymentStatus: PaymentStatus;
  currency: string;
  issueDate: string; // 'YYYY-MM-DD'
  dueDate: string | null; // 'YYYY-MM-DD'
  paidDate: string | null; // 'YYYY-MM-DD'
  memo: string | null;
  taxRate: number; // fraction, e.g. 0.085
  discount: number; // absolute amount
  lineItems: LineItem[];
  activity: ActivityEntry[];
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}

export interface CreateInvoiceInput {
  invoiceNumber: string;
  customerName: string;
  billingEmail?: string | null;
  billingAddress?: string | null;
  paymentTerms?: string | null;
  status?: InvoiceStatus;
  paymentStatus?: PaymentStatus;
  currency?: string;
  issueDate?: string; // 'YYYY-MM-DD'; defaults to today
  dueDate?: string | null;
  paidDate?: string | null;
  memo?: string | null;
  taxRate?: number;
  discount?: number;
  lineItems?: LineItem[];
  activity?: ActivityEntry[];
}

// Date columns are cast to text so they come back as 'YYYY-MM-DD' strings rather
// than Date objects (which would shift across timezones).
const COLUMNS = `
  id,
  invoice_number,
  customer_name,
  billing_email,
  billing_address,
  payment_terms,
  status,
  payment_status,
  currency,
  issue_date::text AS issue_date,
  due_date::text   AS due_date,
  paid_date::text  AS paid_date,
  memo,
  tax_rate,
  discount,
  line_items,
  activity,
  created_at,
  updated_at
`;

type Row = Record<string, unknown>;

function mapRow(r: Row): Invoice {
  return {
    id: r.id as string,
    invoiceNumber: r.invoice_number as string,
    customerName: r.customer_name as string,
    billingEmail: (r.billing_email as string | null) ?? null,
    billingAddress: (r.billing_address as string | null) ?? null,
    paymentTerms: (r.payment_terms as string | null) ?? null,
    status: r.status as InvoiceStatus,
    paymentStatus: r.payment_status as PaymentStatus,
    currency: r.currency as string,
    issueDate: r.issue_date as string,
    dueDate: (r.due_date as string | null) ?? null,
    paidDate: (r.paid_date as string | null) ?? null,
    memo: (r.memo as string | null) ?? null,
    // numeric columns arrive as strings from the driver — coerce to number.
    taxRate: Number(r.tax_rate),
    discount: Number(r.discount),
    lineItems: (r.line_items as LineItem[]) ?? [],
    activity: (r.activity as ActivityEntry[]) ?? [],
    createdAt: new Date(r.created_at as string).toISOString(),
    updatedAt: new Date(r.updated_at as string).toISOString(),
  };
}

/** List invoices, most recently issued first. */
export async function listInvoices(): Promise<Invoice[]> {
  const rows = await sql.query(
    `SELECT ${COLUMNS} FROM invoices
     ORDER BY issue_date DESC, invoice_number DESC`,
  );
  return (rows as Row[]).map(mapRow);
}

/** Fetch a single invoice by its uuid, or null if not found. */
export async function getInvoiceById(id: string): Promise<Invoice | null> {
  const rows = (await sql.query(
    `SELECT ${COLUMNS} FROM invoices WHERE id = $1`,
    [id],
  )) as Row[];
  return rows.length ? mapRow(rows[0]) : null;
}

/** Create an invoice and return the persisted record. */
export async function createInvoice(input: CreateInvoiceInput): Promise<Invoice> {
  const today = new Date().toISOString().slice(0, 10);

  const rows = (await sql.query(
    `INSERT INTO invoices (
       invoice_number, customer_name, billing_email, billing_address,
       payment_terms, status, payment_status, currency,
       issue_date, due_date, paid_date, memo, tax_rate, discount,
       line_items, activity
     ) VALUES (
       $1, $2, $3, $4,
       $5, $6, $7, $8,
       $9, $10, $11, $12, $13, $14,
       $15::jsonb, $16::jsonb
     )
     RETURNING ${COLUMNS}`,
    [
      input.invoiceNumber,
      input.customerName,
      input.billingEmail ?? null,
      input.billingAddress ?? null,
      input.paymentTerms ?? null,
      input.status ?? "Draft",
      input.paymentStatus ?? "Unsent",
      input.currency ?? "USD",
      input.issueDate ?? today,
      input.dueDate ?? null,
      input.paidDate ?? null,
      input.memo ?? null,
      input.taxRate ?? 0,
      input.discount ?? 0,
      JSON.stringify(input.lineItems ?? []),
      JSON.stringify(input.activity ?? []),
    ],
  )) as Row[];

  return mapRow(rows[0]);
}
