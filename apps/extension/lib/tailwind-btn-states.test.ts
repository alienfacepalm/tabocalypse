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

  it("defines light-mode toast surfaces aligned with HUD glass panels", () => {
    const css = readFileSync(tailwindCssPath, "utf8");
    for (const needle of [
      '[data-theme="light"] .toast',
      '[data-theme="light"] .toast.toast-error',
      '[data-theme="light"] .toast.toast-warn',
    ]) {
      expect(css, `missing ${needle}`).toContain(needle);
    }
  });

  it("defines :hover and :active for shared corner resize grips", () => {
    const css = readFileSync(tailwindCssPath, "utf8");
    for (const needle of [
      ".corner-resize-grip:hover",
      ".corner-resize-grip:active",
      ".sticky-note .corner-resize-grip:hover",
      ".hud-panel-card-frame .corner-resize-grip:hover",
    ]) {
      expect(css, `missing ${needle}`).toContain(needle);
    }
  });

  it("dims bookmark row actions until the row is hovered or focused", () => {
    const css = readFileSync(tailwindCssPath, "utf8");
    for (const needle of [
      ".link-grid-row-actions",
      "opacity-[0.12]",
      ".link-grid-row:hover .link-grid-row-actions",
      ".link-grid-row:focus-within .link-grid-row-actions",
      ".link-grid-row:not(:hover):not(:focus-within) .link-grid-row-actions .btn.ghost",
    ]) {
      expect(css, `missing ${needle}`).toContain(needle);
    }
  });

  it("defines .hud-scrollbar theme + webkit/fallback pieces", () => {
    const css = readFileSync(tailwindCssPath, "utf8");
    for (const needle of [
      ".hud-scrollbar",
      "scrollbar-color",
      ".hud-scrollbar::-webkit-scrollbar-thumb",
      ".hud-scrollbar::-webkit-scrollbar-thumb:hover",
      "--scrollbar-thumb",
    ]) {
      expect(css, `missing ${needle}`).toContain(needle);
    }
  });
});
