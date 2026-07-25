import { ChevronRight } from "lucide-react";

import type { Item } from "../../api/items";
import { DeleteIconButton } from "../../components/ui/DeleteIconButton";
import { SystemBadge } from "../../components/ui/SystemBadge";

interface LibraryItemRowProps {
  item: Item;
  onEdit: () => void;
  onDelete: () => void;
}

export function LibraryItemRow({
  item,
  onEdit,
  onDelete,
}: LibraryItemRowProps) {
  if (item.isSystem) {
    return (
      <div className="flex items-center gap-2.5 border-b border-[#f3eada] px-4 py-3.5">
        <span className="flex-1 text-[14.5px] font-semibold text-heading">
          {item.name}
        </span>
        <SystemBadge />
      </div>
    );
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onEdit}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onEdit();
        }
      }}
      className="group flex cursor-pointer items-center gap-2.5 border-b border-[#f3eada] px-4 py-3.5 active:opacity-70 lg:hover:bg-bg-subtle lg:active:opacity-100"
    >
      <span className="flex-1 text-[14.5px] font-semibold text-heading lg:group-hover:text-accent-hover">
        {item.name}
      </span>
      <ChevronRight className="h-4 w-4 shrink-0 text-muted lg:group-hover:text-accent" />
      <DeleteIconButton label={item.name} onClick={onDelete} />
    </div>
  );
}
