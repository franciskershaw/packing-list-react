import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import { setAccessToken } from "../api/authToken";
import { apiGet, apiPost } from "../api/client";
import type { RefreshResponse, UserProfile } from "../api/types";

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
  const [user, setUser] = useState<UserProfile | null>(null);
  const [status, setStatus] = useState<AuthStatus>("checking");

  useEffect(() => {
    let cancelled = false;

    async function restore() {
      try {
        const { accessToken } = await apiPost<RefreshResponse>("/auth/refresh");
        setAccessToken(accessToken);
        const profile = await apiGet<UserProfile>("/me");
        if (!cancelled) {
          setUser(profile);
          setStatus("authenticated");
        }
      } catch {
        if (!cancelled) {
          setUser(null);
          setStatus("unauthenticated");
        }
      }
    }

    void restore();
    return () => {
      cancelled = true;
    };
  }, []);

  async function logout() {
    try {
      await apiPost("/auth/logout");
    } finally {
      setAccessToken(null);
      setUser(null);
      setStatus("unauthenticated");
    }
  }

  return (
    <AuthContext.Provider value={{ user, status, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
