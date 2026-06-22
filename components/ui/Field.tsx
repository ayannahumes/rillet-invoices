import type { ReactNode } from "react";
import { labelClass } from "./Label";

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
      <dt className={labelClass}>{label}</dt>
      <dd className="mt-1 text-ink">{children}</dd>
    </div>
  );
}
