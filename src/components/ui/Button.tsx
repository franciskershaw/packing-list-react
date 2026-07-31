import type { ButtonHTMLAttributes, ReactNode } from "react";

// Invisible inset expands every button's tap target to the 44px touch guideline.
export function InteractiveButton({
  className = "",
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={`relative cursor-pointer ${className}`}
      {...props}
    >
      <span aria-hidden="true" className="absolute -inset-2.5" />
      {children}
    </button>
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
    | "secondary"
    | "subtle"
    | "outline";
  size?: "default" | "compact" | "split";
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
  subtle:
    "rounded-full border-0 bg-bg-subtle px-5 py-2 text-sm font-bold text-heading disabled:opacity-50",
  outline:
    "rounded-full border border-accent bg-bg px-5 py-2 text-sm font-bold text-accent shadow-sm disabled:opacity-50",
};

const COMPACT_VARIANT_CLASSES: Partial<
  Record<NonNullable<ButtonProps["variant"]>, string>
> = {
  default:
    "rounded-card border border-border bg-bg px-5 py-2.5 font-body text-sm font-semibold text-heading shadow-sm",
  danger:
    "rounded-card border-0 bg-notice-bg px-5 py-2.5 font-body text-sm font-semibold text-notice-text shadow-sm",
  primary:
    "w-full rounded-xl border-0 bg-accent px-6 py-2 font-body text-base font-bold text-on-accent shadow-sm hover:bg-accent-hover disabled:opacity-50",
};

const SPLIT_VARIANT_CLASSES: Partial<
  Record<NonNullable<ButtonProps["variant"]>, string>
> = {
  success:
    "flex-1 rounded-xl border-0 bg-accent-secondary px-5 py-2 text-sm font-bold text-on-accent shadow-sm disabled:opacity-50 lg:flex-none",
  default:
    "flex-1 rounded-xl border border-border bg-bg px-5 py-2.5 text-sm font-semibold text-heading shadow-sm lg:flex-none",
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
    (size === "split" && SPLIT_VARIANT_CLASSES[variant]) ||
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
