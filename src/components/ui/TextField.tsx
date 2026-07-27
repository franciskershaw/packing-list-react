interface TextFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onSubmit?: () => void;
  autoFocus?: boolean;
  type?: "text" | "date";
  id?: string;
}

export function TextField({
  value,
  onChange,
  placeholder,
  onSubmit,
  autoFocus,
  type = "text",
  id,
}: TextFieldProps) {
  return (
    <input
      id={id}
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          onSubmit?.();
        }
      }}
      placeholder={placeholder}
      aria-label={id ? undefined : placeholder}
      autoFocus={autoFocus}
      className="w-full rounded-xl border border-border bg-bg-subtle px-3.5 py-3 text-sm text-body placeholder:text-muted"
    />
  );
}
