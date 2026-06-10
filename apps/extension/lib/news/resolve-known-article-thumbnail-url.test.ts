import { describe, expect, it } from "vitest";
import { resolveKnownArticleThumbnailUrl } from "./resolve-known-article-thumbnail-url";

describe("resolveKnownArticleThumbnailUrl", () => {
  it("builds a YouTube thumbnail URL", () => {
    expect(resolveKnownArticleThumbnailUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe(
      "https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg",
    );
  });

  it("builds a GitHub social preview URL", () => {
    expect(resolveKnownArticleThumbnailUrl("https://github.com/IvanSobolev/Neo3dEngine")).toBe(
      "https://opengraph.githubassets.com/1/IvanSobolev/Neo3dEngine",
    );
  });

  it("returns null for unrecognized URLs", () => {
    expect(resolveKnownArticleThumbnailUrl("https://www.nytimes.com/article")).toBeNull();
  });
});
