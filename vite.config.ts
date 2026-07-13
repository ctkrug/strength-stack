import { defineConfig } from "vite";

export default defineConfig({
  // Relative asset paths so the build works when served from any subpath
  // (e.g. apps.charliekrug.com/strength-stack).
  base: "./",
  build: {
    outDir: "dist",
  },
});
