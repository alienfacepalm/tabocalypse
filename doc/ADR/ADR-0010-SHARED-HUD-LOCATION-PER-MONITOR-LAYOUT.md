# ADR-0010: One shared HUD location for geo panels; layout and map camera are per monitor and local

| Status | ✅ Accepted                               |
| ------ | ----------------------------------------- |
| Date   | 2026-06-15                                |
| Scope  | Weather, Clock, Balanced news, HUD layout |

## Context

Weather, Clock (timezone), and Balanced news (device region) all need coordinates. Early builds stored them per widget, which meant three "use my location" prompts and panels that disagreed about where the user was. Separately, people run the new tab on several monitors of different sizes, and a layout tuned for an ultrawide looks wrong on a laptop.

## Decision

- **One saved latitude/longitude** (historically named `weatherLat` / `weatherLon` on `ISettings`, with `weatherGeoAdjusted` / `weatherAutoGeo`) is the HUD-wide location. Panels read it through `resolveHudGeoLocation`; geolocation side effects live in the app shell, never in a panel. The editor lives under **Settings › Weather** and its copy says it applies to every geo panel.
- Clock derives its timezone from those coordinates via Open-Meteo, the same provider Weather uses.
- **Per-monitor state is local.** A display fingerprint (`getHudDisplayLayoutKey`) keys panel positions, sizes, widget on/off overrides, and the Weather map's pan/zoom in `storage.local`; the synced slice carries only the defaults. Moving the window to another monitor re-measures and re-packs.
- HUD panels always use snap-to-grid auto layout with **Rearrange (F10)**; the former random "chaotic layout" scatter was removed, and the personality presets now only choose between shuffle (Chaotic) and aligned columns (Balanced, Focus).

## Consequences

- One location prompt, consistent answers across panels, and a single privacy disclosure.
- Users must understand that "this monitor" settings differ from synced defaults; the Widgets section explains it and offers a per-monitor reset.
- Any new geo-aware panel must accept `IHudGeoLocation` and must not add its own coordinate fields.

## References

- [`.cursor/rules/hud-shared-geo-location.mdc`](../../.cursor/rules/hud-shared-geo-location.mdc)
- [`apps/extension/lib/hud-geo-location.ts`](../../apps/extension/lib/hud-geo-location.ts), [`hud-layout.ts`](../../apps/extension/lib/hud-layout.ts), [`hud-auto-layout.ts`](../../apps/extension/lib/hud-auto-layout.ts)
- `doc/CHANGELOG.md` 1.0 — "Settings › Widgets — widget toggles apply per monitor", "Weather widget location map — pan and zoom are saved per monitor"
