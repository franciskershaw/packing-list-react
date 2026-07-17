import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import { mockUseAuth } from "../../app/__mocks__/AuthContext";
import { CallbackScreen } from "./CallbackScreen";

vi.mock("../../app/AuthContext");

function renderCallback() {
  return render(
    <MemoryRouter initialEntries={["/auth/callback"]}>
      <Routes>
        <Route path="/auth/callback" element={<CallbackScreen />} />
        <Route path="/trips" element={<div>Trips content</div>} />
        <Route path="/login" element={<div>Login screen</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("CallbackScreen", () => {
  it("renders a loading state while checking", () => {
    mockUseAuth.mockReturnValue({
      status: "checking",
      user: null,
      logout: vi.fn(),
    });
    renderCallback();
    expect(screen.getByText("Loading…")).toBeInTheDocument();
  });

  it("navigates to /trips once authenticated", () => {
    mockUseAuth.mockReturnValue({
      status: "authenticated",
      user: null,
      logout: vi.fn(),
    });
    renderCallback();
    expect(screen.getByText("Trips content")).toBeInTheDocument();
  });

  it("navigates to /login once unauthenticated", () => {
    mockUseAuth.mockReturnValue({
      status: "unauthenticated",
      user: null,
      logout: vi.fn(),
    });
    renderCallback();
    expect(screen.getByText("Login screen")).toBeInTheDocument();
  });
});
