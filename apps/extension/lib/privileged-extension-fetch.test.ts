import { describe, expect, it, vi } from "vitest";

vi.mock("webextension-polyfill", () => ({
  default: { runtime: {} },
}));

import {
  arrayBufferToBase64,
  isPrivilegedExtensionFetchUrlAllowed,
} from "./privileged-extension-fetch";

describe("isPrivilegedExtensionFetchUrlAllowed", () => {
  it("allows Peapix and Open-Meteo HTTPS URLs", () => {
    expect(isPrivilegedExtensionFetchUrlAllowed("https://peapix.com/bing/feed?country=us")).toBe(
      true,
    );
    expect(isPrivilegedExtensionFetchUrlAllowed("https://img.peapix.com/x.jpg")).toBe(true);
    expect(
      isPrivilegedExtensionFetchUrlAllowed(
        "https://api.open-meteo.com/v1/forecast?latitude=1&longitude=2",
      ),
    ).toBe(true);
  });

  it("rejects other hosts and non-HTTPS schemes", () => {
    expect(
      isPrivilegedExtensionFetchUrlAllowed("https://www.bing.com/HPImageArchive.aspx?format=js"),
    ).toBe(false);
    expect(isPrivilegedExtensionFetchUrlAllowed("http://peapix.com/x")).toBe(false);
    expect(isPrivilegedExtensionFetchUrlAllowed("not a url")).toBe(false);
  });
});

describe("arrayBufferToBase64", () => {
  it("encodes bytes for transport over runtime messages", () => {
    const buf = new Uint8Array([1, 2, 3, 255]).buffer;
    const b64 = arrayBufferToBase64(buf);
    expect(atob(b64)).toBe(String.fromCharCode(1, 2, 3, 255));
  });
});
