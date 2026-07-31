import type { ReactNode } from "react";
import { ChevronRight } from "lucide-react";

import { InteractiveButton } from "../ui/Button";

interface RailRowProps {
  /** "raised" (default): white card, for the desktop rail against its
   *  cream aside background. "flush": bordered only, matching the mobile
   *  page background — no elevation, since mobile rows sit full-width. */
  surface?: "raised" | "flush";
  selected?: boolean;
  showChevron?: boolean;
  onClick: () => void;
  leading?: ReactNode;
  children: ReactNode;
}

export function RailRow({
  surface = "raised",
  selected = false,
  showChevron = false,
  onClick,
  leading,
  children,
}: RailRowProps) {
  return (
    <InteractiveButton
      onClick={onClick}
      className={`flex w-full min-w-0 items-center gap-3 rounded-2xl border px-4 py-3 text-left ${
        surface === "raised" ? "bg-white" : "bg-bg"
      } ${selected ? "border-accent" : "border-border"}`}
    >
      {leading}
      <div className="min-w-0 flex-1">{children}</div>
      {showChevron && (
        <ChevronRight size={18} className="shrink-0 text-tertiary" />
      )}
    </InteractiveButton>
  );
}
