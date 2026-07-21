import { Route, Routes } from "react-router-dom";

import { SignInScreen } from "../features/auth/SignInScreen";

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<SignInScreen />} />
    </Routes>
  );
}
