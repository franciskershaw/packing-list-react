import { afterEach, describe, expect, it, vi } from "vitest";

import { ApiError, apiFetch } from "./client";

function mockFetchOnce(status: number, jsonImpl: () => Promise<unknown>) {
  vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
    ok: false,
    status,
    json: jsonImpl,
  } as Response);
}

describe("apiFetch 204 handling", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns undefined for a 204 No Content response without parsing a body", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      status: 204,
      json: () =>
        Promise.reject(new SyntaxError("Unexpected end of JSON input")),
    } as Response);

    await expect(
      apiFetch("/categories/1", { method: "DELETE" }),
    ).resolves.toBeUndefined();
  });
});

describe("apiFetch error parsing", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("uses the .error field from a JSON error body", async () => {
    mockFetchOnce(409, () =>
      Promise.resolve({ error: "a category with this name already exists" }),
    );

    await expect(
      apiFetch("/categories", { method: "POST" }),
    ).rejects.toMatchObject({
      message: "a category with this name already exists",
      status: 409,
    } satisfies Partial<ApiError>);
  });

  it("falls back to a generic message when the body isn't valid JSON", async () => {
    mockFetchOnce(500, () =>
      Promise.reject(new SyntaxError("Unexpected token")),
    );

    await expect(apiFetch("/categories")).rejects.toMatchObject({
      message: "request failed",
      status: 500,
    } satisfies Partial<ApiError>);
  });

  it("falls back to a generic message when the JSON body has no .error field", async () => {
    mockFetchOnce(400, () => Promise.resolve({ somethingElse: true }));

    await expect(apiFetch("/categories")).rejects.toMatchObject({
      message: "request failed",
      status: 400,
    } satisfies Partial<ApiError>);
  });
});
