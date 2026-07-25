interface TextFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}

export function TextField({ value, onChange, placeholder }: TextFieldProps) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      aria-label={placeholder}
      className="w-full rounded-xl border border-border bg-bg-subtle px-3.5 py-3 text-sm text-body placeholder:text-muted"
    />
  );
}
