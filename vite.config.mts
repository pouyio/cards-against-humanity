import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";
import { VitePWA } from "vite-plugin-pwa";
import manifest from "./public/manifest.json" with { type: "json" };

export default defineConfig({
  base: "/",
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "pattern.png"],
      manifest,
      workbox: {
        globPatterns: ["**/*.{css,html,ico,js,json,png,svg}"],
      },
    }),
  ],
  build: {
    outDir: "build",
  },
  test: {
    environment: "jsdom",
    include: ["src/**/*.test.tsx"],
  },
});
