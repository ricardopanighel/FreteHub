import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { IconContext, type IconProps } from "@phosphor-icons/react";
import App from "./App";
import { AuthProvider } from "./lib/auth";
import "@fontsource-variable/plus-jakarta-sans";
import "./index.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// Icones acompanham texto visivel, entao sao decorativos por padrao.
// Quem carrega significado sozinho passa aria-hidden={false} e um rotulo.
const ICON_DEFAULTS: IconProps = {
  size: "1em",
  weight: "regular",
  "aria-hidden": true,
};

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <IconContext.Provider value={ICON_DEFAULTS}>
            <App />
          </IconContext.Provider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
);
