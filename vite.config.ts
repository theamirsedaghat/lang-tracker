import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "prompt",
      includeAssets: ["icon.svg"],
      manifest: {
        name: "English Mastery OS – Pre IELTS",
        short_name: "Mastery OS",
        description: "Offline-first learning progress tracker",
        theme_color: "#10162b",
        background_color: "#10162b",
        display: "standalone",
        start_url: "/",
        lang: "en",
        dir: "ltr",
        icons: [
          {
            src: "/icon.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "any maskable",
          },
        ],
      },
      workbox: {
        navigateFallback: "/index.html",
        globPatterns: ["**/*.{js,css,html,svg,ico,png,webp}"],
        cleanupOutdatedCaches: true,
      },
    }),
  ],
});
