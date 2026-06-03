import { describe, expect, it } from "vitest";
import { buildWeatherStaticMapUrl } from "./weather-static-map-url";

describe("buildWeatherStaticMapUrl", () => {
  it("builds a Yandex static map URL with pin and English labels", () => {
    const url = buildWeatherStaticMapUrl(47.6062, -122.3321, 11);
    expect(url).toMatch(/^https:\/\/static-maps\.yandex\.ru\/1\.x\/\?/);
    expect(url).toContain("ll=-122.3321,47.6062");
    expect(url).toContain("z=11");
    expect(url).toContain("pt=-122.3321,47.6062,pm2rdm");
    expect(url).toContain("lang=en_US");
  });

  it("clamps zoom to a sane range", () => {
    expect(buildWeatherStaticMapUrl(0, 0, 0)).toContain("z=1");
    expect(buildWeatherStaticMapUrl(0, 0, 99)).toContain("z=17");
  });
});
