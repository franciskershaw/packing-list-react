import type { Category } from "../../api/categories";
import type { Item } from "../../api/items";

export interface TemplateItemGroup<T> {
  category: Category;
  entries: T[];
}

export function groupTemplateItems<T extends { itemId: string }>(
  entries: T[],
  items: Item[],
  categories: Category[],
): TemplateItemGroup<T>[] {
  const itemsById = new Map(items.map((item) => [item.id, item]));

  return categories
    .map((category) => ({
      category,
      entries: entries.filter(
        (entry) => itemsById.get(entry.itemId)?.categoryId === category.id,
      ),
    }))
    .filter((group) => group.entries.length > 0);
}
