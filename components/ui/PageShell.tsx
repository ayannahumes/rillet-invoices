import type { ReactNode } from "react";

type Width = "md" | "lg";

const WIDTH: Record<Width, string> = {
  md: "max-w-3xl",
  lg: "max-w-5xl",
};

/**
 * Page `<main>` wrapper. `width` controls the max width; `center` switches to the
 * vertically-centered layout used by empty / error / not-found states.
 */
export function PageShell({
  width = "md",
  center = false,
  className = "",
  children,
}: {
  width?: Width;
  center?: boolean;
  className?: string;
  children: ReactNode;
}) {
  const base = center
    ? `mx-auto flex min-h-[60vh] ${WIDTH[width]} flex-col items-center justify-center px-6 text-center`
    : `mx-auto ${WIDTH[width]} px-6 py-10 md:px-8`;
  return <main className={`${base} ${className}`.trim()}>{children}</main>;
}
