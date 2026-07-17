import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import { ProtectedRoute } from "./ProtectedRoute";

const mockUseAuth = vi.fn();
vi.mock("./AuthContext", () => ({
  useAuth: () => mockUseAuth(),
}));

function renderProtected() {
  return render(
    <MemoryRouter initialEntries={["/trips"]}>
      <Routes>
        <Route path="/login" element={<div>Login screen</div>} />
        <Route element={<ProtectedRoute />}>
          <Route path="/trips" element={<div>Trips content</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

describe("ProtectedRoute", () => {
  it("renders a loading state while checking", () => {
    mockUseAuth.mockReturnValue({
      status: "checking",
      user: null,
      logout: vi.fn(),
    });
    renderProtected();
    expect(screen.getByText("Loading…")).toBeInTheDocument();
  });

  it("redirects to /login when unauthenticated", () => {
    mockUseAuth.mockReturnValue({
      status: "unauthenticated",
      user: null,
      logout: vi.fn(),
    });
    renderProtected();
    expect(screen.getByText("Login screen")).toBeInTheDocument();
  });

  it("renders the outlet when authenticated", () => {
    mockUseAuth.mockReturnValue({
      status: "authenticated",
      user: { id: "1", email: "sam@example.com", name: "Sam", avatarUrl: "" },
      logout: vi.fn(),
    });
    renderProtected();
    expect(screen.getByText("Trips content")).toBeInTheDocument();
  });
});
