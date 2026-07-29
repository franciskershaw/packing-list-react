import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { Category } from "../../api/categories";
import type { Item } from "../../api/items";
import { ToastProvider } from "../ui/Toast";
import { AddItemsPickerModal } from "./AddItemsPickerModal";

const categories: Category[] = [
  { id: "cat-clothing", name: "Clothing", isSystem: true },
  { id: "cat-toiletries", name: "Toiletries", isSystem: true },
];

const items: Item[] = [
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

function jsonResponse(body: unknown): Response {
  return {
    ok: true,
    status: 200,
    json: () => Promise.resolve(body),
  } as Response;
}

function mockFetch() {
  vi.spyOn(globalThis, "fetch").mockImplementation((input) => {
    const url = typeof input === "string" ? input : input.toString();
    if (url === "/api/items") return Promise.resolve(jsonResponse(items));
    if (url === "/api/categories")
      return Promise.resolve(jsonResponse(categories));
    throw new Error(`no fetch mock registered for ${url}`);
  });
}

function renderModal(
  entries: { itemId: string; quantity: number }[] = [],
  extraProps: { isDonePending?: boolean } = {},
) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const handlers = {
    onAdd: vi.fn(),
    onIncrement: vi.fn(),
    onBulkAdd: vi.fn(),
    onCreateAndAdd: vi.fn(),
    onClose: vi.fn(),
    onDone: vi.fn(),
  };
  render(
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <AddItemsPickerModal entries={entries} {...handlers} {...extraProps} />
      </ToastProvider>
    </QueryClientProvider>,
  );
  return handlers;
}

describe("AddItemsPickerModal", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("clicking a not-yet-added item's Add pill calls onAdd", async () => {
    mockFetch();
    const handlers = renderModal([{ itemId: "item-toothbrush", quantity: 1 }]);

    fireEvent.click(await screen.findByRole("button", { name: "Add" }));

    expect(handlers.onAdd).toHaveBeenCalledWith("item-socks");
  });

  it("clicking an already-added item's quantity pill calls onIncrement, not onAdd", async () => {
    mockFetch();
    const handlers = renderModal([{ itemId: "item-socks", quantity: 4 }]);

    fireEvent.click(await screen.findByRole("button", { name: "×4" }));

    expect(handlers.onIncrement).toHaveBeenCalledWith("item-socks");
    expect(handlers.onAdd).not.toHaveBeenCalled();
  });

  it("clicking a bulk chip calls onBulkAdd with that category's remaining item ids", async () => {
    mockFetch();
    const handlers = renderModal();

    fireEvent.click(
      await screen.findByRole("button", { name: "+ All Clothing (1)" }),
    );

    expect(handlers.onBulkAdd).toHaveBeenCalledWith(["item-socks"]);
  });

  it("clicking Done calls onDone, not onClose", () => {
    mockFetch();
    const handlers = renderModal();

    fireEvent.click(screen.getByRole("button", { name: "Done" }));

    expect(handlers.onDone).toHaveBeenCalledTimes(1);
    expect(handlers.onClose).not.toHaveBeenCalled();
  });

  it("Done is disabled while isDonePending is true", () => {
    mockFetch();
    renderModal(undefined, { isDonePending: true });

    expect(screen.getByRole("button", { name: "Done" })).toBeDisabled();
  });

  it("a non-matching search reveals create-inline; picking a category (defaulted to the first) and confirming calls onCreateAndAdd", async () => {
    mockFetch();
    const handlers = renderModal();

    fireEvent.change(
      await screen.findByPlaceholderText("Search — or type something new…"),
      { target: { value: "Sunscreen" } },
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "+ Create “Sunscreen” as a new item",
      }),
    );

    expect(screen.getByRole("button", { name: "Clothing" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    fireEvent.click(screen.getByRole("button", { name: "Toiletries" }));
    fireEvent.click(screen.getByRole("button", { name: "Create it & add" }));

    expect(handlers.onCreateAndAdd).toHaveBeenCalledWith({
      name: "Sunscreen",
      categoryId: "cat-toiletries",
    });
  });

  it("editing the search after entering category-pick resets back to the step-1 trigger", async () => {
    mockFetch();
    renderModal();

    fireEvent.change(
      await screen.findByPlaceholderText("Search — or type something new…"),
      { target: { value: "Sunscreen" } },
    );
    fireEvent.click(
      screen.getByRole("button", {
        name: "+ Create “Sunscreen” as a new item",
      }),
    );
    expect(
      screen.getByRole("button", { name: "Clothing" }),
    ).toBeInTheDocument();

    fireEvent.change(
      screen.getByPlaceholderText("Search — or type something new…"),
      { target: { value: "Sunscreen2" } },
    );

    expect(
      screen.getByRole("button", {
        name: "+ Create “Sunscreen2” as a new item",
      }),
    ).toBeInTheDocument();
    await waitFor(() =>
      expect(
        screen.queryByRole("button", { name: "Clothing" }),
      ).not.toBeInTheDocument(),
    );
  });
});
