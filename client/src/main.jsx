import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";

import "./index.css";
import App from "./App.jsx";
import { applyTheme } from "./lib/useTheme";

// Before first paint, so the page never flashes light then swaps to dark.
applyTheme();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Agent calls are slow and expensive; a stage demo re-focuses the window
      // constantly. Don't re-plan a trip because someone alt-tabbed.
      refetchOnWindowFocus: false,
      staleTime: 30_000,
      retry: 1,
    },
  },
});

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
        <Toaster position="top-center" toastOptions={{ style: { fontFamily: "Inter, system-ui, sans-serif" } }} />
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
);
