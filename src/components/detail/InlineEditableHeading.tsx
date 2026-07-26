interface InlineEditableHeadingProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  variant: "title" | "description";
}

const VARIANT_CLASSES: Record<InlineEditableHeadingProps["variant"], string> = {
  title:
    "font-heading text-[25px] lg:text-[27px] font-bold text-heading placeholder:text-muted",
  description: "text-sm text-secondary placeholder:text-muted",
};

export function InlineEditableHeading({
  value,
  onChange,
  placeholder,
  variant,
}: InlineEditableHeadingProps) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`w-full border-0 bg-transparent outline-none ${VARIANT_CLASSES[variant]}`}
    />
  );
}
