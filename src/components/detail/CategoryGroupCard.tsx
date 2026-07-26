import type { ReactNode } from "react";

interface CategoryGroupCardProps {
  name: string;
  count: number;
  children: ReactNode;
}

export function CategoryGroupCard({
  name,
  count,
  children,
}: CategoryGroupCardProps) {
  return (
    <div className="overflow-hidden rounded-card border border-border">
      <div className="flex items-center gap-2 bg-bg-subtle px-4 py-3">
        <span className="font-heading text-base font-bold text-heading">
          {name}
        </span>
        <span className="text-sm text-muted">{count}</span>
      </div>
      {children}
    </div>
  );
}
