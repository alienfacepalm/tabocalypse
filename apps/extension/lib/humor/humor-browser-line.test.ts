import { describe, expect, it } from "vitest";
import {
  HUMOR_BROWSER_PLACEHOLDER,
  humorBrowserLabel,
  localizeHumorLine,
} from "./humor-browser-line";

describe("humorBrowserLabel", () => {
  it("maps known host browsers to display names", () => {
    expect(humorBrowserLabel("chrome")).toBe("Chrome");
    expect(humorBrowserLabel("edge")).toBe("Edge");
    expect(humorBrowserLabel("firefox")).toBe("Firefox");
    expect(humorBrowserLabel("safari")).toBe("Safari");
  });

  it("falls back to generic copy when unsure", () => {
    expect(humorBrowserLabel("unknown")).toBe("browser");
  });
});

describe("localizeHumorLine", () => {
  const template = `Touch grass? You\u2019re choosing ${HUMOR_BROWSER_PLACEHOLDER} tabs. Vibe check: failed.`;

  it("substitutes the detected browser when known", () => {
    expect(localizeHumorLine(template, "firefox")).toBe(
      "Touch grass? You\u2019re choosing Firefox tabs. Vibe check: failed.",
    );
  });

  it("uses generic browser wording when detection is unknown", () => {
    expect(localizeHumorLine(template, "unknown")).toBe(
      "Touch grass? You\u2019re choosing browser tabs. Vibe check: failed.",
    );
  });

  it("leaves lines without the placeholder unchanged", () => {
    const plain = "Another tab? Bold. Another window? Bolder.";
    expect(localizeHumorLine(plain, "chrome")).toBe(plain);
  });
});
