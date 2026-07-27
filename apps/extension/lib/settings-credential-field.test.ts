import { describe, expect, it } from "vitest";
import {
  normalizeCredentialPaste,
  SETTINGS_CREDENTIAL_INPUT_ATTRS,
  SETTINGS_SECRET_MASK_STYLE,
} from "./settings-credential-field";

describe("settings-credential-field helpers", () => {
  it("uses text inputs (not password) with autofill suppressors", () => {
    expect(SETTINGS_CREDENTIAL_INPUT_ATTRS.type).toBe("text");
    expect(SETTINGS_CREDENTIAL_INPUT_ATTRS.autoComplete).toBe("off");
    expect(SETTINGS_CREDENTIAL_INPUT_ATTRS["data-1p-ignore"]).toBe("true");
    expect(SETTINGS_CREDENTIAL_INPUT_ATTRS["data-lpignore"]).toBe("true");
    expect(SETTINGS_CREDENTIAL_INPUT_ATTRS["data-bwignore"]).toBe("true");
    expect(SETTINGS_CREDENTIAL_INPUT_ATTRS["data-form-type"]).toBe("other");
  });

  it("masks secrets with WebkitTextSecurity instead of type=password", () => {
    expect(SETTINGS_SECRET_MASK_STYLE.WebkitTextSecurity).toBe("disc");
  });

  it("trims pasted credentials and strips a leading BOM", () => {
    expect(normalizeCredentialPaste("secret", "\uFEFF  sk-abc  \n")).toBe("sk-abc");
    expect(normalizeCredentialPaste("identifier", "\uFEFF 76561198025217855 ")).toBe(
      "76561198025217855",
    );
  });
});
