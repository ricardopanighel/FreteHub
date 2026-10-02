import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  // Alvo do proxy /api. Siga a porta do backend (SERVER_PORT) definindo
  // VITE_PROXY_TARGET, ex.: VITE_PROXY_TARGET=http://localhost:8081 npm run dev
  const target =
    process.env.VITE_PROXY_TARGET ?? env.VITE_PROXY_TARGET ?? "http://localhost:8080";

  return {
    plugins: [react(), tailwindcss()],
    server: {
      port: 5173,
      proxy: {
        "/api": {
          target,
          changeOrigin: true,
        },
      },
    },
  };
});
