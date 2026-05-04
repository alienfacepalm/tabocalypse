export interface PluginWidget {
  id: string;
  type: "StaticText" | "RotatingQuotes" | "LinkGrid";
  props: Record<string, unknown>;
}

/** Normalized plugin ready for storage in the extension. */
export interface ImportedPlugin {
  id: string;
  name: string;
  version: string;
  author?: string;
  enabled: boolean;
  schemaVersion: number;
  widgets: PluginWidget[];
  importedAt: number;
}
