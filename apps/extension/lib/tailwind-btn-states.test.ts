import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const tailwindCssPath = join(
  dirname(fileURLToPath(import.meta.url)),
  "../entrypoints/newtab/tailwind.css",
);

describe("tailwind.css shared button states", () => {
  it("defines :hover and :active for .btn variants used across the extension", () => {
    const css = readFileSync(tailwindCssPath, "utf8");
    for (const needle of [
      ".btn:hover",
      ".btn:active",
      ".btn.primary:hover",
      ".btn.primary:active",
      ".btn.ghost:hover",
      ".btn.ghost:active",
      ".btn:disabled",
      ".btn.ghost:disabled:hover",
    ]) {
      expect(css, `missing ${needle}`).toContain(needle);
    }
  });

  it("defines :hover and :active for .linkish (footer text buttons)", () => {
    const css = readFileSync(tailwindCssPath, "utf8");
    expect(css).toContain(".linkish:hover");
    expect(css).toContain(".linkish:active");
  });
});
