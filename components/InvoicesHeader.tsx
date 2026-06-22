import Link from "next/link";
import { ORG } from "@/lib/org";
import { Heading } from "@/components/ui/Heading";
import { buttonClass } from "@/components/ui/Button";

// The invoices page header — title, org / base-currency subtitle, and the
// New-invoice action. Shared by the page and its loading state so the chrome is
// identical and doesn't flash when the skeleton swaps to content.
export function InvoicesHeader() {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <Heading>Invoices</Heading>
        <p className="mt-1 text-muted">
          {ORG.name} <span aria-hidden="true">·</span> base currency{" "}
          {ORG.baseCurrency}
        </p>
      </div>
      <Link
        href="/invoices/new"
        className={buttonClass("outline", "default", "gap-1.5")}
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <path d="M12 5v14M5 12h14" />
        </svg>
        New invoice
      </Link>
    </div>
  );
}
