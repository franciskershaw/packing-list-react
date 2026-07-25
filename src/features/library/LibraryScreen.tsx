import { useState } from "react";

import { useCategories } from "../../api/categories";
import type { Item } from "../../api/items";
import { useItems } from "../../api/items";
import { Button } from "../../components/ui/Button";
import { Chip } from "../../components/ui/Chip";
import { TextField } from "../../components/ui/TextField";
import { useToast } from "../../components/ui/Toast";
import { ItemFormModal } from "./ItemFormModal";
import { LibraryItemRow } from "./LibraryItemRow";

export function LibraryScreen() {
  const [formModal, setFormModal] = useState<{ item?: Item } | null>(null);
  const [demoChip, setDemoChip] = useState("All");
  const [demoSearch, setDemoSearch] = useState("");
  const { toast } = useToast();
  const categories = useCategories();
  const items = useItems();

  return (
    <div className="flex min-h-full flex-col items-center justify-center gap-4 bg-bg text-body">
      <p>Library — coming soon</p>

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
        <LibraryItemRow
          item={{
            id: "demo-2",
            name: "T-shirts",
            categoryId: "demo",
            isSystem: true,
          }}
          onEdit={() => toast("Edit T-shirts (demo)")}
          onDelete={() => toast("Deleted T-shirts (demo)")}
        />
        {items.data
          ?.filter((item) => !item.isSystem)
          .map((item) => (
            <LibraryItemRow
              key={item.id}
              item={item}
              onEdit={() => setFormModal({ item })}
              onDelete={() => toast(`Deleted ${item.name} (demo)`)}
            />
          ))}
        <Button variant="dashed" onClick={() => setFormModal({})}>
          + New item
        </Button>
      </div>

      {formModal && (
        <ItemFormModal
          item={formModal.item}
          onClose={() => setFormModal(null)}
        />
      )}
    </div>
  );
}
