import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    coverage: {
      provider: "v8",
      // A few branches are unreachable defensive guards (e.g. a DOM node
      // required to be missing that the app itself never removes) — these
      // thresholds sit a few points under the current measured numbers so
      // a real regression still fails the build without being brittle.
      thresholds: {
        statements: 95,
        branches: 90,
        functions: 95,
        lines: 95,
      },
    },
  },
});
