import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { cloudflare } from "@cloudflare/vite-plugin";

export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
  },
  plugins: [
    cloudflare({
      viteEnvironment: { name: "ssr" },
      // Force correct output paths
      wranglerConfig: {
        main: "dist/server/server.js"
      }
    }),
  ],
  build: {
    rollupOptions: {
      input: {
        server: "src/server.ts"
      }
    }
  }
});
