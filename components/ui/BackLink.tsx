import Link from "next/link";
import type { ReactNode } from "react";

/** Muted "← {label}" back navigation link. */
export function BackLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Link href={href} className="text-sm text-muted hover:text-ink">
      ← {children}
    </Link>
  );
}
