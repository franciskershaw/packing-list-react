import { Navigate, Route, Routes } from "react-router-dom";

import { CallbackScreen } from "../features/auth/CallbackScreen";
import { LoginScreen } from "../features/auth/LoginScreen";
import { ProfileScreen } from "../features/profile/ProfileScreen";
import { AppLayout } from "./AppLayout";
import { ProtectedRoute } from "./ProtectedRoute";
import { RoutePlaceholder } from "./RoutePlaceholder";

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/trips" replace />} />
      <Route path="/login" element={<LoginScreen />} />
      <Route path="/auth/callback" element={<CallbackScreen />} />
      <Route element={<ProtectedRoute />}>
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
          <Route
            path="/library"
            element={<RoutePlaceholder title="Library" />}
          />
          <Route path="/profile" element={<ProfileScreen />} />
        </Route>
      </Route>
    </Routes>
  );
}
