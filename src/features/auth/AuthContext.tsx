import { createContext, useContext, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";

import { refreshAccessToken } from "../../lib/api/client";
import { setAccessToken } from "../../lib/api/tokenStore";
import { fetchMe, type User } from "./api";

async function fetchSession(): Promise<User | null> {
  try {
    await refreshAccessToken();
  } catch {
    return null;
  }

  try {
    return await fetchMe();
  } catch {
    setAccessToken(null);
    return null;
  }
}

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AUTH_SESSION_QUERY_KEY = ["auth", "session"] as const;
export const DEFAULT_AUTHENTICATED_ROUTE = "/trips";

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: user, isLoading } = useQuery({
    queryKey: AUTH_SESSION_QUERY_KEY,
    queryFn: fetchSession,
    staleTime: Infinity,
  });

  const value: AuthContextValue = {
    user: user ?? null,
    isAuthenticated: !!user,
    isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
