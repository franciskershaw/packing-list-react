import type { Category } from "../../api/categories";
import type { Item } from "../../api/items";

export interface PickerResultRow {
  item: Item;
  categoryName: string;
  quantity: number | null;
}

export interface PickerBulkChip {
  category: Category;
  remaining: number;
  itemIds: string[];
}

export interface PickerData {
  results: PickerResultRow[];
  bulkChips: PickerBulkChip[];
  showCreateInline: boolean;
}

export function prepareAddItemsPickerData(
  items: Item[],
  categories: Category[],
  entries: { itemId: string; quantity: number }[],
  search: string,
): PickerData {
  const quantityByItemId = new Map(
    entries.map((entry) => [entry.itemId, entry.quantity]),
  );
  const trimmedSearch = search.trim().toLowerCase();

  const results = categories.flatMap((category) =>
    items
      .filter(
        (item) =>
          item.categoryId === category.id &&
          item.name.toLowerCase().includes(trimmedSearch),
      )
      .map((item) => ({
        item,
        categoryName: category.name,
        quantity: quantityByItemId.get(item.id) ?? null,
      })),
  );

  const bulkChips = categories
    .map((category) => ({
      category,
      remaining: items.filter(
        (item) =>
          item.categoryId === category.id && !quantityByItemId.has(item.id),
      ).length,
      itemIds: [] as string[],
    }))
    .filter((chip) => chip.remaining > 0);

  return {
    results,
    bulkChips,
    showCreateInline: trimmedSearch !== "" && results.length === 0,
  };
}
