import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { cloudflare } from "@cloudflare/vite-plugin";

export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
  },
  plugins: [
    cloudflare({ viteEnvironment: { name: "ssr" } }), // Important
  ],
});
