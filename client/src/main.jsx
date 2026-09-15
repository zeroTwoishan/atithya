import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "sonner";

import "./index.css";
import App from "./App.jsx";
import { applyTheme } from "./lib/useTheme";

// Before first paint, so the page never flashes light then swaps to dark.
applyTheme();

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <App />
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            fontFamily: "Inter, system-ui, sans-serif",
            fontSize: "13px",
            borderRadius: "9999px",
          },
        }}
      />
    </BrowserRouter>
  </StrictMode>,
);
