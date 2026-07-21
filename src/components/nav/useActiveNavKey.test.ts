import { describe, expect, it } from "vitest";

import { getActiveNavKey } from "./useActiveNavKey";

describe("getActiveNavKey", () => {
  it.each([
    ["/trips", "trips"],
    ["/templates", "templates"],
    ["/library", "library"],
    ["/profile", "profile"],
  ] as const)("matches an exact path (%s)", (pathname, expected) => {
    expect(getActiveNavKey(pathname)).toBe(expected);
  });

  it("matches a nested path under a nav item", () => {
    expect(getActiveNavKey("/trips/123")).toBe("trips");
  });

  it("does not match a path that merely starts with a nav item's segment", () => {
    expect(getActiveNavKey("/library-archive")).toBeNull();
  });

  it("returns null for a route with no nav item", () => {
    expect(getActiveNavKey("/auth/callback")).toBeNull();
  });

  it("returns null for the root path", () => {
    expect(getActiveNavKey("/")).toBeNull();
  });
});
