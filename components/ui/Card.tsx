import type { ReactNode } from "react";

/** Bordered surface container (e.g. table cards). Pass `overflow-x-auto` etc. via className. */
export function Card({
  className = "",
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={`rounded-lg border border-line bg-surface ${className}`.trim()}>
      {children}
    </div>
  );
}
