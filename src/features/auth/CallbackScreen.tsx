import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../../app/AuthContext";
import { FullPageLoading } from "../../app/FullPageLoading";

export function CallbackScreen() {
  const { status } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (status === "authenticated") {
      navigate("/trips", { replace: true });
    }
    if (status === "unauthenticated") {
      navigate("/login", { replace: true });
    }
  }, [status, navigate]);

  return <FullPageLoading />;
}
