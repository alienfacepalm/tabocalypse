import { describe, expect, it } from "vitest";
import { parseConfiguredSupportLinks } from "./parse-configured-support-links";

describe("parseConfiguredSupportLinks", () => {
  it("returns null for non-array JSON", () => {
    expect(parseConfiguredSupportLinks("{}")).toBeNull();
    expect(parseConfiguredSupportLinks('"x"')).toBeNull();
  });

  it("returns null for invalid JSON", () => {
    expect(parseConfiguredSupportLinks("[{")).toBeNull();
  });

  it("returns empty array for empty array", () => {
    expect(parseConfiguredSupportLinks("[]")).toEqual([]);
  });

  it("maps valid rows and skips invalid", () => {
    const raw = JSON.stringify([
      { label: "  Send feedback  ", url: "https://example.com/form" },
      { label: "Tip jar", url: "https://ko-fi.com/x", kind: "donate" },
      { label: "bad url", url: "ftp://no" },
      { label: "", url: "https://x.com" },
    ]);
    expect(parseConfiguredSupportLinks(raw)).toEqual([
      { label: "Send feedback", url: "https://example.com/form", kind: "link" },
      { label: "Tip jar", url: "https://ko-fi.com/x", kind: "donate" },
    ]);
  });

  it("defaults unknown kind to link", () => {
    const raw = JSON.stringify([{ label: "X", url: "https://a.test", kind: 99 }]);
    expect(parseConfiguredSupportLinks(raw)).toEqual([
      { label: "X", url: "https://a.test", kind: "link" },
    ]);
  });

  it("accepts all supported kinds", () => {
    const raw = JSON.stringify([
      { label: "F", url: "https://a.test", kind: "feedback" },
      { label: "D", url: "https://b.test", kind: "donate" },
      { label: "S", url: "https://c.test", kind: "source" },
      { label: "L", url: "https://d.test", kind: "link" },
    ]);
    expect(parseConfiguredSupportLinks(raw)).toEqual([
      { label: "F", url: "https://a.test", kind: "feedback" },
      { label: "D", url: "https://b.test", kind: "donate" },
      { label: "S", url: "https://c.test", kind: "source" },
      { label: "L", url: "https://d.test", kind: "link" },
    ]);
  });
});
