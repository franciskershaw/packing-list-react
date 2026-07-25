import { InteractiveButton } from "./Button";

interface DeleteIconButtonProps {
  label: string;
  onClick: () => void;
}

export function DeleteIconButton({ label, onClick }: DeleteIconButtonProps) {
  return (
    <InteractiveButton
      aria-label={`Delete ${label}`}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full bg-notice-bg text-sm font-bold text-notice-text"
    >
      ×
    </InteractiveButton>
  );
}
