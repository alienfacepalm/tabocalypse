import { describe, expect, it } from "vitest";
import {
  coerceSearchEngine,
  DEFAULT_SEARCH_ENGINE,
  SEARCH_ASSIST_DESTINATION_LABELS,
  SEARCH_ENGINE_LABELS,
  SEARCH_ENGINE_ORDER,
} from "./search-engine-options";

describe("search engine options", () => {
  it("defaults to DuckDuckGo", () => {
    expect(DEFAULT_SEARCH_ENGINE).toBe("ddg");
    expect(SEARCH_ENGINE_ORDER[0]).toBe("ddg");
  });

  it("coerces invalid stored values to the fallback", () => {
    expect(coerceSearchEngine("google")).toBe("google");
    expect(coerceSearchEngine("yahoo")).toBe("ddg");
    expect(coerceSearchEngine(undefined)).toBe("ddg");
    expect(coerceSearchEngine(null, "bing")).toBe("bing");
  });

  it("covers every engine with labels and assist names", () => {
    for (const engine of SEARCH_ENGINE_ORDER) {
      expect(SEARCH_ENGINE_LABELS[engine]?.trim().length).toBeGreaterThan(0);
      expect(SEARCH_ASSIST_DESTINATION_LABELS[engine]?.trim().length).toBeGreaterThan(0);
    }
    expect(SEARCH_ENGINE_ORDER).toHaveLength(3);
  });
});
