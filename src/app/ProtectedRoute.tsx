import { Navigate, Outlet } from "react-router-dom";

import { useAuth } from "./AuthContext";
import { FullPageLoading } from "./FullPageLoading";

export function ProtectedRoute() {
  const { status } = useAuth();

  if (status === "checking") {
    return <FullPageLoading />;
  }

  if (status === "unauthenticated") {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
