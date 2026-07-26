interface TemplateListCardProps {
  name: string;
  itemCount: number;
  description: string | null;
  onClick: () => void;
}

export function TemplateListCard({
  name,
  itemCount,
  description,
  onClick,
}: TemplateListCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full cursor-pointer flex-col gap-0.5 rounded-2xl border border-border bg-bg px-4 py-3.5 text-left active:opacity-70"
    >
      <div className="flex items-baseline justify-between gap-2">
        <span className="font-heading text-base font-bold text-heading">
          {name}
        </span>
        <span className="shrink-0 text-sm text-secondary">
          {itemCount} items
        </span>
      </div>
      <p className="truncate text-sm text-secondary">
        {description || "No description yet"}
      </p>
    </button>
  );
}
