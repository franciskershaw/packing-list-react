import { Archive } from "lucide-react";

import { InteractiveButton } from "../../../components/ui/Button";

interface ArchiveButtonProps {
  onClick: () => void;
}

export function ArchiveButton({ onClick }: ArchiveButtonProps) {
  return (
    <InteractiveButton
      aria-label="Archive trip"
      onClick={onClick}
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-bg text-heading"
    >
      <Archive size={18} />
    </InteractiveButton>
  );
}
