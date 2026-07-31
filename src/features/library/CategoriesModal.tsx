import { useState } from "react";

import {
  useCategories,
  useCreateCategory,
  useDeleteCategory,
  useUpdateCategory,
} from "../../api/categories";
import { useItems } from "../../api/items";
import { Button } from "../../components/ui/Button";
import { Modal } from "../../components/ui/Modal";
import { TextField } from "../../components/ui/TextField";
import { CategoryRow } from "./CategoryRow";

interface CategoriesModalProps {
  onClose: () => void;
}

export function CategoriesModal({ onClose }: CategoriesModalProps) {
  const { data: categories = [] } = useCategories();
  const { data: items = [] } = useItems();
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [showBuiltIn, setShowBuiltIn] = useState(false);

  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();

  const itemCounts = items.reduce<Record<string, number>>((counts, item) => {
    counts[item.categoryId] = (counts[item.categoryId] ?? 0) + 1;
    return counts;
  }, {});

  const builtInCount = categories.filter(
    (category) => category.isSystem,
  ).length;
  const visibleCategories = showBuiltIn
    ? categories
    : categories.filter((category) => !category.isSystem);

  const trimmedNewName = newCategoryName.trim();
  const addDisabled = trimmedNewName === "";

  function handleAdd() {
    if (addDisabled) {
      return;
    }
    createCategory.mutate(trimmedNewName, {
      onSuccess: () => setNewCategoryName(""),
    });
  }

  return (
    <Modal
      title="Categories"
      subtitle="Tap a category of yours to rename it."
      onClose={onClose}
      size="fixed"
      desktopWidth="lg:w-[460px]"
      onEscapeKeyDown={(e) => {
        if (renamingId) {
          e.preventDefault();
          setRenamingId(null);
        }
      }}
    >
      <div className="flex h-full flex-col gap-3">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <TextField
                value={newCategoryName}
                onChange={setNewCategoryName}
                placeholder="New category name…"
                onSubmit={handleAdd}
              />
            </div>
            <Button variant="accent" disabled={addDisabled} onClick={handleAdd}>
              Add
            </Button>
          </div>
          {builtInCount > 0 && (
            <button
              type="button"
              onClick={() => setShowBuiltIn((prev) => !prev)}
              className="cursor-pointer self-start text-sm font-bold text-secondary"
            >
              {showBuiltIn
                ? `Hide built-in (${builtInCount})`
                : `Show built-in (${builtInCount})`}
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto rounded-card border border-border">
          {visibleCategories.map((category) => (
            <CategoryRow
              key={category.id}
              category={category}
              itemCount={itemCounts[category.id] ?? 0}
              isRenaming={renamingId === category.id}
              onStartRename={() => setRenamingId(category.id)}
              onCancelRename={() => setRenamingId(null)}
              onSave={(name) => {
                updateCategory.mutate(
                  { id: category.id, name },
                  { onSuccess: () => setRenamingId(null) },
                );
              }}
              onDelete={() =>
                deleteCategory.mutate({ id: category.id, name: category.name })
              }
            />
          ))}
        </div>
      </div>
    </Modal>
  );
}
