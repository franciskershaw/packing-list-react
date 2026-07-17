import { useEffect, useRef, type ReactNode } from "react";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
};

export function Modal({ open, onClose, children }: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    // The onClick below is a mouse-only convenience: click on the backdrop
    // to close. Not a missing keyboard path — showModal() already gives
    // Escape-to-close natively, so there's no equivalent interaction to add.
    // oxlint-disable-next-line click-events-have-key-events, no-noninteractive-element-interactions
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === dialogRef.current) onClose();
      }}
      className="rounded-card bg-bg p-6 shadow-lg backdrop:bg-heading/40"
    >
      {children}
    </dialog>
  );
}
