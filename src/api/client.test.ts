import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { queryClient } from "../lib/queryClient";
import { getAccessToken, setAccessToken } from "./authToken";
import { ApiError, apiGet } from "./client";

function mockFetchOnce(response: {
  ok: boolean;
  status: number;
  json?: () => Promise<unknown>;
}) {
  const fetchMock = vi.fn().mockResolvedValue(response);
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("client", () => {
  beforeEach(() => {
    queryClient.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("prepends /api to the request path", async () => {
    const fetchMock = mockFetchOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve([]),
    });

    await apiGet("/categories");

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/categories",
      expect.anything(),
    );
  });

  it("attaches Authorization when a token is set", async () => {
    setAccessToken("test-token");
    const fetchMock = mockFetchOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve([]),
    });

    await apiGet("/categories");

    const [, options] = fetchMock.mock.calls[0] as [string, RequestInit];
    const headers = new Headers(options.headers);
    expect(headers.get("Authorization")).toBe("Bearer test-token");
  });

  it("omits Authorization when no token is set", async () => {
    const fetchMock = mockFetchOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve([]),
    });

    await apiGet("/categories");

    const [, options] = fetchMock.mock.calls[0] as [string, RequestInit];
    const headers = new Headers(options.headers);
    expect(headers.has("Authorization")).toBe(false);
  });

  it("clears the token and throws ApiError on a 401", async () => {
    setAccessToken("stale-token");
    mockFetchOnce({
      ok: false,
      status: 401,
      json: () => Promise.resolve({ error: "unauthorized" }),
    });

    await expect(apiGet("/categories")).rejects.toThrow(ApiError);
    expect(getAccessToken()).toBeNull();
  });

  it("throws ApiError with status and body on a 409", async () => {
    mockFetchOnce({
      ok: false,
      status: 409,
      json: () =>
        Promise.resolve({ error: "a category with this name already exists" }),
    });

    const error = await apiGet("/categories").catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).status).toBe(409);
    expect((error as ApiError).body).toEqual({
      error: "a category with this name already exists",
    });
  });

  it("resolves to undefined on a 204", async () => {
    mockFetchOnce({ ok: true, status: 204 });

    const result = await apiGet("/lists/1/pack-all");

    expect(result).toBeUndefined();
  });

  it("resolves to the parsed JSON body on a 2xx response", async () => {
    const body = [{ id: "1", name: "Hiking", isSystem: false }];
    mockFetchOnce({ ok: true, status: 200, json: () => Promise.resolve(body) });

    const result = await apiGet("/categories");

    expect(result).toEqual(body);
  });
});
