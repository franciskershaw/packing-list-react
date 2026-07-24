import { useState } from "react";

import { useCategories } from "../../api/categories";
import { useItems } from "../../api/items";
import { Button } from "../../components/ui/Button";
import { Modal } from "../../components/ui/Modal";
import { useToast } from "../../components/ui/Toast";

export function LibraryScreen() {
  const [modalOpen, setModalOpen] = useState(false);
  const { toast } = useToast();
  const categories = useCategories();
  const items = useItems();

  return (
    <div className="flex min-h-full flex-col items-center justify-center gap-4 bg-bg text-body">
      <p>Library — coming soon</p>

      {/* Temporary — remove once PACKFE-008's first real use case lands */}
      <Button onClick={() => setModalOpen(true)}>Open modal (temporary)</Button>

      {/* Temporary — remove once Piece 6 assembles the real screen */}
      <div className="flex flex-col items-center gap-2">
        <Button onClick={() => toast("This is a test toast (temporary)")}>
          Test toast (temporary)
        </Button>
        <p className="text-xs text-secondary">
          categories:{" "}
          {categories.isLoading
            ? "loading…"
            : (categories.error?.message ?? categories.data?.length)}
          {" · "}
          items:{" "}
          {items.isLoading
            ? "loading…"
            : (items.error?.message ?? items.data?.length)}
        </p>
      </div>

      {modalOpen && (
        <Modal
          title="Modal shell demo"
          subtitle="Placeholder content — proves the shell works, not a real use case yet."
          onClose={() => setModalOpen(false)}
          desktopWidth="lg:w-[460px]"
          footer={
            <Button className="w-full" onClick={() => setModalOpen(false)}>
              Close
            </Button>
          }
        >
          <p>This is placeholder content inside the modal shell.</p>
        </Modal>
      )}
    </div>
  );
}
