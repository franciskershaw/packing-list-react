import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  act,
  screen as domScreen,
  render,
  waitFor,
} from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { PackingList, PackingListDetail } from "../../api/trips";
import { ToastProvider } from "../../components/ui/Toast";
import { useTripsScreen, type UseTripsScreenResult } from "./useTripsScreen";

// Mirrors useTemplatesScreen.test.tsx's fetch-mocking harness (same repo,
// same shape: a method+URL keyed handler map over a spied `fetch`).
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

const trips: PackingList[] = [
  {
    id: "trip-1",
    name: "Holiday to Spain",
    eventDate: "2026-08-02",
    templateId: null,
    items: [],
  },
  {
    id: "trip-2",
    name: "Cornwall camping",
    eventDate: null,
    templateId: null,
    items: [],
  },
];

const tripDetail: PackingListDetail = {
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

let latest: UseTripsScreenResult | undefined;

// Renders inside real Routes (rather than mocking useNavigate/useParams
// directly) so selectTrip/goToList/archiveTrip are verified against an
// actual route-driven :tripId, not a stubbed router API.
function Probe() {
  latest = useTripsScreen();
  const location = useLocation();
  return <div data-testid="pathname">{location.pathname}</div>;
}

function renderAt(initialPath: string) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  render(
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <MemoryRouter initialEntries={[initialPath]}>
          <Routes>
            <Route path="/trips" element={<Probe />} />
            <Route path="/trips/:tripId" element={<Probe />} />
          </Routes>
        </MemoryRouter>
      </ToastProvider>
    </QueryClientProvider>,
  );
}

const baseHandlers = {
  "GET /api/lists": () => jsonResponse(200, trips),
  "GET /api/lists?archived=true": () => jsonResponse(200, []),
};

describe("useTripsScreen", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    latest = undefined;
  });

  it("does not fetch a selected trip's detail when the route has no :tripId", async () => {
    mockFetch(baseHandlers);

    renderAt("/trips");

    await waitFor(() => expect(latest?.trips).toEqual(trips));
    expect(latest?.selectedTripId).toBeUndefined();
    expect(latest?.selectedTrip).toBeUndefined();
    expect(globalThis.fetch).not.toHaveBeenCalledWith(
      "/api/lists/trip-1",
      expect.anything(),
    );
  });

  it("fetches the selected trip's detail when :tripId is present in the route", async () => {
    mockFetch({
      ...baseHandlers,
      "GET /api/lists/trip-1": () => jsonResponse(200, tripDetail),
    });

    renderAt("/trips/trip-1");

    await waitFor(() => expect(latest?.selectedTrip).toEqual(tripDetail));
    expect(latest?.selectedTripId).toBe("trip-1");
  });

  it("selectTrip navigates to the trip's detail route", async () => {
    mockFetch(baseHandlers);

    renderAt("/trips");
    await waitFor(() => expect(latest?.trips).toEqual(trips));

    act(() => latest?.selectTrip("trip-2"));

    await waitFor(() =>
      expect(domScreen.getByTestId("pathname")).toHaveTextContent(
        "/trips/trip-2",
      ),
    );
  });

  it("goToList navigates back to the trips list route", async () => {
    mockFetch({
      ...baseHandlers,
      "GET /api/lists/trip-1": () => jsonResponse(200, tripDetail),
    });

    renderAt("/trips/trip-1");
    await waitFor(() => expect(latest?.selectedTrip).toBeDefined());

    act(() => latest?.goToList());

    await waitFor(() =>
      expect(domScreen.getByTestId("pathname")).toHaveTextContent("/trips"),
    );
  });

  it("archiveTrip archives the trip and navigates back to the list", async () => {
    mockFetch({
      ...baseHandlers,
      "GET /api/lists/trip-1": () => jsonResponse(200, tripDetail),
      "DELETE /api/lists/trip-1": () => jsonResponse(204, undefined),
    });

    renderAt("/trips/trip-1");
    await waitFor(() => expect(latest?.selectedTrip).toBeDefined());

    act(() => latest?.archiveTrip("trip-1"));

    await domScreen.findByText("Tucked away in the archive");
    await waitFor(() =>
      expect(domScreen.getByTestId("pathname")).toHaveTextContent("/trips"),
    );
    expect(globalThis.fetch).toHaveBeenCalledWith(
      "/api/lists/trip-1",
      expect.objectContaining({ method: "DELETE" }),
    );
  });

  it("restoreTrip restores the trip without navigating away, unlike archive", async () => {
    mockFetch({
      ...baseHandlers,
      "GET /api/lists/trip-1": () => jsonResponse(200, tripDetail),
      "POST /api/lists/trip-1/unarchive": () => jsonResponse(204, undefined),
    });

    renderAt("/trips/trip-1");
    await waitFor(() => expect(latest?.selectedTrip).toBeDefined());

    act(() => latest?.restoreTrip("trip-1"));

    await domScreen.findByText("Back on the board");
    expect(domScreen.getByTestId("pathname")).toHaveTextContent(
      "/trips/trip-1",
    );
    expect(globalThis.fetch).toHaveBeenCalledWith(
      "/api/lists/trip-1/unarchive",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("resets isEditMode and collapsed category groups when switching to a different trip", async () => {
    mockFetch({
      ...baseHandlers,
      "GET /api/lists/trip-1": () => jsonResponse(200, tripDetail),
      "GET /api/lists/trip-2": () =>
        jsonResponse(200, { ...tripDetail, id: "trip-2" }),
    });

    renderAt("/trips/trip-1");
    await waitFor(() => expect(latest?.selectedTrip).toBeDefined());

    act(() => latest?.toggleEditMode());
    act(() => latest?.toggleCategoryCollapsed("cat-1"));
    expect(latest?.isEditMode).toBe(true);
    expect(latest?.collapsedCategoryIds.has("cat-1")).toBe(true);

    act(() => latest?.selectTrip("trip-2"));

    await waitFor(() =>
      expect(domScreen.getByTestId("pathname")).toHaveTextContent(
        "/trips/trip-2",
      ),
    );
    expect(latest?.isEditMode).toBe(false);
    expect(latest?.collapsedCategoryIds.size).toBe(0);
  });
});
