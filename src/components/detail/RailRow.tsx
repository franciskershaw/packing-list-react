import { InteractiveButton } from "../ui/Button";

interface RailRowProps {
  title: string;
  meta: string;
  selected: boolean;
  onClick: () => void;
}

export function RailRow({ title, meta, selected, onClick }: RailRowProps) {
  return (
    <InteractiveButton
      onClick={onClick}
      className={`w-full min-w-0 rounded-2xl border px-4 py-3 text-left ${
        selected ? "border-accent bg-bg" : "border-transparent"
      }`}
    >
      <p className="truncate font-heading text-base font-bold text-heading">
        {title}
      </p>
      <p className="mt-0.5 truncate text-sm text-secondary">{meta}</p>
    </InteractiveButton>
  );
}
