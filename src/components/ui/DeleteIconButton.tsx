import { useState } from "react";

import { InteractiveButton } from "./Button";
import { ConfirmDialog } from "./ConfirmDialog";

interface DeleteIconButtonProps {
  label: string;
  onClick: () => void;
}

export function DeleteIconButton({ label, onClick }: DeleteIconButtonProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <>
      <InteractiveButton
        aria-label={`Delete ${label}`}
        onClick={(e) => {
          e.stopPropagation();
          setConfirmOpen(true);
        }}
        className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full bg-notice-bg text-sm font-bold text-notice-text"
      >
        ×
      </InteractiveButton>
      {confirmOpen && (
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
