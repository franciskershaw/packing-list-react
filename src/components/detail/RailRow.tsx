import type { ReactNode } from "react";

import { InteractiveButton } from "../ui/Button";

interface RailRowProps {
  title: string;
  meta: string;
  selected: boolean;
  onClick: () => void;
  leading?: ReactNode;
}

export function RailRow({
  title,
  meta,
  selected,
  onClick,
  leading,
}: RailRowProps) {
  return (
    <InteractiveButton
      onClick={onClick}
      className={`flex w-full min-w-0 items-center gap-3 rounded-2xl border px-4 py-3 text-left ${
        selected ? "border-accent bg-bg" : "border-transparent"
      }`}
    >
      {leading}
      <div className="min-w-0 flex-1">
        <p className="truncate font-heading text-base font-bold text-heading">
          {title}
        </p>
        <p className="mt-0.5 truncate text-sm text-secondary">{meta}</p>
      </div>
    </InteractiveButton>
  );
}
