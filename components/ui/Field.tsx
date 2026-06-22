import type { ReactNode } from "react";

/** A labelled value (renders <dt>/<dd>; use inside a <dl>). */
export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div>
      <dt className="eyebrow">{label}</dt>
      <dd className="mt-1 text-ink">{children}</dd>
    </div>
  );
}
