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

## Content policy (applies to every plugin, pack, and theme)

- **No advertising.** Plugins must not carry ads of any kind: no affiliate links, sponsored links or images, partner placements, promotional `RotatingQuotes`, or tracking parameters on `LinkGrid` URLs. This mirrors the Tabocalypse product invariant in `.cursor/rules/project-conventions.mdc` and applies to first-party and third-party content alike. The importer may add automated checks (for example rejecting known affiliate URL patterns) as the schema grows.
- **You may sell your plugin.** Creators are welcome to sell plugins, packs, and themes as **signed JSON** on their own merchant pages (Gumroad, Lemon Squeezy, Ko-fi shop, and so on). Tabocalypse takes no cut, runs no review queue, and does not sign third-party content; the signed envelope carries your own public key and the extension shows the signer to the user. See [`PLAN/MONETIZATION.md`](PLAN/MONETIZATION.md) for the envelope format and the honesty clause (signed JSON is provenance, not DRM).
- **Declarative only, always.** Selling a plugin does not change the rules: JSON only, allowlisted widget types, HTTPS links, no user JavaScript.

## Distribution

Share a `.json` file (or document inside a ZIP with `tabocalypse-plugin.json` at root — import currently expects a **single JSON file** in the UI; users can zip packs separately). The in-app importer accepts **`.json`** for plugins.

## Examples

See [`packages/example-plugin/tabocalypse-plugin.json`](../packages/example-plugin/tabocalypse-plugin.json).
