import type { ElementType, ReactNode } from "react";

/** Shared "eyebrow" label style (uppercase, tracked, faint). */
export const labelClass = "text-xs uppercase tracking-wider text-faint";

/** Renders the eyebrow label as a configurable element (div/dt/span/label). */
export function Label({
  as: Tag = "div",
  className = "",
  children,
}: {
  as?: ElementType;
  className?: string;
  children: ReactNode;
}) {
  return <Tag className={`${labelClass} ${className}`.trim()}>{children}</Tag>;
}
