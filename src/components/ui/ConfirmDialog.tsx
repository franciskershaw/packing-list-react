import { Button } from "./Button";
import { Modal } from "./Modal";

interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  title,
  message,
  confirmLabel,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    // React bubbles portal events through the component tree, not the DOM
    // tree — stops clicks here from reaching a clickable parent (e.g. a row).
    <div onClick={(e) => e.stopPropagation()}>
      <Modal
        title={title}
        onClose={onCancel}
        desktopWidth="lg:w-[360px]"
        footer={
          <div className="flex gap-3">
            <Button className="flex-1" onClick={onCancel}>
              Cancel
            </Button>
            <Button variant="danger" className="flex-1" onClick={onConfirm}>
              {confirmLabel}
            </Button>
          </div>
        }
      >
        <p className="text-sm text-body">{message}</p>
      </Modal>
    </div>
  );
}
