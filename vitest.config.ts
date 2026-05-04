import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["packages/**/*.test.ts", "apps/extension/**/*.test.ts"],
    passWithNoTests: true,
  },
});
