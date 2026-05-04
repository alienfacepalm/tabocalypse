# Tabocalypse declarative plugin schema (v1)

**Documentation index:** [`README.md`](README.md) (folder `doc/`)

Plugins are **JSON only** — no user JavaScript. Validation lives in **`@tabocalypse/plugin-sdk`** (`packages/plugin-sdk`); the extension imports it and renders allowlisted widget types.

## Root object

| Field                  | Type               | Required                     |
| ---------------------- | ------------------ | ---------------------------- |
| `schemaVersion`        | `1`                | yes                          |
| `id`                   | string             | yes (alphanumeric, `_`, `-`) |
| `name`                 | string             | yes                          |
| `version`              | string             | yes                          |
| `author`               | string             | no                           |
| `description`          | string             | no                           |
| `permissionsRequested` | `[]` or `["none"]` | no                           |
| `widgets`              | array              | yes                          |

## Widgets

Each widget:

```json
{
  "id": "uniqueWithinPlugin",
  "type": "StaticText | RotatingQuotes | LinkGrid",
  "props": {}
}
```

### `StaticText`

```json
{
  "id": "hello",
  "type": "StaticText",
  "props": { "text": "Hello from my plugin." }
}
```

### `RotatingQuotes`

```json
{
  "id": "quotes",
  "type": "RotatingQuotes",
  "props": { "quotes": ["Line one", "Line two"] }
}
```

### `LinkGrid`

Links must be `http://` or `https://`.

```json
{
  "id": "links",
  "type": "LinkGrid",
  "props": {
    "links": [{ "label": "Docs", "url": "https://example.com" }]
  }
}
```

## Distribution

Share a `.json` file (or document inside a ZIP with `tabocalypse-plugin.json` at root — import currently expects a **single JSON file** in the UI; users can zip packs separately). The in-app importer accepts **`.json`** for plugins.

## Examples

See [`packages/example-plugin/tabocalypse-plugin.json`](../packages/example-plugin/tabocalypse-plugin.json).
