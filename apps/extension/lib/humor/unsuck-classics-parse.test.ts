import { describe, expect, it } from "vitest";
import { parseUnsuckClassicsHtml } from "./unsuck-classics-parse";

const MINI_HTML = `
<ul>
<li class="accordion-item">
  <div class="accordion-item__title">Synergy</div>
  <div class="accordion-item__description"><p>Working together for a common goal.</p></div>
</li>
<li class="accordion-item">
  <div class="accordion-item__title">Bandwidth</div>
  <div class="accordion-item__description"><p>Mental capacity for tasks.</p></div>
</li>
${Array.from(
  { length: 9 },
  (_, i) => `
<li class="accordion-item">
  <div class="accordion-item__title">Term${i}</div>
  <div class="accordion-item__description"><p>Definition ${i}.</p></div>
</li>`,
).join("")}
</ul>
`;

describe("parseUnsuckClassicsHtml", () => {
  it("parses accordion entries into filtered lines", () => {
    const lines = parseUnsuckClassicsHtml(MINI_HTML);
    expect(lines.length).toBeGreaterThanOrEqual(10);
    expect(lines[0]).toMatch(/^Synergy — /);
  });

  it("throws when too few entries are parsed", () => {
    expect(() => parseUnsuckClassicsHtml("<html></html>")).toThrow(/Expected many/);
  });
});
