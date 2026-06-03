import { describe, expect, it } from "vitest";
import {
  SEARCH_ASSIST_DESTINATION_LABELS,
  SEARCH_ENGINE_LABELS,
  SEARCH_ENGINE_ORDER,
} from "./search-engine-options";

describe("search engine options", () => {
  it("covers every engine with labels and assist names", () => {
    for (const engine of SEARCH_ENGINE_ORDER) {
      expect(SEARCH_ENGINE_LABELS[engine]?.trim().length).toBeGreaterThan(0);
      expect(SEARCH_ASSIST_DESTINATION_LABELS[engine]?.trim().length).toBeGreaterThan(0);
    }
    expect(SEARCH_ENGINE_ORDER).toHaveLength(3);
  });
});
