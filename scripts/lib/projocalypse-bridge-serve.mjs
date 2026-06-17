/**
 * Resolve a request path under Tabocalypse .projocalypse/ for static JSON serving.
 */
import path from "node:path";

/**
 * @param {string} tabocalypseRoot
 * @param {string} urlPath e.g. /.projocalypse/pending/tabocalypse-roadmap.json
 * @returns {{ ok: true, file: string } | { ok: false, status: number }}
 */
export function resolveProjocalypseBridgeFile(tabocalypseRoot, urlPath) {
  const normalizedUrl = urlPath.split("?")[0] ?? "";
  if (!normalizedUrl.startsWith("/.projocalypse/")) {
    return { ok: false, status: 404 };
  }
  const rel = normalizedUrl.replace(/^\//, "");
  const bridgeRoot = path.normalize(path.join(tabocalypseRoot, ".projocalypse"));
  const file = path.normalize(path.join(tabocalypseRoot, rel));
  if (!file.startsWith(bridgeRoot)) {
    return { ok: false, status: 403 };
  }
  return { ok: true, file };
}
