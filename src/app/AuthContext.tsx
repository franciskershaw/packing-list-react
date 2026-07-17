import { createContext, useContext, type ReactNode } from "react";

import type { UserProfile } from "../api/types";

type AuthStatus = "checking" | "authenticated" | "unauthenticated";

type AuthState = {
  user: UserProfile | null;
  status: AuthStatus;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

// Colocated with AuthProvider deliberately — they're tightly coupled and
// should be read/reviewed together. Costs Fast Refresh reliability in
// rare cases, not correctness.
// oxlint-disable-next-line react/only-export-components
export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const stubValue: AuthState = {
    user: null,
    status: "checking",
    logout: async () => {
      throw new Error("not implemented");
    },
  };

  return (
    <AuthContext.Provider value={stubValue}>{children}</AuthContext.Provider>
  );
}
