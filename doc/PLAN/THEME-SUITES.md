# Theme suites and brand kits

**Status:** plan drafted 2026-09-11. Nothing here is built yet. Board items `PM-T080`–`PM-T087` (listed at the end) are on [ROADMAP-PM-BOARD.md](./ROADMAP-PM-BOARD.md) and synced with `pnpm pm:sync`.

**Purpose:** turn the theme system into a product. Today a "theme" is a palette swap. A **theme suite** should change the entire face of the new tab: colors, type, shapes, panel chrome, background, motion, personality copy, and default layout. Suites are sold as **signed JSON**, one-off, with no release schedule. The same engine powers **brand kits**: companies design a branded, locked-down dashboard for employee computers and deploy it through browser policy.

**Rules this plan obeys** (from [`.cursor/rules/project-conventions.mdc`](../../.cursor/rules/project-conventions.mdc) and [MONETIZATION.md](./MONETIZATION.md)): no publisher backend, no telemetry, declarative JSON only, no ads anywhere (first- or third-party), no scheduled obligations, purchases are link-out with offline verification.

---

## What a theme controls today vs. what a suite must control

| Surface          | Today                                                              | Suite v1 must add                                                                                                     |
| ---------------- | ------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------- |
| Mode             | Dark / Light                                                       | Per-theme fixed mode or "follows system"                                                                              |
| Colors           | 10 preset palettes + custom accent pair → 33 CSS variables         | Full token map: every `--color-*` variable, weather and temperature scale overrides, scrollbar, hard-shadow color     |
| Typography       | Fixed: Space Mono (loud), JetBrains Mono (body), Audiowide (title) | Font **roles** (title, loud, body, mono) chosen from a bundled open-license menu, or embedded WOFF2 within a size cap |
| Shape            | Sharp / Soft / Pill radius tokens                                  | Radius per role plus **shadow style** (hard offset, soft, none) and border weight                                     |
| Panel chrome     | Fixed glass (blur 12px, dark surface at 60%)                       | Blur, surface opacity, border style, corner accent, top-rule accent, scanline overlay on/off                          |
| Motion           | Glitch / pulse animations always on (Chaos preset adds more)       | Motion profile: `off`, `calm`, `glitch`; always yields to `prefers-reduced-motion`                                    |
| Background       | Solid, gradient (angle/center/shape), single image, Bing rotation  | Named wallpaper **sets** shipped in the pack (data URLs, capped) or user-approved HTTPS, rotation interval            |
| Personality copy | Chaotic / Balanced / Focus presets, `SYSTEM_STABLE: FALSE` status  | Status-line text or off, humor intensity default, search placeholder leads, judgmental tooltip voice                  |
| Layout           | Per-monitor manual layout, auto-repack                             | **Layout template**: which widgets are on and their column order, applied on first use of the theme                   |
| Identity         | "Tabocalypse" title, AlienFacepalm footer links                    | **Brand block** (gated): title text or logo, footer links, hidden support links, locked settings keys                 |

Everything in the right column is a value in a JSON file. No theme can add code.

---

## Theme pack format (v1)

A theme pack is a signed-pack envelope (Phase 3 of the monetization plan) whose payload has `kind: "theme"`. Unsigned theme packs import too; they just show no signer.

```json
{
  "format": "tabocalypse-signed-pack/1",
  "kid": "creator-key-id",
  "payload": {
    "kind": "theme",
    "schemaVersion": 1,
    "id": "synthwave-84",
    "name": "Synthwave '84",
    "version": "1.0.0",
    "author": "AlienFacepalm",
    "license": "CC-BY-NC-4.0",
    "suite": "neon-nights",
    "mode": "dark",
    "colors": { "accent": "#ff2a6d", "accent2": "#05d9e8", "bg": "#0b0221", "surface": "#1a0b3d" },
    "type": {
      "title": "orbitron",
      "loud": "space-mono",
      "body": "inter",
      "mono": "jetbrains-mono"
    },
    "shape": { "control": "2px", "panel": "6px", "shadow": "soft", "border": "1px" },
    "chrome": {
      "blur": 16,
      "surfaceOpacity": 0.55,
      "scanlines": false,
      "cornerAccent": "top-rule"
    },
    "motion": "calm",
    "background": {
      "kind": "set",
      "rotateMinutes": 30,
      "images": [{ "name": "grid-horizon", "dataUrl": "data:image/webp;base64,..." }]
    },
    "personality": {
      "preset": "balanced",
      "statusLine": "GRID_ONLINE: 1984",
      "humorIntensity": "mild"
    },
    "layout": { "widgets": ["clock", "weather", "search", "links", "crypto"], "columns": 3 },
    "brand": null
  },
  "sig": "..."
}
```

Field rules (enforced in `@tabocalypse/plugin-sdk`, the same package that validates plugins):

- `colors.*` are hex only, coerced through the existing `coerceThemeHex`; unknown keys are dropped. Contrast is checked at import and the existing light/dark readability guards still apply.
- `type.*` must name a font from the **bundled menu** (shipped with the extension under `@fontsource`) or an `embedded` entry: `{ "family": "Acme Sans", "woff2": "data:font/woff2;base64,..." }`. Embedded fonts count toward the pack size cap. **No remote font URLs** (would be a network call the user did not direct).
- `background.images[]` are data URLs (WebP or JPEG) or HTTPS URLs. HTTPS wallpapers request a host permission at import through the same flow as BYO AI. Intranet wallpapers for brand kits work this way.
- `layout.widgets` may only name known widget keys; unknown keys are ignored so old builds can import newer themes.
- `brand` is `null` unless the pack is a brand kit (below).
- **Size caps:** whole pack ≤ 2 MB; the slice mirrored to `storage.sync` is only `{ themeId, version, colors, type (names only), shape, chrome, motion, personality }` and must stay under the 6 KB safety margin the settings code already uses. Heavy assets (wallpapers, embedded fonts, logos) live in `storage.local` on each device. Sync carries the pointer; a device without the pack shows a "theme assets not on this device, re-import" note instead of a broken page.
- **No ads.** No promotional text in `personality`, no third-party links in `brand.footerLinks` that are not the buyer's own, no tracking parameters. This is policy, enforced best-effort: the importer checks URLs in a theme pack for `?utm_` and known affiliate patterns, but a creator-owned redirect can evade any pattern check, so the rule itself is what creators agree to (see [`PLUGIN-SCHEMA.md`](../PLUGIN-SCHEMA.md)).

---

## Suites to build (first-party)

Each suite is three to five themes that share a mood but differ in palette and background so buyers get real variety. Names below avoid trademarks. Release each when it is ready; never announce a date.

| Suite              | Themes                                                         | What changes the face                                                        | Free or paid          |
| ------------------ | -------------------------------------------------------------- | ---------------------------------------------------------------------------- | --------------------- |
| **Glitch-Core**    | Acid Terminal (today's default), Magenta Fault, Amber Phosphor | Hard shadows, scanlines, glitch motion, terminal prompts                     | Free (ships with app) |
| **Neon Nights**    | Synthwave '84, Rain City, Vapor Mall, Arcade Cabinet           | Sunset gradients, chrome type, soft glow shadows, slow pulse motion          | Paid                  |
| **Quiet Work**     | Paper & Ink (light), Nordic Frost, Graphite, Cozy Cabin        | Humanist sans, no shadows, opaque panels, motion off, status line off, Focus | Paid                  |
| **Retro Machines** | Cassette Futurism, Blueprint, Teletext, Green Phosphor CRT     | Beige/cream surfaces, blueprint grid background, chunky borders, mono type   | Paid                  |
| **Markets & Ops**  | Trading Floor, Mission Control, Server Room, Air Traffic       | Dense grids, orange-on-black or cyan-on-navy, tabular numerals, calm motion  | Paid                  |
| **Living World**   | Solarpunk, Deep Sea, Desert Dusk, Alpine Morning               | Organic palettes, photographic wallpaper sets, rounded shapes, gentle motion | Paid                  |
| **Starter (demo)** | Two themes taken from different paid suites                    | Proves the engine to free users; gives creators a template to copy           | Free                  |

Design work per theme: palette (with contrast check), type pairing, one to three wallpapers (original or CC0), status-line copy, layout template. Reuse `DESIGN.md`'s structure as the template for each theme's design notes, one file per suite under `design/`.

---

## Dashboard designer with custom branding

A **static, buildless** page at `site/design/index.html` (same approach as the homepage: no framework, no backend, deployable to GitHub Pages). It is the tool for both hobbyist theme authors and companies.

- **Live preview** of a mock HUD (reuse the draggable demo panels from the homepage) that re-renders as tokens change.
- **Controls** for every field in the pack format: color pickers with contrast readout, font menu, shape and shadow presets, chrome sliders, motion profile, background upload (resized and converted to WebP in the browser, size shown against the cap), personality copy, layout template picker.
- **Brand panel** (see below): company name or logo upload, footer links, which settings to lock, which widgets to hide.
- **Export** writes the pack JSON. **Sign** runs entirely in the page with WebCrypto: the author generates a P-256 key pair once, keeps the private key in their own browser (exportable as a file), and signs the pack. Nothing is uploaded anywhere.
- **Import** into the extension is the existing pack importer, extended to `kind: "theme"`.

No account, no save-to-cloud, no gallery on our side. If a creator wants to sell, they put the signed file on their own merchant page.

---

## Brand kits for companies

A brand kit is a theme pack whose `brand` block is populated. The brand block is the **one gated feature**: it renders only when a `brand` entitlement token (Phase 2 license format, `tier: "brand"`) is present. Everything else in a theme is free to use so the platform spreads.

```json
"brand": {
  "title": "Northwind Intranet",
  "logo": { "dataUrl": "data:image/svg+xml;base64,...", "height": 28 },
  "hideTabocalypseTitle": true,
  "footerLinks": [{ "label": "IT help", "url": "https://help.northwind.example" }],
  "hideSupportLinks": true,
  "pinnedLinks": [{ "label": "HR portal", "url": "https://hr.northwind.example" }],
  "hiddenWidgets": ["crypto", "steam", "humor"],
  "lockedKeys": ["themeId", "backgroundKind", "humorIntensity", "widgetsEnabled"],
  "personalityLock": "focus"
}
```

**What a company gets:** every new tab on every employee browser shows the company's colors, logo, intranet links, and a chosen widget set; humor and consumer widgets off; employees can still move panels and add notes unless those keys are locked.

**Deployment on employee computers** (documented in a new `doc/ENTERPRISE-DEPLOYMENT.md`):

1. Install the normal store build (or force-install it with the browser's extension policy).
2. Push the brand kit JSON and the brand token through **managed storage**: Chrome and Edge use the `3rdparty` extension policy (Group Policy, Intune, or Jamf), Firefox uses `policies.json` → `3rdparty.Extensions`. The extension reads `storage.managed` at the end of `loadSettings` and applies the kit with `lockedKeys` enforced. Safari has no managed storage; Safari users import the file by hand.
3. Small teams without device management import the same file per user.

**Why this stays obligation-free:** the license is a **one-time** purchase per organization with unlimited devices, no renewal, no seats to count, no SLA, no onboarding calls. Docs are the support. The extension is AGPL, so a company that would rather fork can; the brand kit is the cheaper path.

**Why companies would pay:** the alternative is a home-grown intranet start page or a per-seat SaaS new-tab product. A one-time kit that runs offline, sends nothing anywhere, and is configured by policy is an easy procurement conversation.

---

## Pricing (one-off only)

| SKU                    | Price                     | Notes                                                                                                           |
| ---------------------- | ------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Single theme           | $3                        | Signed JSON from the merchant                                                                                   |
| Theme suite (3–5)      | $7–9                      | One download, all themes in the suite                                                                           |
| Pro (lifetime)         | $19 (see MONETIZATION.md) | Whether Pro includes first-party suites is an open question (see below); no future suite is promised either way |
| Brand Kit license      | $149 one-time per org     | Unlocks the `brand` block on unlimited devices; includes the deployment doc                                     |
| Brand Kit + all suites | $199 one-time             | Convenience bundle                                                                                              |

Third-party creators set their own prices on their own pages. Tabocalypse takes nothing and reviews nothing.

---

## Delivery phases (no dates)

| Item                                                                                                                                                                               | Board ID | Effort     | Depends on                 |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | ---------- | -------------------------- |
| Theme engine: `kind: "theme"` in the SDK validator, token → CSS variable mapping, local asset store, sync pointer, Settings › Appearance › Themes library (import, switch, remove) | PM-T080  | M          | none                       |
| Typography roles: bundled font menu under `@fontsource`, embedded WOFF2 with cap, font tokens in `tailwind.css`                                                                    | PM-T081  | M          | PM-T080                    |
| Chrome, shape, and motion tokens: blur, opacity, borders, shadow style, scanlines, motion profile; reduced-motion always wins                                                      | PM-T082  | S–M        | PM-T080                    |
| Background sets and layout templates in a theme; personality copy tokens                                                                                                           | PM-T083  | M          | PM-T080                    |
| Designer page at `site/design/` with live preview, export, in-browser signing                                                                                                      | PM-T084  | M–L        | PM-T080–PM-T083 for parity |
| Brand block + `brand` entitlement + `storage.managed` loader + `doc/ENTERPRISE-DEPLOYMENT.md` (reframes former PM-T078 as a one-time kit)                                          | PM-T085  | M          | PM-T080, PM-T074           |
| First-party suites: design and produce Neon Nights, Quiet Work, Retro Machines, Markets & Ops, Living World; ship Starter free                                                     | PM-T086  | L (design) | PM-T080–PM-T083            |
| Creator docs: `doc/THEME-AUTHORING.md`, `sign-pack` in the SDK CLI, no-ads policy text, example signed theme                                                                       | PM-T087  | S          | PM-T075                    |

Cold-load budget note: a theme must not add to the JavaScript bundle. Assets are data in storage; CSS variables are applied before first paint by `applyDocumentTheme` in `main.tsx`, which already runs before React mounts.

---

## Open questions

- **Font menu contents.** Which open-license families ship in the binary? Each adds roughly 15–40 KB per weight. A first cut: Inter, Space Grotesk, IBM Plex Sans, IBM Plex Mono, Orbitron, Lora, plus the three already bundled.
- **Wallpaper licensing.** First-party sets must be original renders or CC0 photography so packs can be resold without attribution chains.
- **Light-mode suites and the temperature scale.** The 2lakes color scale is tuned for dark UI. Quiet Work needs a light-mode variant of that scale; decide whether themes can override it or only pick from two built-in scales.
- **Safari and brand kits.** No managed storage on Safari. Document the manual-import path and do not promise policy deployment there.
- **Whether Pro should include suites at all.** Including them raises Pro's value but blurs the two SKUs. Decide before Pro launches; do not change after.
