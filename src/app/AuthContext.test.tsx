import { act, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ApiError, apiGet, apiPost } from "../api/client";
import { queryClient } from "../lib/queryClient";
import { createMockUserProfile } from "../test/fixtures";
import { AuthProvider, useAuth } from "./AuthContext";

vi.mock("../api/client");

function TestConsumer() {
  const { user, status, logout } = useAuth();
  return (
    <div>
      <div data-testid="status">{status}</div>
      <div data-testid="user">{user ? user.name : "none"}</div>
      <button onClick={() => void logout()}>Sign out</button>
    </div>
  );
}

const testUser = createMockUserProfile();

describe("AuthContext", () => {
  beforeEach(() => {
    queryClient.clear();
    vi.mocked(apiPost).mockReset();
    vi.mocked(apiGet).mockReset();
  });

  it("throws when useAuth is called outside AuthProvider", () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    expect(() => render(<TestConsumer />)).toThrow(
      "useAuth must be used within an AuthProvider",
    );
    consoleError.mockRestore();
  });

  it("becomes authenticated after a successful refresh + /me", async () => {
    vi.mocked(apiPost).mockResolvedValueOnce({ accessToken: "test-token" });
    vi.mocked(apiGet).mockResolvedValueOnce(testUser);

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );

    expect(screen.getByTestId("status")).toHaveTextContent("checking");

    await waitFor(() =>
      expect(screen.getByTestId("status")).toHaveTextContent("authenticated"),
    );
    expect(screen.getByTestId("user")).toHaveTextContent("Sam Rivera");
  });

  it("becomes unauthenticated after a failed refresh", async () => {
    vi.mocked(apiPost).mockRejectedValueOnce(
      new ApiError(401, { error: "unauthorized" }),
    );

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );

    await waitFor(() =>
      expect(screen.getByTestId("status")).toHaveTextContent("unauthenticated"),
    );
    expect(screen.getByTestId("user")).toHaveTextContent("none");
  });

  it("logout calls POST /auth/logout and resets to unauthenticated", async () => {
    vi.mocked(apiPost).mockResolvedValueOnce({ accessToken: "test-token" });
    vi.mocked(apiGet).mockResolvedValueOnce(testUser);

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );

    await waitFor(() =>
      expect(screen.getByTestId("status")).toHaveTextContent("authenticated"),
    );

    vi.mocked(apiPost).mockResolvedValueOnce(undefined);

    await act(async () => {
      screen.getByText("Sign out").click();
    });

    expect(apiPost).toHaveBeenCalledWith("/auth/logout");
    await waitFor(() =>
      expect(screen.getByTestId("status")).toHaveTextContent("unauthenticated"),
    );
    expect(screen.getByTestId("user")).toHaveTextContent("none");
  });
});
