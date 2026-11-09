import react from "@vitejs/plugin-react";
import { resolve } from "node:path";
import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { "@": resolve(import.meta.dirname, "src") } },
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    // Playwright owns these: same *.spec.ts naming, different runner.
    exclude: [...configDefaults.exclude, "tests/e2e/**"],
  },
});
