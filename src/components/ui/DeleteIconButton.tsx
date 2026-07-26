import { useState } from "react";

import { InteractiveButton } from "./Button";
import { ConfirmDialog } from "./ConfirmDialog";

interface DeleteIconButtonProps {
  label: string;
  onClick: () => void;
  confirm?: boolean;
}

export function DeleteIconButton({
  label,
  onClick,
  confirm = true,
}: DeleteIconButtonProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <>
      <InteractiveButton
        aria-label={confirm ? `Delete ${label}` : `Remove ${label}`}
        onClick={(e) => {
          e.stopPropagation();
          if (confirm) {
            setConfirmOpen(true);
          } else {
            onClick();
          }
        }}
        className="flex h-6.5 w-6.5 shrink-0 items-center justify-center rounded-full bg-notice-bg text-sm font-bold text-notice-text"
      >
        ×
      </InteractiveButton>
      {confirm && confirmOpen && (
        <ConfirmDialog
          title={`Delete ${label}?`}
          message="This can't be undone."
          confirmLabel="Delete"
          onConfirm={() => {
            setConfirmOpen(false);
            onClick();
          }}
          onCancel={() => setConfirmOpen(false)}
        />
      )}
    </>
  );
}
