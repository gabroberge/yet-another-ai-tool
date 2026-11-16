// @ts-check
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  site: "https://gabroberge.github.io",
  base: "/yet-another-ai-tool",
  vite: {
    plugins: [tailwindcss()],
  },
});
