import { describe, expect, it } from "vitest";
import { resolveHudToastPresentation } from "./hud-toast-style";

describe("resolveHudToastPresentation", () => {
  it("keeps semantic variant and bottom-right anchor when not chaotic", () => {
    const p = resolveHudToastPresentation("a", "error", false, 0);
    expect(p.className).toContain("toast-error");
    expect(p.style.bottom).toBeDefined();
    expect(p.style.right).toBe("1rem");
    expect(p.style.top).toBeUndefined();
  });

  it("scrambles variant and uses canvas-relative position when chaotic", () => {
    const p = resolveHudToastPresentation("chaos-seed-42", "error", true, 0);
    expect(p.className).not.toContain("toast-error");
    expect(p.style.top).toMatch(/%$/);
    expect(p.style.left).toMatch(/%$/);
    expect(p.style.bottom).toBe("auto");
  });
});
