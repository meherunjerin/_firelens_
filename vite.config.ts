import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  base: process.env.GITHUB_PAGES === "true" ? "/_firelens_/" : "/",
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
});
