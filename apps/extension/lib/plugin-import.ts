import type { IImportedPlugin } from "@tabocalypse/plugin-sdk";
import { validatePluginJsonText } from "@tabocalypse/plugin-sdk";

/**
 * Re-validate imported plugin records (settings import / storage load).
 * Drops malformed widgets that would crash PluginDeck.
 */
export function coerceImportedPlugins(raw: unknown): IImportedPlugin[] {
  if (!Array.isArray(raw)) return [];
  const out: IImportedPlugin[] = [];
  for (const item of raw) {
    if (item == null || typeof item !== "object" || Array.isArray(item)) continue;
    const row = item as Record<string, unknown>;
    const text = JSON.stringify({
      schemaVersion: 1,
      id: typeof row.id === "string" ? row.id : "",
      name: typeof row.name === "string" ? row.name : "",
      version: typeof row.version === "string" ? row.version : "",
      author: typeof row.author === "string" ? row.author : undefined,
      widgets: Array.isArray(row.widgets) ? row.widgets : [],
      permissionsRequested: ["none"],
    });
    const result = validatePluginJsonText(text, { dropInvalidWidgets: true });
    if (!result.ok || !result.plugin) continue;
    const plugin = result.plugin;
    plugin.enabled = typeof row.enabled === "boolean" ? row.enabled : true;
    if (typeof row.importedAt === "number" && Number.isFinite(row.importedAt)) {
      plugin.importedAt = Math.max(0, Math.floor(row.importedAt));
    }
    out.push(plugin);
  }
  return out;
}

/**
 * Merge a newly validated plugin into the existing list: replaces any
 * previous entry with the same id, otherwise appends.
 */
export function mergeImportedPlugin(
  existing: IImportedPlugin[],
  incoming: IImportedPlugin,
): IImportedPlugin[] {
  return existing.filter((p) => p.id !== incoming.id).concat(incoming);
}

/** Remove a plugin by id. */
export function removeImportedPlugin(
  existing: IImportedPlugin[],
  pluginId: string,
): IImportedPlugin[] {
  return existing.filter((p) => p.id !== pluginId);
}
