import { Navigate, Route, Routes } from "react-router-dom";

import { AppShell } from "../components/nav/AppShell";
import {
  DEFAULT_AUTHENTICATED_ROUTE,
  useAuth,
} from "../features/auth/AuthContext";
import { RequireAuth } from "../features/auth/RequireAuth";
import { SignInScreen } from "../features/auth/SignInScreen";
import { LibraryScreen } from "../features/library/LibraryScreen";
import { ProfileScreen } from "../features/profile/ProfileScreen";
import { TemplatesScreen } from "../features/templates/TemplatesScreen";
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
        element={
          <RequireAuth>
            <AppShell />
          </RequireAuth>
        }
      >
        <Route path="/trips" element={<TripsScreen />} />
        <Route path="/templates" element={<TemplatesScreen />} />
        <Route path="/library" element={<LibraryScreen />} />
        <Route path="/profile" element={<ProfileScreen />} />
      </Route>
    </Routes>
  );
}
