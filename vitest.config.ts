import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["packages/**/*.test.ts", "apps/extension/**/*.test.ts", "scripts/**/*.test.ts"],
    exclude: ["packages/projocalypse/**", "node_modules/**"],
    passWithNoTests: true,
  },
});
