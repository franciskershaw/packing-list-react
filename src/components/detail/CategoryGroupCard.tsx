import type { ReactNode } from "react";
import { ChevronDown } from "lucide-react";

import { InteractiveButton } from "../ui/Button";

interface CategoryGroupCardProps {
  name: string;
  count: number | string;
  children: ReactNode;
  collapsible?: boolean;
  expanded?: boolean;
  onToggle?: () => void;
}

export function CategoryGroupCard({
  name,
  count,
  children,
  collapsible,
  expanded,
  onToggle,
}: CategoryGroupCardProps) {
  const header = (
    <>
      <span className="font-heading text-base font-semibold text-heading">
        {name}
      </span>
      <span className="text-sm text-muted">{count}</span>
    </>
  );

  return (
    <div className="overflow-hidden rounded-card border border-border">
      {collapsible ? (
        <InteractiveButton
          onClick={onToggle}
          aria-expanded={expanded}
          className="flex w-full items-center gap-2 bg-bg-subtle px-4 py-3 text-left"
        >
          {header}
          <ChevronDown
            size={18}
            className={`ml-auto text-tertiary transition-transform ${expanded ? "rotate-180" : ""}`}
          />
        </InteractiveButton>
      ) : (
        <div className="flex items-center gap-2 bg-bg-subtle px-4 py-3">
          {header}
        </div>
      )}
      {(!collapsible || expanded) && children}
    </div>
  );
}
