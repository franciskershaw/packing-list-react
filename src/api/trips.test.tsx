import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ToastProvider } from "../components/ui/Toast";
import {
  TRIPS_QUERY_KEY,
  useUpdateTripItem,
  type PackingListDetail,
} from "./trips";

// Mirrors ItemFormModal.test.tsx's fetch-mocking harness (same repo, same
// shape: a status/body pair returned from a spied `fetch`).
function jsonResponse(status: number, body: unknown): Response {
  return {
    ok: status < 400,
    status,
    json: () => Promise.resolve(body),
  } as Response;
}

const detail: PackingListDetail = {
  id: "trip-1",
  name: "Holiday to Spain",
  eventDate: "2026-08-02",
  templateId: null,
  categories: [
    {
      id: "cat-1",
      name: "Clothing",
      items: [
        {
          itemId: "item-1",
          name: "Swimwear",
          quantity: 1,
          notes: null,
          isPacked: false,
          sortOrder: null,
        },
      ],
    },
  ],
};

function readIsPacked(queryClient: QueryClient) {
  return queryClient.getQueryData<PackingListDetail>([
    ...TRIPS_QUERY_KEY,
    "trip-1",
  ])?.categories[0].items[0].isPacked;
}

function renderUpdateTripItem() {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  });
  queryClient.setQueryData([...TRIPS_QUERY_KEY, "trip-1"], detail);

  function wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <ToastProvider>{children}</ToastProvider>
      </QueryClientProvider>
    );
  }

  const rendered = renderHook(() => useUpdateTripItem(), { wrapper });
  return { queryClient, ...rendered };
}

describe("useUpdateTripItem — optimistic packed toggle", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("flips isPacked in the cache immediately, then keeps it once the request confirms", async () => {
    let resolveFetch!: (response: Response) => void;
    vi.spyOn(globalThis, "fetch").mockReturnValue(
      new Promise((resolve) => {
        resolveFetch = resolve;
      }),
    );

    const { result, queryClient } = renderUpdateTripItem();

    result.current.mutate({
      tripId: "trip-1",
      itemId: "item-1",
      isPacked: true,
    });

    // Optimistic patch lands before the mocked fetch has resolved at all.
    await waitFor(() => expect(readIsPacked(queryClient)).toBe(true));

    resolveFetch(
      jsonResponse(200, { ...detail.categories[0].items[0], isPacked: true }),
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(readIsPacked(queryClient)).toBe(true);
  });

  it("rolls back to the pre-mutate value when the request is rejected", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      jsonResponse(500, { error: "failed to update item" }),
    );

    const { result, queryClient } = renderUpdateTripItem();

    result.current.mutate({
      tripId: "trip-1",
      itemId: "item-1",
      isPacked: true,
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(readIsPacked(queryClient)).toBe(false);
  });
});
