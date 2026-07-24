import { BrowserRouter } from "react-router-dom";

import { ToastProvider } from "../components/ui/Toast";
import { AuthProvider } from "../features/auth/AuthContext";
import { AppRoutes } from "./AppRoutes";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <AppRoutes />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
