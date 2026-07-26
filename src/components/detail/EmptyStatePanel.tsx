import { Button } from "../ui/Button";

interface EmptyStatePanelProps {
  title: string;
  message: string;
  actionLabel: string;
  onAction: () => void;
}

export function EmptyStatePanel({
  title,
  message,
  actionLabel,
  onAction,
}: EmptyStatePanelProps) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-[#c9bba6] px-10 py-14 text-center">
      <div>
        <p className="font-heading text-lg font-bold text-heading">{title}</p>
        <p className="mt-1 text-sm text-secondary">{message}</p>
      </div>
      <Button variant="accent" onClick={onAction}>
        {actionLabel}
      </Button>
    </div>
  );
}
