import type { IImportedPlugin } from "@tabocalypse/plugin-sdk";

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
