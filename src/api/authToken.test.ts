import { beforeEach, describe, expect, it } from "vitest";

import { queryClient } from "../lib/queryClient";
import { getAccessToken, setAccessToken } from "./authToken";

describe("authToken", () => {
  beforeEach(() => {
    queryClient.clear();
  });

  it("defaults to null before anything is set", () => {
    expect(getAccessToken()).toBeNull();
  });

  it("round-trips a token through setAccessToken/getAccessToken", () => {
    setAccessToken("test-token");
    expect(getAccessToken()).toBe("test-token");
  });

  it("round-trips back to null", () => {
    setAccessToken("test-token");
    setAccessToken(null);
    expect(getAccessToken()).toBeNull();
  });
});
