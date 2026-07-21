import type { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: ReactNode;
}

export function Button({
  icon,
  children,
  className = "",
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex cursor-pointer items-center justify-center gap-3 rounded-card border border-border bg-bg px-6 py-4 font-body text-base font-semibold text-heading shadow-sm ${className}`}
      {...props}
    >
      {icon}
      {children}
    </button>
  );
}
