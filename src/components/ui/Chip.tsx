import { InteractiveButton } from "./Button";

interface ChipProps {
  label: string;
  selected: boolean;
  onClick: () => void;
}

export function Chip({ label, selected, onClick }: ChipProps) {
  return (
    <InteractiveButton
      onClick={onClick}
      aria-pressed={selected}
      className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-bold ${
        selected
          ? "border-accent bg-bg text-accent"
          : "border-border bg-bg text-body"
      }`}
    >
      {label}
    </InteractiveButton>
  );
}
