import { useState } from "react";

import { Button } from "../../components/ui/Button";
import { Modal } from "../../components/ui/Modal";

export function LibraryScreen() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className="flex min-h-full flex-col items-center justify-center gap-4 bg-bg text-body">
      <p>Library — coming soon</p>
      {/* Temporary — remove once PACKFE-008's first real use case lands */}
      <Button onClick={() => setModalOpen(true)}>Open modal (temporary)</Button>
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
