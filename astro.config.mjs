// @ts-check
import { defineConfig, envField } from "astro/config";
import cloudflare from "@astrojs/cloudflare";
import tailwindcss from "@tailwindcss/vite";

// https://astro.build/config
export default defineConfig({
  adapter: cloudflare(),
  vite: {
    plugins: [tailwindcss()],
    mode: "server",
    optimizeDeps: {
      include: ["astro-leaflet > leaflet"],
    },
    build: {
      minify: false,
    },
  },
});
