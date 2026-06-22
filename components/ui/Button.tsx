import type { ButtonHTMLAttributes } from "react";

export type ButtonVariant = "primary" | "outline";
export type ButtonSize = "default" | "sm";

const VARIANT: Record<ButtonVariant, string> = {
  primary: "bg-ink text-bg hover:opacity-90",
  outline: "border border-line text-ink hover:bg-surface",
};

const SIZE: Record<ButtonSize, string> = {
  default: "px-4 py-2 text-sm",
  sm: "px-3 py-1.5 text-sm",
};

/**
 * Class string for a button-styled element. Use for links rendered as buttons
 * (`<Link className={buttonClass("outline")}>`) so anchors and <button>s match.
 */
export function buttonClass(
  variant: ButtonVariant = "outline",
  size: ButtonSize = "default",
  className = "",
): string {
  return `inline-flex items-center justify-center rounded transition-colors disabled:opacity-50 ${VARIANT[variant]} ${SIZE[size]} ${className}`.trim();
}

export function Button({
  variant = "outline",
  size = "default",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
}) {
  return <button className={buttonClass(variant, size, className)} {...props} />;
}
