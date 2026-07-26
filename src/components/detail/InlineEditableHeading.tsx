import type { KeyboardEvent } from "react";

interface InlineEditableHeadingProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  variant: "title" | "description";
  onBlur?: () => void;
  onKeyDown?: (event: KeyboardEvent<HTMLInputElement>) => void;
}

const VARIANT_CLASSES: Record<InlineEditableHeadingProps["variant"], string> = {
  title:
    "truncate font-heading text-[25px] lg:text-[27px] font-bold text-heading placeholder:text-muted",
  description: "truncate text-sm text-secondary placeholder:text-muted",
};

export function InlineEditableHeading({
  value,
  onChange,
  placeholder,
  variant,
  onBlur,
  onKeyDown,
}: InlineEditableHeadingProps) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
      onKeyDown={onKeyDown}
      placeholder={placeholder}
      className={`w-full rounded-sm border-0 bg-transparent outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${VARIANT_CLASSES[variant]}`}
    />
  );
}
