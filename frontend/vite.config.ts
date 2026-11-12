import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";
import { defineConfig, type Plugin } from "vite";

// Dev only: serve the React app's index.html for client-side routes under /app.
const appFallback = (): Plugin => ({
  name: "app-fallback",
  configureServer(server) {
    server.middlewares.use((req, _res, next) => {
      if (req.url && /^\/app(\/|$)/.test(req.url) && !req.url.split("?")[0].includes(".")) req.url = "/app/index.html";
      next();
    });
  },
});

export default defineConfig({
  plugins: [react(), tailwindcss(), appFallback()],
  server: { proxy: { "/api": "http://localhost:8000" } },
  build: {
    rollupOptions: {
      input: { main: resolve(__dirname, "index.html"), app: resolve(__dirname, "app/index.html") },
    },
  },
});
