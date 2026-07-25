import type { Item } from "../../api/items";
import { Modal } from "../../components/ui/Modal";

interface ItemFormModalProps {
  item?: Item;
  defaultCategoryId?: string;
  onClose: () => void;
}

// Stub — see PACKFE-003 Piece 4 in docs/specs/master-spec.md for the real shape.
export function ItemFormModal({ onClose }: ItemFormModalProps) {
  return (
    <Modal
      title="Not implemented"
      onClose={onClose}
      desktopWidth="lg:w-[420px]"
    >
      <p>TODO</p>
    </Modal>
  );
}
