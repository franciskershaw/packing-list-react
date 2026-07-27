import type { ReactNode } from "react";
import { ChevronLeft } from "lucide-react";

import { InteractiveButton } from "../ui/Button";

interface BackHeaderProps {
  label?: string;
  onBack: () => void;
  trailing?: ReactNode;
}

export function BackHeader({ label, onBack, trailing }: BackHeaderProps) {
  return (
    <div className="flex items-center gap-3">
      <InteractiveButton
        aria-label="Back"
        onClick={onBack}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-bg text-heading"
      >
        <ChevronLeft size={20} />
      </InteractiveButton>
      {label && (
        <span className="text-sm font-bold tracking-wide text-secondary uppercase">
          {label}
        </span>
      )}
      {trailing && (
        <div className="ml-auto flex items-center gap-2">{trailing}</div>
      )}
    </div>
  );
}
