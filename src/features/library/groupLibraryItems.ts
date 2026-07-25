import type { Category } from "../../api/categories";
import type { Item } from "../../api/items";

export interface LibraryGroup {
  category: Category;
  items: Item[];
}

export function groupLibraryItems(
  items: Item[],
  categories: Category[],
  filters: { search: string; categoryId: string | null },
): LibraryGroup[] {
  const search = filters.search.trim().toLowerCase();

  return categories
    .map((category) => ({
      category,
      items: items.filter(
        (item) =>
          item.categoryId === category.id &&
          (filters.categoryId === null ||
            item.categoryId === filters.categoryId) &&
          item.name.toLowerCase().includes(search),
      ),
    }))
    .filter((group) => group.items.length > 0);
}
