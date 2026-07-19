import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import TanstackQueryProvider from "./lib/Tanstack/TanstackQueryProvider.tsx";

import "./index.css";

import App from "./app/App.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <TanstackQueryProvider>
      <App />
    </TanstackQueryProvider>
  </StrictMode>,
);
