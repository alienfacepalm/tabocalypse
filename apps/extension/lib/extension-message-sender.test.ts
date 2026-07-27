import { afterEach, describe, expect, it, vi } from "vitest";

const { runtime } = vi.hoisted(() => ({
  runtime: { id: "ext-self" },
}));

vi.mock("webextension-polyfill", () => ({
  default: { runtime },
}));

import { isTrustedExtensionSender } from "./extension-message-sender";

describe("isTrustedExtensionSender", () => {
  afterEach(() => {
    runtime.id = "ext-self";
  });

  it("accepts the same extension id", () => {
    expect(isTrustedExtensionSender({ id: "ext-self" })).toBe(true);
  });

  it("rejects missing sender, missing ids, and other extensions", () => {
    expect(isTrustedExtensionSender(undefined)).toBe(false);
    expect(isTrustedExtensionSender({})).toBe(false);
    expect(isTrustedExtensionSender({ id: "other-ext" })).toBe(false);
    runtime.id = "";
    expect(isTrustedExtensionSender({ id: "ext-self" })).toBe(false);
  });
});
