import { describe, expect, it } from "vitest";
import { parseOgImageFromHtml } from "./parse-og-image-from-html";

describe("parseOgImageFromHtml", () => {
  it("reads og:image content attribute", () => {
    const html =
      '<meta property="og:image" content="https://cdn.example.com/hero.jpg" /><title>x</title>';
    expect(parseOgImageFromHtml(html)).toBe("https://cdn.example.com/hero.jpg");
  });

  it("reads twitter:image when og:image is missing", () => {
    const html = '<meta name="twitter:image" content="https://cdn.example.com/card.png" />';
    expect(parseOgImageFromHtml(html)).toBe("https://cdn.example.com/card.png");
  });
});
