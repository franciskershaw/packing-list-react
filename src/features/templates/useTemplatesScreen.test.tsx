import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { Template } from "../../api/templates";
import { ToastProvider } from "../../components/ui/Toast";
import {
  useTemplatesScreen,
  type UseTemplatesScreenResult,
} from "./useTemplatesScreen";

// Mirrors ItemFormModal.test.tsx's fetch-mocking harness (same repo,
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

const API_URL = import.meta.env.VITE_API_URL;

const templates: Template[] = [
  {
    id: "t-1",
    name: "Festival essentials",
    description: "Mud-proof and music-ready.",
    items: [],
    itemCount: 0,
  },
  {
    id: "t-2",
    name: "Beach holiday",
    description: null,
    items: [],
    itemCount: 0,
  },
];

let latest: UseTemplatesScreenResult | undefined;

// Renders inside real Routes (rather than mocking useNavigate/useParams
// directly) so selectTemplate/goToList are verified against an actual
// route-driven :templateId, not a stubbed router API.
function Probe() {
  latest = useTemplatesScreen();
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
            <Route path="/templates" element={<Probe />} />
            <Route path="/templates/:templateId" element={<Probe />} />
          </Routes>
        </MemoryRouter>
      </ToastProvider>
    </QueryClientProvider>,
  );
}

describe("useTemplatesScreen", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    latest = undefined;
  });

  it("does not fetch a selected template when the route has no :templateId", async () => {
    mockFetch({
      [`GET ${API_URL}/templates`]: () => jsonResponse(200, templates),
    });

    renderAt("/templates");

    await waitFor(() => expect(latest?.templates).toEqual(templates));
    expect(latest?.selectedTemplateId).toBeUndefined();
    expect(latest?.selectedTemplate).toBeUndefined();
    expect(globalThis.fetch).not.toHaveBeenCalledWith(
      `${API_URL}/templates/t-1`,
      expect.anything(),
    );
  });

  it("fetches the selected template's detail when :templateId is present in the route", async () => {
    const detail = templates[0];
    mockFetch({
      [`GET ${API_URL}/templates`]: () => jsonResponse(200, templates),
      [`GET ${API_URL}/templates/t-1`]: () => jsonResponse(200, detail),
    });

    renderAt("/templates/t-1");

    await waitFor(() => expect(latest?.selectedTemplate).toEqual(detail));
    expect(latest?.selectedTemplateId).toBe("t-1");
  });

  it("selectTemplate navigates to the template's detail route", async () => {
    mockFetch({
      [`GET ${API_URL}/templates`]: () => jsonResponse(200, templates),
    });

    renderAt("/templates");
    await waitFor(() => expect(latest?.templates).toEqual(templates));

    act(() => latest?.selectTemplate("t-2"));

    await waitFor(() =>
      expect(screen.getByTestId("pathname")).toHaveTextContent(
        "/templates/t-2",
      ),
    );
  });

  it("goToList navigates back to the templates list route", async () => {
    mockFetch({
      [`GET ${API_URL}/templates`]: () => jsonResponse(200, templates),
      [`GET ${API_URL}/templates/t-1`]: () => jsonResponse(200, templates[0]),
    });

    renderAt("/templates/t-1");
    await waitFor(() => expect(latest?.selectedTemplate).toBeDefined());

    act(() => latest?.goToList());

    await waitFor(() =>
      expect(screen.getByTestId("pathname")).toHaveTextContent("/templates"),
    );
  });

  it("createTemplate creates immediately with a default name and navigates to its detail route", async () => {
    const created: Template = {
      id: "t-new",
      name: "Untitled template",
      description: null,
      items: [],
      itemCount: 0,
    };
    mockFetch({
      [`GET ${API_URL}/templates`]: () => jsonResponse(200, templates),
      [`POST ${API_URL}/templates`]: () => jsonResponse(201, created),
    });

    renderAt("/templates");
    await waitFor(() => expect(latest?.templates).toEqual(templates));

    act(() => latest?.createTemplate());

    await waitFor(() =>
      expect(screen.getByTestId("pathname")).toHaveTextContent(
        "/templates/t-new",
      ),
    );
    expect(globalThis.fetch).toHaveBeenCalledWith(
      `${API_URL}/templates`,
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ name: "Untitled template" }),
      }),
    );
    expect(latest?.justCreatedTemplateId).toBe("t-new");
  });

  it("justCreatedTemplateId is cleared by an explicit selectTemplate/goToList navigation, not just any render", async () => {
    const created: Template = {
      id: "t-new",
      name: "Untitled template",
      description: null,
      items: [],
      itemCount: 0,
    };
    mockFetch({
      [`GET ${API_URL}/templates`]: () => jsonResponse(200, templates),
      [`POST ${API_URL}/templates`]: () => jsonResponse(201, created),
    });

    renderAt("/templates");
    await waitFor(() => expect(latest?.templates).toEqual(templates));

    act(() => latest?.createTemplate());
    await waitFor(() => expect(latest?.justCreatedTemplateId).toBe("t-new"));

    act(() => latest?.goToList());
    await waitFor(() =>
      expect(screen.getByTestId("pathname")).toHaveTextContent("/templates"),
    );
    expect(latest?.justCreatedTemplateId).toBeNull();
  });

  it("createTemplate avoids the backend's duplicate-name 409 by suffixing when the default name is taken", async () => {
    const existing = [
      ...templates,
      {
        id: "t-3",
        name: "Untitled template",
        description: null,
        items: [],
        itemCount: 0,
      },
    ];
    const created: Template = {
      id: "t-new",
      name: "Untitled template 2",
      description: null,
      items: [],
      itemCount: 0,
    };
    mockFetch({
      [`GET ${API_URL}/templates`]: () => jsonResponse(200, existing),
      [`POST ${API_URL}/templates`]: () => jsonResponse(201, created),
    });

    renderAt("/templates");
    await waitFor(() => expect(latest?.templates).toEqual(existing));

    act(() => latest?.createTemplate());

    await waitFor(() =>
      expect(screen.getByTestId("pathname")).toHaveTextContent(
        "/templates/t-new",
      ),
    );
    expect(globalThis.fetch).toHaveBeenCalledWith(
      `${API_URL}/templates`,
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ name: "Untitled template 2" }),
      }),
    );
  });

  it("deleteTemplate removes the template, navigates back to the list, and doesn't also error-toast from refetching the now-gone detail query", async () => {
    let templateDeleted = false;
    mockFetch({
      [`GET ${API_URL}/templates`]: () => jsonResponse(200, templates),
      [`GET ${API_URL}/templates/t-1`]: () =>
        templateDeleted
          ? jsonResponse(404, { error: "template not found" })
          : jsonResponse(200, templates[0]),
      [`DELETE ${API_URL}/templates/t-1`]: () => {
        templateDeleted = true;
        return jsonResponse(204, undefined);
      },
    });

    renderAt("/templates/t-1");
    await waitFor(() => expect(latest?.selectedTemplate).toBeDefined());

    act(() => latest?.deleteTemplate("t-1", "Festival essentials"));

    await screen.findByText("Festival essentials removed");
    await waitFor(() =>
      expect(screen.getByTestId("pathname")).toHaveTextContent("/templates"),
    );
    expect(globalThis.fetch).toHaveBeenCalledWith(
      `${API_URL}/templates/t-1`,
      expect.objectContaining({ method: "DELETE" }),
    );
    expect(screen.queryByText("template not found")).not.toBeInTheDocument();
  });
});
