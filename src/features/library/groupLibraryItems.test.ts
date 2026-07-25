import { describe, expect, it } from "vitest";

import type { Category } from "../../api/categories";
import type { Item } from "../../api/items";
import { groupLibraryItems } from "./groupLibraryItems";

const categories: Category[] = [
  { id: "clothing", name: "Clothing", isSystem: true },
  { id: "toiletries", name: "Toiletries", isSystem: true },
  { id: "festival", name: "Festival kit", isSystem: false },
];

const items: Item[] = [
  { id: "1", name: "Socks", categoryId: "clothing", isSystem: true },
  { id: "2", name: "T-shirts", categoryId: "clothing", isSystem: true },
  { id: "3", name: "Toothbrush", categoryId: "toiletries", isSystem: true },
  { id: "4", name: "Poncho", categoryId: "festival", isSystem: false },
];

describe("groupLibraryItems", () => {
  it("groups all items by category, in category order, with no filters", () => {
    const result = groupLibraryItems(items, categories, {
      search: "",
      categoryId: null,
    });

    expect(result.map((g) => g.category.name)).toEqual([
      "Clothing",
      "Toiletries",
      "Festival kit",
    ]);
    expect(result[0].items.map((i) => i.name)).toEqual(["Socks", "T-shirts"]);
  });

  it("omits a category entirely when it has zero matching items", () => {
    const result = groupLibraryItems(items, categories, {
      search: "",
      categoryId: "toiletries",
    });

    expect(result).toHaveLength(1);
    expect(result[0].category.name).toBe("Toiletries");
  });

  it("matches search as a case-insensitive substring", () => {
    const result = groupLibraryItems(items, categories, {
      search: "SOCK",
      categoryId: null,
    });

    expect(result).toHaveLength(1);
    expect(result[0].items.map((i) => i.name)).toEqual(["Socks"]);
  });

  it("ANDs search with the active category filter, not ORs", () => {
    const result = groupLibraryItems(items, categories, {
      search: "poncho",
      categoryId: "clothing",
    });

    expect(result).toHaveLength(0);
  });

  it("returns every category with zero matches as an empty result when search matches nothing", () => {
    const result = groupLibraryItems(items, categories, {
      search: "nonexistent-item",
      categoryId: null,
    });

    expect(result).toHaveLength(0);
  });
});
