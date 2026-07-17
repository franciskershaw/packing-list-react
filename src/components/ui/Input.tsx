import type { InputHTMLAttributes } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement>;

export function Input({ className = "", ...props }: InputProps) {
  return (
    <input
      className={`rounded-card border border-border bg-bg-subtle px-4 py-2.5 font-body text-body placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent ${className}`}
      {...props}
    />
  );
}
