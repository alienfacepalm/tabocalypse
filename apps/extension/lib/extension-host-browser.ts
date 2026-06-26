export type TExtensionHostBrowser = "chrome" | "edge" | "firefox" | "safari" | "unknown";

/** Detect the host browser from the extension page environment. */
export function detectExtensionHostBrowser(): TExtensionHostBrowser {
  try {
    const protocol = globalThis.location?.protocol ?? "";
    if (protocol === "moz-extension:") return "firefox";
    if (protocol === "safari-web-extension:") return "safari";
    if (protocol === "chrome-extension:") {
      const ua = navigator.userAgent;
      if (ua.includes("Edg/")) return "edge";
      return "chrome";
    }
  } catch {
    // fall through
  }
  return "unknown";
}
