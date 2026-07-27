import { Check } from "lucide-react";

interface PackedCheckboxProps {
  packed: boolean;
}

// Purely decorative — the row that renders this owns the real checkbox
// semantics (role="checkbox" aria-checked, see CollectionItemRow).
export function PackedCheckbox({ packed }: PackedCheckboxProps) {
  return (
    <span
      aria-hidden
      className={`flex h-6.5 w-6.5 shrink-0 items-center justify-center rounded-full border-2 ${
        packed
          ? "border-accent-secondary bg-accent-secondary"
          : "border-[#D8CBB6]"
      }`}
    >
      {packed && <Check size={14} className="text-on-accent" />}
    </span>
  );
}
