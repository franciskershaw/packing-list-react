interface TextFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  onSubmit?: () => void;
  autoFocus?: boolean;
}

export function TextField({
  value,
  onChange,
  placeholder,
  onSubmit,
  autoFocus,
}: TextFieldProps) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          onSubmit?.();
        }
      }}
      placeholder={placeholder}
      aria-label={placeholder}
      autoFocus={autoFocus}
      className="w-full rounded-xl border border-border bg-bg-subtle px-3.5 py-3 text-sm text-body placeholder:text-muted"
    />
  );
}
