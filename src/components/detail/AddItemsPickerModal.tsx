import { useState } from "react";

import { useCategories } from "../../api/categories";
import { useItems } from "../../api/items";
import { Button } from "../ui/Button";
import { Chip } from "../ui/Chip";
import { Modal } from "../ui/Modal";
import { TextField } from "../ui/TextField";
import { CollectionItemRow } from "./CollectionItemRow";
import { prepareAddItemsPickerData } from "./prepareAddItemsPickerData";
import { QuantityStepper } from "./QuantityStepper";

interface AddItemsPickerModalProps {
  entries: { itemId: string; quantity: number }[];
  onAdd: (itemId: string) => void;
  onIncrement: (itemId: string) => void;
  onDecrement: (itemId: string) => void;
  onBulkAdd: (itemIds: string[]) => void;
  onCreateAndAdd: (input: { name: string; categoryId: string }) => void;
  onClose: () => void;
  onDone: () => void;
  isDonePending?: boolean;
}

export function AddItemsPickerModal({
  entries,
  onAdd,
  onIncrement,
  onDecrement,
  onBulkAdd,
  onCreateAndAdd,
  onClose,
  onDone,
  isDonePending = false,
}: AddItemsPickerModalProps) {
  const { data: items = [] } = useItems();
  const { data: categories = [] } = useCategories();
  const [search, setSearch] = useState("");
  const [isPickingCategory, setIsPickingCategory] = useState(false);
  const [createCategoryId, setCreateCategoryId] = useState("");

  const { results, bulkChips, showCreateInline } = prepareAddItemsPickerData(
    items,
    categories,
    entries,
    search,
  );
  const trimmedSearch = search.trim();
  const resolvedCreateCategoryId =
    createCategoryId || (categories[0]?.id ?? "");

  function handleSearchChange(value: string) {
    setSearch(value);
    setIsPickingCategory(false);
  }

  function handleCreateAndAdd() {
    if (!resolvedCreateCategoryId) {
      return;
    }
    onCreateAndAdd({
      name: trimmedSearch,
      categoryId: resolvedCreateCategoryId,
    });
    setIsPickingCategory(false);
  }

  return (
    <Modal
      title="Add items"
      onClose={onClose}
      size="fixed"
      desktopWidth="lg:w-[560px]"
      footer={
        <Button variant="primary" onClick={onDone} disabled={isDonePending}>
          Done
        </Button>
      }
    >
      <div className="flex h-full flex-col gap-3">
        <TextField
          value={search}
          onChange={handleSearchChange}
          placeholder="Search — or type something new…"
          autoFocus
        />

        {!showCreateInline && bulkChips.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {bulkChips.map(({ category, remaining, itemIds }) => (
              <button
                key={category.id}
                type="button"
                className="cursor-pointer rounded-full border border-accent-secondary px-3 py-1.5 text-xs font-bold whitespace-nowrap text-accent-secondary"
                onClick={() => onBulkAdd(itemIds)}
              >
                + All {category.name} ({remaining})
              </button>
            ))}
          </div>
        )}

        <div className="flex-1 overflow-y-auto rounded-2xl border border-border">
          {showCreateInline ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
              {isPickingCategory ? (
                <div className="flex w-full flex-col items-center gap-3">
                  <p className="text-sm font-bold text-heading">
                    &ldquo;{trimmedSearch}&rdquo; — pick a category
                  </p>
                  <div className="flex flex-wrap justify-center gap-1.5">
                    {categories.map((category) => (
                      <Chip
                        key={category.id}
                        label={category.name}
                        selected={category.id === resolvedCreateCategoryId}
                        onClick={() => setCreateCategoryId(category.id)}
                      />
                    ))}
                  </div>
                  <Button
                    variant="primary"
                    className="w-full"
                    onClick={handleCreateAndAdd}
                  >
                    Create it &amp; add
                  </Button>
                </div>
              ) : (
                <button
                  type="button"
                  className="cursor-pointer text-sm font-bold text-accent"
                  onClick={() => setIsPickingCategory(true)}
                >
                  + Create &ldquo;{trimmedSearch}&rdquo; as a new item
                </button>
              )}
            </div>
          ) : (
            results.map(({ item, categoryName, quantity }) => (
              <CollectionItemRow
                key={item.id}
                name={item.name}
                notes={categoryName}
                trailing={
                  quantity === null ? (
                    <Button variant="subtle" onClick={() => onAdd(item.id)}>
                      Add
                    </Button>
                  ) : (
                    <QuantityStepper
                      value={quantity}
                      min={0}
                      onChange={(next) =>
                        next > quantity
                          ? onIncrement(item.id)
                          : onDecrement(item.id)
                      }
                    />
                  )
                }
              />
            ))
          )}
        </div>
      </div>
    </Modal>
  );
}
