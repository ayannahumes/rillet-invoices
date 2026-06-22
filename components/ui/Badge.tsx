import type { ReactNode } from "react";

/**
 * Generic pill/badge shell. Carries only the shared shape (rounded, padded,
 * extra-small, inline); the caller supplies color/border/decoration via
 * `className`. Domain meaning (e.g. invoice status) lives in the wrapper.
 */
export function Badge({
  className = "",
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs leading-none ${className}`.trim()}
    >
      {children}
    </span>
  );
}
