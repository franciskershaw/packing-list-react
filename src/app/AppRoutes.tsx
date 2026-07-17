import { Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "./AppLayout";
import { RoutePlaceholder } from "./RoutePlaceholder";

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/trips" replace />} />
      <Route path="/login" element={<RoutePlaceholder title="Login" />} />
      <Route
        path="/auth/callback"
        element={<RoutePlaceholder title="Signing in…" />}
      />
      <Route element={<AppLayout />}>
        <Route path="/trips" element={<RoutePlaceholder title="Trips" />} />
        <Route
          path="/trips/:id"
          element={<RoutePlaceholder title="Trip detail" />}
        />
        <Route
          path="/templates"
          element={<RoutePlaceholder title="Templates" />}
        />
        <Route
          path="/templates/:id"
          element={<RoutePlaceholder title="Template detail" />}
        />
        <Route path="/library" element={<RoutePlaceholder title="Library" />} />
        <Route path="/profile" element={<RoutePlaceholder title="Profile" />} />
      </Route>
    </Routes>
  );
}
