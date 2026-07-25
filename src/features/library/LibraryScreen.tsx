import { useState } from "react";

import { useCategories } from "../../api/categories";
import { useItems } from "../../api/items";
import { Button } from "../../components/ui/Button";
import { Chip } from "../../components/ui/Chip";
import { DeleteIconButton } from "../../components/ui/DeleteIconButton";
import { Modal } from "../../components/ui/Modal";
import { SystemBadge } from "../../components/ui/SystemBadge";
import { TextField } from "../../components/ui/TextField";
import { useToast } from "../../components/ui/Toast";

export function LibraryScreen() {
  const [modalOpen, setModalOpen] = useState(false);
  const [demoChip, setDemoChip] = useState("All");
  const [demoSearch, setDemoSearch] = useState("");
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

      {/* Temporary demo harness — remove once Piece 3/6 wire these atoms into the real screen */}
      <div className="flex w-full max-w-md flex-col gap-3 border-t border-border pt-4">
        <TextField
          value={demoSearch}
          onChange={setDemoSearch}
          placeholder="Search your stuff…"
        />
        <div className="flex flex-wrap gap-1.5">
          {["All", "Clothing", "Toiletries"].map((label) => (
            <Chip
              key={label}
              label={label}
              selected={demoChip === label}
              onClick={() => setDemoChip(label)}
            />
          ))}
        </div>
        <div className="flex items-center gap-2.5 rounded-2xl border border-border px-4 py-3">
          <span className="flex-1 text-heading">Socks (mine)</span>
          <DeleteIconButton
            label="Socks"
            onClick={() => toast("Deleted Socks (demo)")}
          />
        </div>
        <div className="flex items-center gap-2.5 rounded-2xl border border-border px-4 py-3">
          <span className="flex-1 text-heading">T-shirts (system)</span>
          <SystemBadge />
        </div>
        <Button variant="dashed" onClick={() => toast("New item (demo)")}>
          + New item
        </Button>
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
