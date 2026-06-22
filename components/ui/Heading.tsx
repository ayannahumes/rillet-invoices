import type { ReactNode } from "react";

/** The serif page-title heading (the editorial signature). */
export function Heading({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <h1 className={`font-serif text-4xl font-medium text-ink ${className}`.trim()}>
      {children}
    </h1>
  );
}
