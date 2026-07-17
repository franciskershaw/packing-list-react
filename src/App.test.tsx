import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import { apiGet, apiPost } from "./api/client";
import App from "./App";

vi.mock("./api/client", async () => {
  const actual =
    await vi.importActual<typeof import("./api/client")>("./api/client");
  return {
    ...actual,
    apiPost: vi.fn(),
    apiGet: vi.fn(),
  };
});

describe("App shell", () => {
  it("renders the primary nav with Trips, Templates, and Library once authenticated", async () => {
    vi.mocked(apiPost).mockResolvedValueOnce({ accessToken: "test-token" });
    vi.mocked(apiGet).mockResolvedValueOnce({
      id: "1",
      email: "sam@example.com",
      name: "Sam Rivera",
      avatarUrl: "https://example.com/avatar.png",
    });

    render(
      <MemoryRouter initialEntries={["/trips"]}>
        <App />
      </MemoryRouter>,
    );

    await waitFor(() =>
      expect(screen.getByRole("link", { name: "Trips" })).toBeInTheDocument(),
    );
    expect(screen.getByRole("link", { name: "Templates" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Library" })).toBeInTheDocument();
  });
});
