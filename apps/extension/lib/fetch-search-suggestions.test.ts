import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("webextension-polyfill", () => ({
  default: { runtime: {} },
}));

vi.mock("./privileged-extension-fetch", () => ({
  isPrivilegedFetchBackgroundUnavailableError: vi.fn(() => false),
  privilegedExtensionFetchText: vi.fn(),
}));

import { fetchSearchSuggestions } from "./fetch-search-suggestions";
import { privilegedExtensionFetchText } from "./privileged-extension-fetch";

const privilegedExtensionFetchTextMock = vi.mocked(privilegedExtensionFetchText);

describe("fetchSearchSuggestions", () => {
  afterEach(() => {
    privilegedExtensionFetchTextMock.mockReset();
  });

  it("parses suggestions from background fetch text", async () => {
    privilegedExtensionFetchTextMock.mockResolvedValue('["hello",["hello kitty","hello fresh"]]');

    const suggestions = await fetchSearchSuggestions("bing", "hello");
    expect(suggestions).toEqual(["hello kitty", "hello fresh"]);
    expect(privilegedExtensionFetchTextMock).toHaveBeenCalledTimes(1);
  });

  it("returns empty when background fetch fails (no in-page fallback)", async () => {
    privilegedExtensionFetchTextMock.mockRejectedValue(new Error("HTTP 403"));

    const suggestions = await fetchSearchSuggestions("bing", "hello");
    expect(suggestions).toEqual([]);
    expect(privilegedExtensionFetchTextMock).toHaveBeenCalledTimes(1);
  });
});
