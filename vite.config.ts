import { defineConfig } from "vite";

export default defineConfig({
  // Relative asset paths so the build works when served from any subpath
  // (e.g. apps.charliekrug.com/strength-stack).
  base: "./",
  build: {
    // The publisher serves this directory as the live site.
    outDir: "site",
  },
});
