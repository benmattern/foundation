import type { ButtonHTMLAttributes } from "react";

import { buttonClass } from "./buttonStyles";
export function Button({
  variant = "secondary",
  busy,
  children,
  className = "",
  disabled,
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger";
  busy?: boolean;
}) {
  return (
    <button
      {...props}
      type={type}
      disabled={disabled || busy}
      aria-busy={busy || undefined}
      className={`${buttonClass(variant)} ${className}`}
    >
      {busy ? "Working…" : children}
    </button>
  );
}
