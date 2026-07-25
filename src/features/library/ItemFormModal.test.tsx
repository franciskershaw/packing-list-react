import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { Category } from "../../api/categories";
import type { Item } from "../../api/items";
import { ToastProvider } from "../../components/ui/Toast";
import { ItemFormModal } from "./ItemFormModal";

const categories: Category[] = [
  { id: "cat-1", name: "Clothing", isSystem: true },
  { id: "cat-2", name: "Toiletries", isSystem: true },
];

function jsonResponse(status: number, body: unknown): Response {
  return {
    ok: status < 400,
    status,
    json: () => Promise.resolve(body),
  } as Response;
}

function mockFetch(handlers: Record<string, () => Response>) {
  vi.spyOn(globalThis, "fetch").mockImplementation((input, init) => {
    const url = typeof input === "string" ? input : input.toString();
    const key = `${init?.method ?? "GET"} ${url}`;
    const handler = handlers[key];
    if (!handler) {
      throw new Error(`no fetch mock registered for ${key}`);
    }
    return Promise.resolve(handler());
  });
}

function renderModal(props: { item?: Item; defaultCategoryId?: string }) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  const onClose = vi.fn();
  render(
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <ItemFormModal {...props} onClose={onClose} />
      </ToastProvider>
    </QueryClientProvider>,
  );
  return { onClose };
}

describe("ItemFormModal", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("new mode: defaults the category selection to the first category and disables submit while the name is blank", async () => {
    mockFetch({ "GET /api/categories": () => jsonResponse(200, categories) });

    renderModal({});

    await screen.findByText("Clothing");
    expect(screen.getByRole("button", { name: "Clothing" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(
      screen.getByRole("button", { name: "Add to library" }),
    ).toBeDisabled();
  });

  it("new mode: enables submit once a name is typed, then POSTs the trimmed name + selected category and closes on success", async () => {
    const created: Item = {
      id: "new-1",
      name: "Bum bag",
      categoryId: "cat-2",
      isSystem: false,
    };
    mockFetch({
      "GET /api/categories": () => jsonResponse(200, categories),
      "POST /api/items": () => jsonResponse(201, created),
    });

    const { onClose } = renderModal({});
    await screen.findByText("Clothing");

    fireEvent.click(screen.getByRole("button", { name: "Toiletries" }));
    fireEvent.change(screen.getByPlaceholderText("e.g. Bum bag"), {
      target: { value: "  Bum bag  " },
    });

    const submit = screen.getByRole("button", { name: "Add to library" });
    expect(submit).not.toBeDisabled();
    fireEvent.click(submit);

    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));

    expect(globalThis.fetch).toHaveBeenCalledWith(
      "/api/items",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ name: "Bum bag", categoryId: "cat-2" }),
      }),
    );
  });

  it("edit mode: prefills the name field and the item's current category, titled and labeled for editing", async () => {
    const item: Item = {
      id: "item-1",
      name: "Rain poncho",
      categoryId: "cat-2",
      isSystem: false,
    };
    mockFetch({ "GET /api/categories": () => jsonResponse(200, categories) });

    renderModal({ item });

    await screen.findByText("Edit item");
    expect(screen.getByPlaceholderText("e.g. Bum bag")).toHaveValue(
      "Rain poncho",
    );
    expect(screen.getByRole("button", { name: "Toiletries" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    screen.getByRole("button", { name: "Save" });
  });

  it("edit mode: submitting PATCHes /items/:id with the updated fields and closes on success", async () => {
    const item: Item = {
      id: "item-1",
      name: "Rain poncho",
      categoryId: "cat-2",
      isSystem: false,
    };
    const updated: Item = { ...item, name: "Rain jacket" };
    mockFetch({
      "GET /api/categories": () => jsonResponse(200, categories),
      "PATCH /api/items/item-1": () => jsonResponse(200, updated),
    });

    const { onClose } = renderModal({ item });
    await screen.findByText("Edit item");

    fireEvent.change(screen.getByPlaceholderText("e.g. Bum bag"), {
      target: { value: "Rain jacket" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));

    expect(globalThis.fetch).toHaveBeenCalledWith(
      "/api/items/item-1",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ name: "Rain jacket", categoryId: "cat-2" }),
      }),
    );
  });
});
