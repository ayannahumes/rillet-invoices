-- 0001_init: single-model Invoice.
--
-- Customer details, line items, and activity are EMBEDDED in the invoice row
-- (the README's "single-model approach"): customer fields are inline columns,
-- line_items and activity are jsonb. Tradeoff: simple reads, less queryable
-- than relations — acceptable for this scope.
--
-- Derived values are NEVER stored (computed in the app layer):
--   subtotal, tax amount, total; due-date risk; outstanding totals by currency.

CREATE TABLE invoices (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number   text NOT NULL UNIQUE,

  -- Embedded customer / billing details
  customer_name    text NOT NULL,
  billing_email    text,
  billing_address  text,
  payment_terms    text,            -- 'Net 15' | 'Net 30' | 'Net 45' | 'Due on receipt'

  -- Lifecycle status vs. payment status (distinct dimensions)
  status           text NOT NULL DEFAULT 'Draft'
                     CHECK (status IN ('Draft', 'Sent', 'Paid', 'Void')),
  payment_status   text NOT NULL DEFAULT 'Unsent'
                     CHECK (payment_status IN ('Open', 'Unsent', 'Overdue', 'Paid', 'Voided')),

  currency         text NOT NULL DEFAULT 'USD',   -- USD | CAD | GBP | ...

  issue_date       date NOT NULL DEFAULT current_date,
  due_date         date,
  paid_date        date,            -- present when paid

  memo             text,
  tax_rate         numeric(6, 4) NOT NULL DEFAULT 0,    -- fraction, e.g. 0.0850
  discount         numeric(12, 2) NOT NULL DEFAULT 0,   -- absolute amount

  -- Embedded JSON collections
  line_items       jsonb NOT NULL DEFAULT '[]'::jsonb,  -- [{ id, description, quantity, unitPrice, accountCode }]
  activity         jsonb NOT NULL DEFAULT '[]'::jsonb,  -- [{ id, timestamp, actor, action }]

  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()    -- powers "last updated"
);

CREATE INDEX invoices_status_idx ON invoices(status);
CREATE INDEX invoices_payment_status_idx ON invoices(payment_status);
CREATE INDEX invoices_currency_idx ON invoices(currency);
