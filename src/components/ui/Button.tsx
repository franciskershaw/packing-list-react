import type { ButtonHTMLAttributes, ReactNode } from "react";

// Shared base for every button-shaped atom so cursor/type aren't repeated per-component.
export function InteractiveButton({
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={`cursor-pointer ${className}`}
      {...props}
    />
  );
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: ReactNode;
  variant?:
    | "default"
    | "danger"
    | "dashed"
    | "primary"
    | "success"
    | "accent"
    | "secondary";
  /** Only affects default/danger — other variants are sized already. */
  size?: "default" | "compact";
}

const VARIANT_CLASSES: Record<NonNullable<ButtonProps["variant"]>, string> = {
  default:
    "rounded-card border border-border bg-bg px-6 py-4 font-body text-base font-semibold text-heading shadow-sm",
  danger:
    "rounded-card border-0 bg-notice-bg px-6 py-4 font-body text-base font-semibold text-notice-text shadow-sm",
  dashed:
    "w-full rounded-2xl border border-dashed border-[#c9bba6] py-3 text-sm font-bold text-tertiary",
  primary:
    "w-full rounded-2xl border-0 bg-accent px-6 py-4 font-body text-base font-bold text-on-accent shadow-sm hover:bg-accent-hover disabled:opacity-50",
  success:
    "rounded-full border-0 bg-accent-secondary px-5 py-2 text-sm font-bold text-on-accent shadow-sm disabled:opacity-50",
  accent:
    "rounded-full border-0 bg-accent px-5 py-2 text-sm font-bold text-on-accent shadow-sm hover:bg-accent-hover disabled:opacity-50",
  secondary:
    "w-full rounded-2xl border-0 bg-accent-secondary px-6 py-4 font-body text-base font-bold text-on-accent shadow-sm disabled:opacity-50",
};

const COMPACT_VARIANT_CLASSES: Partial<
  Record<NonNullable<ButtonProps["variant"]>, string>
> = {
  default:
    "rounded-card border border-border bg-bg px-5 py-2.5 font-body text-sm font-semibold text-heading shadow-sm",
  danger:
    "rounded-card border-0 bg-notice-bg px-5 py-2.5 font-body text-sm font-semibold text-notice-text shadow-sm",
};

export function Button({
  icon,
  children,
  className = "",
  variant = "default",
  size = "default",
  ...props
}: ButtonProps) {
  const variantClasses =
    (size === "compact" && COMPACT_VARIANT_CLASSES[variant]) ||
    VARIANT_CLASSES[variant];
  return (
    <InteractiveButton
      className={`inline-flex items-center justify-center gap-3 ${variantClasses} ${className}`}
      {...props}
    >
      {icon}
      {children}
    </InteractiveButton>
  );
}
