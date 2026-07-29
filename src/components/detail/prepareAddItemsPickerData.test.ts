import { describe, expect, it } from "vitest";

import type { Category } from "../../api/categories";
import type { Item } from "../../api/items";
import { prepareAddItemsPickerData } from "./prepareAddItemsPickerData";

const categories: Category[] = [
  { id: "cat-clothing", name: "Clothing", isSystem: true },
  { id: "cat-toiletries", name: "Toiletries", isSystem: true },
];

const items: Item[] = [
  {
    id: "item-tshirt",
    name: "T-shirts",
    categoryId: "cat-clothing",
    isSystem: true,
  },
  {
    id: "item-shorts",
    name: "Shorts",
    categoryId: "cat-clothing",
    isSystem: true,
  },
  {
    id: "item-socks",
    name: "Socks",
    categoryId: "cat-clothing",
    isSystem: true,
  },
  {
    id: "item-toothbrush",
    name: "Toothbrush",
    categoryId: "cat-toiletries",
    isSystem: true,
  },
];

describe("prepareAddItemsPickerData", () => {
  it("orders results by category then item, case-insensitively substring-matching the search", () => {
    const data = prepareAddItemsPickerData(items, categories, [], "SO");

    expect(data.results.map((row) => row.item.name)).toEqual(["Socks"]);
  });

  it("preserves category order (categories first, items within each) when unfiltered", () => {
    const data = prepareAddItemsPickerData(items, categories, [], "");

    expect(data.results.map((row) => row.item.name)).toEqual([
      "T-shirts",
      "Shorts",
      "Socks",
      "Toothbrush",
    ]);
  });

  it("attaches the current quantity to already-added items and leaves the rest null", () => {
    const data = prepareAddItemsPickerData(
      items,
      categories,
      [{ itemId: "item-socks", quantity: 3 }],
      "",
    );

    const socks = data.results.find((row) => row.item.id === "item-socks");
    const shorts = data.results.find((row) => row.item.id === "item-shorts");
    expect(socks?.quantity).toBe(3);
    expect(shorts?.quantity).toBeNull();
  });

  it("bulk chips count only not-yet-added items per category, omitting categories with none left", () => {
    const data = prepareAddItemsPickerData(
      items,
      categories,
      [
        { itemId: "item-tshirt", quantity: 1 },
        { itemId: "item-toothbrush", quantity: 1 },
      ],
      "",
    );

    expect(data.bulkChips).toEqual([
      {
        category: categories[0],
        remaining: 2,
        itemIds: ["item-shorts", "item-socks"],
      },
    ]);
  });

  it("shows the create-inline panel only when the search matches nothing existing", () => {
    expect(
      prepareAddItemsPickerData(items, categories, [], "asdf").showCreateInline,
    ).toBe(true);
    expect(
      prepareAddItemsPickerData(items, categories, [], "sock").showCreateInline,
    ).toBe(false);
    expect(
      prepareAddItemsPickerData(items, categories, [], "").showCreateInline,
    ).toBe(false);
  });
});
