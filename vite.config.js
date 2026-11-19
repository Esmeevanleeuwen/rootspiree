import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { createApi } from "./server/api.js";
import { handleWorld, setupWorld } from "./server/world.js";

export default defineConfig({
  base: "./",
  plugins: [
    react(),
    {
      name: "rootspiree-api",
      configureServer(server) {
        const { handler, close } = createApi({
          extra: handleWorld,
          setup: setupWorld,
        });
        server.middlewares.use((req, res, next) => {
          if (req.url === "/api" || req.url?.startsWith("/api/"))
            void handler(req, res);
          else next();
        });
        server.httpServer?.once("close", close);
      },
    },
  ],
});
