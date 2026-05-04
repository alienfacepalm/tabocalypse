import type { IImportedPlugin, IPluginWidget } from "./types";

export interface IValidationResult {
  ok: boolean;
  errors: string[];
  warnings: string[];
  plugin?: IImportedPlugin;
}

const ALLOWED_TYPES = new Set<IPluginWidget["type"]>(["StaticText", "RotatingQuotes", "LinkGrid"]);

export interface IRawPluginJson {
  schemaVersion?: number;
  id?: string;
  name?: string;
  version?: string;
  author?: string;
  description?: string;
  widgets?: unknown[];
  permissionsRequested?: string[];
}

function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null && !Array.isArray(x);
}

function validateWidget(w: unknown): IPluginWidget | null {
  if (!isRecord(w)) {
    return null;
  }
  const id = w.id;
  const type = w.type;
  const props = w.props;
  if (typeof id !== "string" || !id.trim()) return null;
  if (typeof type !== "string" || !ALLOWED_TYPES.has(type as IPluginWidget["type"])) return null;
  if (!isRecord(props)) return null;

  if (type === "StaticText") {
    if (typeof props.text !== "string") return null;
    return { id: id.slice(0, 64), type: "StaticText", props: { text: props.text.slice(0, 2000) } };
  }
  if (type === "RotatingQuotes") {
    if (!Array.isArray(props.quotes)) return null;
    const quotes = props.quotes
      .filter((q): q is string => typeof q === "string")
      .map((q) => q.slice(0, 500))
      .slice(0, 100);
    if (quotes.length === 0) return null;
    return { id: id.slice(0, 64), type: "RotatingQuotes", props: { quotes } };
  }
  if (type === "LinkGrid") {
    if (!Array.isArray(props.links)) return null;
    const links: { label: string; url: string }[] = [];
    for (const item of props.links.slice(0, 30)) {
      if (!isRecord(item)) continue;
      if (typeof item.label !== "string" || typeof item.url !== "string") continue;
      if (!/^https?:\/\//i.test(item.url)) continue;
      links.push({ label: item.label.slice(0, 120), url: item.url.slice(0, 2000) });
    }
    if (links.length === 0) return null;
    return { id: id.slice(0, 64), type: "LinkGrid", props: { links } };
  }
  return null;
}

export function validatePluginJsonText(text: string): IValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  let raw: IRawPluginJson;
  try {
    raw = JSON.parse(text) as IRawPluginJson;
  } catch {
    return { ok: false, errors: ["Invalid JSON"], warnings };
  }
  if (raw.schemaVersion !== 1) errors.push("schemaVersion must be 1");
  if (!raw.id || typeof raw.id !== "string") errors.push("Missing id");
  if (!raw.name || typeof raw.name !== "string") errors.push("Missing name");
  if (!raw.version || typeof raw.version !== "string") errors.push("Missing version");
  if (!Array.isArray(raw.widgets)) errors.push("widgets must be an array");

  const perms = raw.permissionsRequested;
  if (perms !== undefined) {
    if (!Array.isArray(perms)) errors.push("permissionsRequested must be an array");
    else if (perms.length > 0 && !(perms.length === 1 && perms[0] === "none")) {
      errors.push('permissionsRequested must be [] or ["none"] in v1');
    }
  }

  const widgets: IPluginWidget[] = [];
  if (Array.isArray(raw.widgets)) {
    raw.widgets.forEach((w, i) => {
      const parsed = validateWidget(w);
      if (!parsed) errors.push(`widgets[${i}] invalid or unknown type`);
      else widgets.push(parsed);
    });
  }

  if (errors.length) return { ok: false, errors, warnings };

  const plugin: IImportedPlugin = {
    id: String(raw.id)
      .replace(/[^a-zA-Z0-9_-]/g, "_")
      .slice(0, 64),
    name: String(raw.name).slice(0, 120),
    version: String(raw.version).slice(0, 32),
    author: typeof raw.author === "string" ? raw.author.slice(0, 120) : undefined,
    enabled: true,
    schemaVersion: 1,
    widgets,
    importedAt: Date.now(),
  };

  if (widgets.length === 0) warnings.push("Plugin has zero widgets");
  return { ok: true, errors, warnings, plugin };
}
