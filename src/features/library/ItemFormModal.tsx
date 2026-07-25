import { useState } from "react";

import { useCategories } from "../../api/categories";
import { useCreateItem, useUpdateItem } from "../../api/items";
import type { Item } from "../../api/items";
import { Button } from "../../components/ui/Button";
import { Chip } from "../../components/ui/Chip";
import { Modal } from "../../components/ui/Modal";
import { TextField } from "../../components/ui/TextField";

interface ItemFormModalProps {
  item?: Item;
  defaultCategoryId?: string;
  onClose: () => void;
}

export function ItemFormModal({
  item,
  defaultCategoryId,
  onClose,
}: ItemFormModalProps) {
  const { data: categories = [] } = useCategories();
  const [name, setName] = useState(item?.name ?? "");
  const [categoryId, setCategoryId] = useState(
    item?.categoryId ?? defaultCategoryId ?? "",
  );
  const createItem = useCreateItem();
  const updateItem = useUpdateItem();

  const resolvedCategoryId = categoryId || (categories[0]?.id ?? "");
  const trimmedName = name.trim();
  const submitDisabled = trimmedName === "";

  function handleSubmit() {
    if (submitDisabled) {
      return;
    }
    if (item) {
      updateItem.mutate(
        { id: item.id, name: trimmedName, categoryId: resolvedCategoryId },
        { onSuccess: onClose },
      );
    } else {
      createItem.mutate(
        { name: trimmedName, categoryId: resolvedCategoryId },
        { onSuccess: onClose },
      );
    }
  }

  return (
    <Modal
      title={item ? "Edit item" : "Add to your library"}
      onClose={onClose}
      desktopWidth="lg:w-[420px]"
      footer={
        <Button
          variant="primary"
          disabled={submitDisabled}
          onClick={handleSubmit}
        >
          {item ? "Save" : "Add to library"}
        </Button>
      }
    >
      <TextField value={name} onChange={setName} placeholder="e.g. Bum bag" />
      <p className="mt-3.5 mb-2 text-[11px] font-bold tracking-wide text-tertiary uppercase">
        Category
      </p>
      <div className="flex flex-wrap gap-1.5">
        {categories.map((category) => (
          <Chip
            key={category.id}
            label={category.name}
            selected={category.id === resolvedCategoryId}
            onClick={() => setCategoryId(category.id)}
          />
        ))}
      </div>
    </Modal>
  );
}
