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
  variant?: "default" | "danger" | "dashed";
}

const VARIANT_CLASSES: Record<NonNullable<ButtonProps["variant"]>, string> = {
  default:
    "rounded-card border border-border bg-bg px-6 py-4 font-body text-base font-semibold text-heading shadow-sm",
  danger:
    "rounded-card border-0 bg-notice-bg px-6 py-4 font-body text-base font-semibold text-notice-text shadow-sm",
  dashed:
    "w-full rounded-2xl border border-dashed border-[#c9bba6] py-3 text-sm font-bold text-tertiary",
};

export function Button({
  icon,
  children,
  className = "",
  variant = "default",
  ...props
}: ButtonProps) {
  return (
    <InteractiveButton
      className={`inline-flex items-center justify-center gap-3 ${VARIANT_CLASSES[variant]} ${className}`}
      {...props}
    >
      {icon}
      {children}
    </InteractiveButton>
  );
}
