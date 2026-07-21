import { Navigate, Route, Routes } from "react-router-dom";

import {
  DEFAULT_AUTHENTICATED_ROUTE,
  useAuth,
} from "../features/auth/AuthContext";
import { RequireAuth } from "../features/auth/RequireAuth";
import { SignInScreen } from "../features/auth/SignInScreen";
import { TripsScreen } from "../features/trips/TripsScreen";

export function AppRoutes() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div className="min-h-screen bg-bg" />;
  }

  return (
    <Routes>
      <Route
        path="/"
        element={
          isAuthenticated ? (
            <Navigate to={DEFAULT_AUTHENTICATED_ROUTE} replace />
          ) : (
            <SignInScreen />
          )
        }
      />
      <Route
        path="/auth/callback"
        element={
          <Navigate
            to={isAuthenticated ? DEFAULT_AUTHENTICATED_ROUTE : "/"}
            replace
          />
        }
      />
      <Route
        path="/trips"
        element={
          <RequireAuth>
            <TripsScreen />
          </RequireAuth>
        }
      />
    </Routes>
  );
}
