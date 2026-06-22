"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

// Makes the whole table row clickable. The cells (including the customer-name
// Link) are rendered on the server and passed in as children; this client
// wrapper only adds row-level click navigation for mouse users. Keyboard users
// still navigate via the real <Link> inside the row.
export function InvoiceRow({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  const router = useRouter();
  return (
    <tr
      onClick={() => router.push(href)}
      className="cursor-pointer border-b border-line last:border-0 hover:bg-bg"
    >
      {children}
    </tr>
  );
}
