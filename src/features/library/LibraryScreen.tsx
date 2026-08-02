import { useState } from "react";

import { useCategories } from "../../api/categories";
import { useDeleteItem, useItems } from "../../api/items";
import type { Item } from "../../api/items";
import { CategoryGroupCard } from "../../components/detail/CategoryGroupCard";
import { Button, InteractiveButton } from "../../components/ui/Button";
import { Chip } from "../../components/ui/Chip";
import { Spinner } from "../../components/ui/Spinner";
import { TextField } from "../../components/ui/TextField";
import { useDocumentTitle } from "../../lib/useDocumentTitle";
import { CategoriesModal } from "./CategoriesModal";
import { groupLibraryItems } from "./groupLibraryItems";
import { ItemFormModal } from "./ItemFormModal";
import { LibraryItemRow } from "./LibraryItemRow";

export function LibraryScreen() {
  useDocumentTitle("Library");

  const [search, setSearch] = useState("");
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [formModal, setFormModal] = useState<{
    item?: Item;
    defaultCategoryId?: string;
  } | null>(null);
  const [categoriesModalOpen, setCategoriesModalOpen] = useState(false);

  const categories = useCategories();
  const items = useItems();
  const deleteItem = useDeleteItem();

  const isLoading = categories.isLoading || items.isLoading;
  const groups = groupLibraryItems(items.data ?? [], categories.data ?? [], {
    search,
    categoryId: activeCategoryId,
  });

  return (
    <div className="mx-auto flex w-full max-w-220 flex-col gap-6 p-6 lg:p-12">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-bold text-heading">
            Library
          </h1>
          <p className="mt-0.5 text-sm text-secondary">
            All items, yours and built-in.
          </p>
        </div>
        <InteractiveButton
          onClick={() => setCategoriesModalOpen(true)}
          className="shrink-0 rounded-full border border-border bg-bg px-3 py-2 text-xs font-bold text-body"
        >
          Categories
        </InteractiveButton>
      </div>

      <TextField
        value={search}
        onChange={setSearch}
        placeholder="Search your stuff…"
      />

      {isLoading ? (
        <div className="flex items-center justify-center py-24">
          <Spinner />
        </div>
      ) : (
        <>
          <div className="-mx-6 flex gap-2 overflow-x-auto px-6 lg:mx-0 lg:flex-wrap lg:overflow-visible lg:px-0">
            <Chip
              label="Everything"
              selected={activeCategoryId === null}
              onClick={() => setActiveCategoryId(null)}
            />
            {categories.data?.map((category) => (
              <Chip
                key={category.id}
                label={category.name}
                selected={activeCategoryId === category.id}
                onClick={() => setActiveCategoryId(category.id)}
              />
            ))}
          </div>

          {groups.length > 0 ? (
            <div className="flex flex-col gap-4 lg:grid lg:grid-cols-2 lg:items-start lg:gap-5">
              {groups.map((group) => (
                <CategoryGroupCard
                  key={group.category.id}
                  name={group.category.name}
                  count={group.items.length}
                >
                  {group.items.map((item) => (
                    <LibraryItemRow
                      key={item.id}
                      item={item}
                      onEdit={() => setFormModal({ item })}
                      onDelete={() =>
                        deleteItem.mutate({ id: item.id, name: item.name })
                      }
                    />
                  ))}
                </CategoryGroupCard>
              ))}
            </div>
          ) : (
            <p className="py-10 text-center text-body">
              Nothing matches — try a different search, or create it below.
            </p>
          )}
        </>
      )}

      <Button
        variant="dashed"
        onClick={() =>
          setFormModal({ defaultCategoryId: activeCategoryId ?? undefined })
        }
      >
        + New item
      </Button>

      {formModal && (
        <ItemFormModal
          item={formModal.item}
          defaultCategoryId={formModal.defaultCategoryId}
          onClose={() => setFormModal(null)}
        />
      )}

      {categoriesModalOpen && (
        <CategoriesModal onClose={() => setCategoriesModalOpen(false)} />
      )}
    </div>
  );
}
