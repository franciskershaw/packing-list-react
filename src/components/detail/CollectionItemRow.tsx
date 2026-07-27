import type { KeyboardEvent, ReactNode } from "react";

interface CollectionItemRowProps {
  leading?: ReactNode;
  name: string;
  notes?: string | null;
  trailing: ReactNode;
  onClick?: () => void;
  checked?: boolean;
  struck?: boolean;
}

export function CollectionItemRow({
  leading,
  name,
  notes,
  trailing,
  onClick,
  checked,
  struck,
}: CollectionItemRowProps) {
  const isCheckbox = checked !== undefined;

  function handleKeyDown(event: KeyboardEvent) {
    const activates = isCheckbox
      ? event.key === " "
      : event.key === "Enter" || event.key === " ";
    if (activates) {
      event.preventDefault();
      onClick?.();
    }
  }

  return (
    <div
      role={onClick ? (isCheckbox ? "checkbox" : "button") : undefined}
      aria-checked={isCheckbox ? checked : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={onClick ? handleKeyDown : undefined}
      className="flex items-center gap-2.5 border-b border-[#f3eada] px-4 py-3.5"
    >
      {leading}
      <div className="min-w-0 flex-1">
        <p
          className={`truncate text-base font-bold ${struck ? "text-muted line-through" : "text-heading"}`}
        >
          {name}
        </p>
        {notes && <p className="truncate text-sm text-secondary">{notes}</p>}
      </div>
      {trailing}
    </div>
  );
}
