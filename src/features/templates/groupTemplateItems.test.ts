import { describe, expect, it } from "vitest";

import type { Category } from "../../api/categories";
import type { Item } from "../../api/items";
import { groupTemplateItems } from "./groupTemplateItems";

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

interface TemplateEntry {
  itemId: string;
  quantity: number;
}

describe("groupTemplateItems", () => {
  it("joins entries to their item's category, in category order", () => {
    const entries: TemplateEntry[] = [
      { itemId: "1", quantity: 2 },
      { itemId: "2", quantity: 1 },
      { itemId: "3", quantity: 1 },
    ];

    const result = groupTemplateItems(entries, items, categories);

    expect(result.map((g) => g.category.name)).toEqual([
      "Clothing",
      "Toiletries",
    ]);
    expect(result[0].entries.map((e) => e.itemId)).toEqual(["1", "2"]);
  });

  it("omits a category entirely when it has zero entries", () => {
    const entries: TemplateEntry[] = [{ itemId: "3", quantity: 1 }];

    const result = groupTemplateItems(entries, items, categories);

    expect(result).toHaveLength(1);
    expect(result[0].category.name).toBe("Toiletries");
  });

  it("silently drops an entry whose itemId has no matching item", () => {
    const entries: TemplateEntry[] = [
      { itemId: "1", quantity: 1 },
      { itemId: "does-not-exist", quantity: 1 },
    ];

    const result = groupTemplateItems(entries, items, categories);

    expect(result).toHaveLength(1);
    expect(result[0].entries).toHaveLength(1);
  });

  it("returns an empty array when there are no entries", () => {
    const result = groupTemplateItems([], items, categories);

    expect(result).toEqual([]);
  });

  it("passes through extra fields on the generic entry type unchanged", () => {
    interface TripEntry extends TemplateEntry {
      packed: boolean;
    }
    const entries: TripEntry[] = [{ itemId: "1", quantity: 1, packed: true }];

    const result = groupTemplateItems(entries, items, categories);

    expect(result[0].entries[0].packed).toBe(true);
  });
});
