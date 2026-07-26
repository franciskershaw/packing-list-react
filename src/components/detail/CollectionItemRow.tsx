import type { ReactNode } from "react";

interface CollectionItemRowProps {
  leading: ReactNode;
  name: string;
  notes?: string | null;
  trailing: ReactNode;
}

export function CollectionItemRow({
  leading,
  name,
  notes,
  trailing,
}: CollectionItemRowProps) {
  return (
    <div className="flex items-center gap-2.5 border-b border-[#f3eada] px-4 py-3.5">
      {leading}
      <div className="min-w-0 flex-1">
        <p className="truncate text-base font-bold text-heading">{name}</p>
        {notes && <p className="truncate text-sm text-secondary">{notes}</p>}
      </div>
      {trailing}
    </div>
  );
}
