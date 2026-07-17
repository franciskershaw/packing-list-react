import type { HTMLAttributes, ReactNode } from "react";

type BadgeColor = "accent" | "accent-secondary" | "notice" | "muted";

type BadgeProps = {
  color?: BadgeColor;
  children: ReactNode;
} & HTMLAttributes<HTMLSpanElement>;

const colorClasses: Record<BadgeColor, string> = {
  accent: "bg-accent text-on-accent",
  "accent-secondary": "bg-accent-secondary text-on-accent-secondary",
  notice: "bg-notice-bg text-notice-text",
  muted: "bg-bg-subtle text-muted",
};

export function Badge({
  color = "muted",
  className = "",
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 font-body text-sm font-semibold ${colorClasses[color]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}
