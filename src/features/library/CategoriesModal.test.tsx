import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { Category } from "../../api/categories";
import type { Item } from "../../api/items";
import { ToastProvider } from "../../components/ui/Toast";
import { CategoriesModal } from "./CategoriesModal";

const API_URL = import.meta.env.VITE_API_URL;

const categories: Category[] = [
  { id: "cat-1", name: "Clothing", isSystem: true },
  { id: "cat-2", name: "Festival kit", isSystem: false },
];

const items: Item[] = [
  { id: "item-1", name: "T-shirts", categoryId: "cat-1", isSystem: true },
  { id: "item-2", name: "Shorts", categoryId: "cat-1", isSystem: true },
  { id: "item-3", name: "Poncho", categoryId: "cat-2", isSystem: false },
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

function renderModal() {
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
        <CategoriesModal onClose={onClose} />
      </ToastProvider>
    </QueryClientProvider>,
  );
  return { onClose };
}

describe("CategoriesModal", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("hides built-in categories by default; 'Show built-in' reveals their item count and Built-in badge, 'Hide built-in' re-hides them", async () => {
    mockFetch({
      [`GET ${API_URL}/categories`]: () => jsonResponse(200, categories),
      [`GET ${API_URL}/items`]: () => jsonResponse(200, items),
    });

    renderModal();
    await screen.findByText("Festival kit");
    expect(screen.getByText("1 items")).toBeInTheDocument();
    expect(screen.queryByText("Clothing")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Show built-in (1)" }));

    expect(screen.getByText("Clothing")).toBeInTheDocument();
    expect(screen.getByText("2 items")).toBeInTheDocument();
    expect(screen.getByText("Built-in")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Hide built-in (1)" }));

    expect(screen.queryByText("Clothing")).toBeNull();
  });

  it("clicking a user-owned row enters rename mode, hiding its delete icon; clicking another row switches which one is renaming", async () => {
    mockFetch({
      [`GET ${API_URL}/categories`]: () => jsonResponse(200, categories),
      [`GET ${API_URL}/items`]: () => jsonResponse(200, items),
    });

    renderModal();
    await screen.findByText("Festival kit");

    fireEvent.click(screen.getByText("Festival kit"));

    expect(screen.getByPlaceholderText("Category name")).toHaveValue(
      "Festival kit",
    );
    expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Delete Festival kit" }),
    ).toBeNull();
  });

  it("Escape cancels rename mode without closing the whole modal", async () => {
    mockFetch({
      [`GET ${API_URL}/categories`]: () => jsonResponse(200, categories),
      [`GET ${API_URL}/items`]: () => jsonResponse(200, items),
    });

    const { onClose } = renderModal();
    await screen.findByText("Festival kit");
    fireEvent.click(screen.getByText("Festival kit"));

    fireEvent.keyDown(screen.getByPlaceholderText("Category name"), {
      key: "Escape",
      code: "Escape",
    });

    expect(screen.queryByPlaceholderText("Category name")).toBeNull();
    expect(onClose).not.toHaveBeenCalled();
  });

  it("Cancel button exits rename mode without saving", async () => {
    mockFetch({
      [`GET ${API_URL}/categories`]: () => jsonResponse(200, categories),
      [`GET ${API_URL}/items`]: () => jsonResponse(200, items),
    });

    renderModal();
    await screen.findByText("Festival kit");
    fireEvent.click(screen.getByText("Festival kit"));

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(screen.queryByPlaceholderText("Category name")).toBeNull();
    expect(globalThis.fetch).not.toHaveBeenCalledWith(
      expect.stringContaining(`${API_URL}/categories/cat-2`),
      expect.anything(),
    );
  });

  it("disables Save while the rename input is blank, and PATCHes the trimmed name on save", async () => {
    const updated: Category = { ...categories[1]!, name: "Camping" };
    mockFetch({
      [`GET ${API_URL}/categories`]: () => jsonResponse(200, categories),
      [`GET ${API_URL}/items`]: () => jsonResponse(200, items),
      [`PATCH ${API_URL}/categories/cat-2`]: () => jsonResponse(200, updated),
    });

    renderModal();
    await screen.findByText("Festival kit");
    fireEvent.click(screen.getByText("Festival kit"));

    const input = screen.getByPlaceholderText("Category name");
    fireEvent.change(input, { target: { value: "   " } });
    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();

    fireEvent.change(input, { target: { value: "  Camping  " } });
    const save = screen.getByRole("button", { name: "Save" });
    expect(save).not.toBeDisabled();
    fireEvent.click(save);

    await waitFor(() =>
      expect(screen.queryByPlaceholderText("Category name")).toBeNull(),
    );
    expect(globalThis.fetch).toHaveBeenCalledWith(
      `${API_URL}/categories/cat-2`,
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ name: "Camping" }),
      }),
    );
  });

  it("persistent Add row: disabled while blank, POSTs the trimmed name and clears the input on success", async () => {
    const created: Category = {
      id: "cat-3",
      name: "Sports",
      isSystem: false,
    };
    mockFetch({
      [`GET ${API_URL}/categories`]: () => jsonResponse(200, categories),
      [`GET ${API_URL}/items`]: () => jsonResponse(200, items),
      [`POST ${API_URL}/categories`]: () => jsonResponse(201, created),
    });

    renderModal();
    await screen.findByText("Festival kit");

    const input = screen.getByPlaceholderText("New category name…");
    expect(screen.getByRole("button", { name: "Add" })).toBeDisabled();

    fireEvent.change(input, { target: { value: "  Sports  " } });
    const add = screen.getByRole("button", { name: "Add" });
    expect(add).not.toBeDisabled();
    fireEvent.click(add);

    await waitFor(() => expect(input).toHaveValue(""));
    expect(globalThis.fetch).toHaveBeenCalledWith(
      `${API_URL}/categories`,
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ name: "Sports" }),
      }),
    );
  });

  it("deleting a category: confirm dialog gates the DELETE request", async () => {
    mockFetch({
      [`GET ${API_URL}/categories`]: () => jsonResponse(200, categories),
      [`GET ${API_URL}/items`]: () => jsonResponse(200, items),
      [`DELETE ${API_URL}/categories/cat-2`]: () =>
        jsonResponse(204, undefined),
    });

    renderModal();
    await screen.findByText("Festival kit");

    fireEvent.click(
      screen.getByRole("button", { name: "Delete Festival kit" }),
    );
    screen.getByText("Delete Festival kit?");
    expect(globalThis.fetch).not.toHaveBeenCalledWith(
      `${API_URL}/categories/cat-2`,
      expect.objectContaining({ method: "DELETE" }),
    );

    fireEvent.click(screen.getByRole("button", { name: "Delete" }));

    await waitFor(() =>
      expect(globalThis.fetch).toHaveBeenCalledWith(
        `${API_URL}/categories/cat-2`,
        expect.objectContaining({ method: "DELETE" }),
      ),
    );
  });
});
