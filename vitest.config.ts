import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  test: {
    // happy-dom for the component/interaction tests; pure-logic suites run fine
    // under it too, so a single environment keeps config simple.
    environment: "happy-dom",
    setupFiles: ["./vitest.setup.ts"],
  },
  // Mirror the tsconfig "@/*" -> "./*" path alias so tests import like the app.
  resolve: {
    alias: { "@": root },
  },
});
