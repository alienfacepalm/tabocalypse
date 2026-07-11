# Changelog

All notable user-facing and shipped behavior changes for Tabocalypse are summarized here. This file complements Git history: it is **curated**, not a duplicate of `git log`. Append entries when merging meaningful fixes or features (skip typo-only or purely internal refactors unless they affect shipped artifacts).

Extension versioning follows **`apps/extension/package.json`** (`version` field).

This changelog intentionally tracks **major/minor lines only** (for example `1.2`, `0.3`), not patch versions. Git history and tags cover patch-level detail; this file is meant to stay readable and highlight what a user will notice.

Use **`[Unreleased]`** for changes landed on the default branch that are not yet tied to a published **major/minor** bump; roll entries into a dated, versioned section when you bump the extension to a new **major or minor** version (for example `0.1.x → 0.2.0` or `1.x → 2.0`).

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added

- **Weather** widget location map — lock control (bottom right) freezes pan, zoom, and one-shot location until you unlock.
- **Weather** widget location map — drag to pan and compact +/− zoom on the map; optional scroll-wheel and double-click zoom in **Settings > Weather > Map**.

### Changed

- **Weather** widget — the one-shot “use my location” control sits on the location map above the zoom buttons (instead of in the panel header).
- **Weather** widget location map — pan and zoom are saved per monitor on this computer (same display fingerprint as panel layout); the shared forecast pin still comes from **Settings > Weather**.
- **Weather** widget location map — compact +/− controls sit on the map (no settings toggle); drag-to-pan is always available.

### Fixed

- **New tab HUD** — widget columns expand again to fill horizontal space on wide monitors (auto-layout no longer freezes a smaller window’s panel widths, which left large gutters between columns).
- **HUD panels** — manually dragged panels stay where you drop them instead of snapping back to the first column after release.
- **New tab** — Weather and AI chat panels no longer crash when loading shared settings from the HUD provider.
- **Weather** widget location map — the saved-coordinate pin recenters and refetches when you move the window to another monitor (display fingerprint, remeasured tile size, HUD overlay pin).
- **New tab HUD** — when auto-reposition is on, panels now repack into the multi-column fold layout on open (same as **Rearrange** / F10) instead of sometimes leaving large empty gaps until you click rearrange manually.
- **Crypto** watchlist add-coin search — suggestion results open above the field when the panel sits near the bottom of the screen so matches stay visible above the footer.
- **Balanced news** — headlines older than 72 hours are marked **Stale**, trigger an automatic refresh when allowed, and show a precise published time on hover for verification.
- **Crypto** widget — coin logos (for example ADA and USDC) load again from CoinGecko’s current image CDN in the watchlist and add-coin search results; watchlist entries missing a saved logo are backfilled automatically.
- **Bookmarks** — hidden bookmarks now appear under **Settings > Bookmarks** immediately after you hide them from the panel.

### Changed

- **Clock** alarms on Mac — opening the Alarms section shows macOS notification setup steps (System Settings, Notification Center, Focus, and keeping your browser running); Safari on Mac explains that system alarm notifications are not supported there yet.
- **Bookmarks** panel — the hidden-bookmarks link in the panel now opens **Settings > Bookmarks > Hidden from panel** directly instead of only the Bookmarks section.
- **Settings > Bookmarks** — panel order and hidden bookmarks are grouped in collapsible sub-sections so the page stays easier to scan.
- **Speed test** — hover the **Last run** header to see when that result was recorded (respects your 12h / 24h clock setting).

### Added

- **Search** — optional **Focus Tabocalypse search on new tab** (off by default): on first-run welcome and under **Settings > Search engine**, land in the HUD search field instead of the browser address bar when you open a new tab.
- **Bookmarks** strip — hide bookmarks from the HUD panel without changing your browser bookmarks (unhide under **Settings > Bookmarks**); reorder favorites with the panel arrows or in **Settings > Bookmarks**.
- **Settings > Widgets** — widget toggles apply per monitor; each screen keeps its own panel list layered on synced defaults, with **Reset widgets on this monitor** when you have local overrides.
- **Speed test** widget: **Last run** in the panel header shows your most recent completed down/up result and updates after each successful test (saved on this device).
- **Weather** widget: **Use location once** sits apart from the Celsius/Fahrenheit unit toggles in the panel header so the controls are easier to tell apart.
- **Weather** widget: Open-Meteo forecast and **2 Lakes** buoy readings are saved on this device after a successful load; when a service is down, the last saved data is shown with a clear “saved / not live” notice instead of an empty panel (when no saved data exists, the existing error and retry UI still appears).
- **Settings > Experimental** — opt-in checkboxes for in-development features (all off by default). Weather HUD streak and points are behind **Weather HUD streak & points** until you enable it.
- **Settings > Changelog** — full release history embedded from the project changelog, updated when the extension version bumps.
- **Settings > Feedback & Feature Requests** — in-dialog form to email the maintainer via public SMTP relay (with **Use email app** fallback when SMTP is not configured for the build).
- **Balanced News** HUD panel: topic list from FreeQuickNews with category filters, left/center/right perspective icons, and assignment tooltips on article rows.
- **Balanced News** topic hover previews: article thumbnail, synopsis, and a frosted-glass popover when you hover or focus a topic in the list.
- **Clock** widget: schedule Tabocalypse alarms with labels and background notifications when a reminder fires.
- **Weather** widget: Forecast tab now shows today’s detail grid (precip, wind, feels-like, high/low, UV, sunrise/sunset), Wikipedia “On this day” trivia, and a local daily streak counter; today’s row in **10 Day** uses live conditions so the icon matches outside weather.
- **Weather** widget: tap a 10-day row to expand one day at a time with precip chance, precip amount, wind, feels-like highs/lows, UV index, and sunrise/sunset.
- **Weather** and **2 Lakes** panels: temperature values use the 2lakes.app color scale (cold indigo/blue through hot red); hover a 10-day weekday label for the full date and condition.
- **Weather** 10-day expanded rows: small icons beside precip, wind, feels-like, UV, and sunrise/sunset metrics.
- **2 Lakes** buoy panel: when no active buoy data is returned, a link to 2lakes.app opens in a new tab so you can verify readings on the source site.
- **Crypto** widget: add or remove coins from your watchlist in the panel with CoinGecko name/symbol search (autocomplete like the HUD search bar); coin logos appear beside each symbol; defaults stay BTC and ETH, synced across browsers.
- **Classic jargon** humor voice and a built-in glossary pack (**Unsuck It Classics**), embedded via the maintainer scraper workflow.

### Changed

- **Clock** and **Weather** (and other geo-based HUD panels) share one saved latitude/longitude; the Clock shows time and timezone for those coordinates instead of the browser’s default timezone alone.
- **Settings > Weather** — coordinate controls apply to all geo-based panels (Clock, Weather, Balanced News device region, …); optional-permissions copy refers to shared HUD location.
- **Settings > Chaos** — personality modes (Chaotic, Balanced, Focus) live in one section instead of a separate Presets panel; copy is shorter so lines do not wrap as much. First-run welcome points to Focus for productivity. **Chaotic** shuffles HUD panels to random positions; **Balanced** and **Focus** repack panels in aligned columns (and snap to the grid when you drag).
- HUD panels always use masonry/grid auto-layout with snap-to-grid drag; removed **Chaotic layout** (random scatter) from Settings and the header toolbar.
- **Header status line** under the Tabocalypse title follows personality preset: **Balanced** shows `SYSTEM_STABLE: FALSE` with a slow pulse on **FALSE**; **Chaos** adds rotating telemetry and aggressive glitch animations; **Focus** hides the line entirely.
- **Header title** shows the Chaos personality icons (Chaotic, Balanced, Focus) beside **Tabocalypse** with the active preset highlighted; click them to open **Settings > Chaos** and change personality.
- **Weather** widget **10 Day** view always stacks days vertically with full weekday names, even when the panel is wide.
- **Weather** widget location map: requests tiles sized to the panel width (height follows) so the pin-centered view fills the available space.
- **Weather** widget: daily streak counter and points in Forecast are hidden until you turn on **Settings > Experimental > Weather HUD streak & points**; On this day trivia stays available either way.
- Settings: removed the standalone **Debug** section (the plugin widget-type overlay was a maintainer-only aid and is no longer exposed in the dialog).
- Settings: optional permissions, weather, alarms, and BYO AI are grouped in accordions; import and data sections are folded similarly; the overlay is treated as a **dialog** (not “modal”) in naming.
- Settings: **Chaos** preset is the default with **Gen-Z** humor voice; preset buttons show a clear active state; first-run settings intro can auto-open.
- Settings: removed the in-page **Feedback and support** block (support remains configurable via environment / link-out patterns documented in the root README); feedback now lives under **Settings > Feedback & Feature Requests** with optional SMTP relay.
- Extension reliability: alarm and link-related text is coerced before React render; alarm reminder storage is normalized for safe display.
- Notes: detached panels avoid a phantom scrollbar and hug content height where intended; sticky note layout is stored **per monitor** while the master notes list still syncs.
- HUD auto-layout: improved placement for denser widget grids on the new tab canvas.
- HUD panels and corner resize grips stay above the fixed footer during drag, grid snap, and column reflow.
- **Todos** widget: denser list rows with a smaller remove control so more tasks fit in the panel.
- Tab guilt panel polls for updated tab counts.

### Fixed

- **Crypto** widget: adding watchlist coins other than BTC or ETH (for example XMR) no longer fails with “Tabocalypse background did not respond” — the background worker now accepts any valid CoinGecko coin from your list.
- **Focus personality** — enforces hard rules: no humor, humor banner, or chaos header chrome (status line and flame icons). Stale humor flags reconcile on load and save.
- **Weather** location map loads reliably after a fresh new-tab reload instead of staying blank when layout or the image cache completes before the panel measures.
- **Weather** widget **10 Day** no longer switches to a horizontal scrolling row when the panel is resized wider.
- **Bing wallpaper** attribution appears in the bottom-left of the page footer instead of floating over HUD panels.
- **Weather** widget **Forecast** tab: Wikipedia “On this day” trivia loads again (Wikimedia requires zero-padded month/day in the feed URL); the section stays hidden when trivia cannot be fetched.
- **Header search** with **Humor banner** on no longer pushes search action buttons or HUD toolbar controls below the top bar; the bar grows to fit and HUD panels stay clear of the header.
- **Humor banner** shows again as a compact snark line above the header search field (no HUD canvas space); it works when **Settings > Widgets > Humor banner** is on even if master humor is off or intensity is set to off.
- **New tab HUD** on wide monitors: widget columns now expand to use horizontal space instead of leaving large gutters with truncated text inside fixed-width panels.
- **2 Lakes** buoy panel: active King County buoys still appear when water temperature is temporarily missing (shows **Live sensor (water temp missing)** with an amber status indicator and explanatory copy aligned with 2lakes.app, instead of **NO RECENT DATA** or a full error).
- **Settings > Import pack** — disclaimer under **Choose file** has clearer spacing from the section border.
- **Settings > Feedback** — **Use email app** mailto links now use `%20` for spaces instead of `+`, so subject and body text open correctly in Mail for Windows and other clients.
- **Weather** and other privileged-fetch panels no longer show raw allowlist errors; users get reload instructions with a link to the browser extensions page instead.
- **Weather** 10-day high/low temperatures now reliably show the 2lakes.app color scale (each value colored independently).
- **Weather** widget location map: the pin stays centered in the map view when the panel is resized instead of drifting toward the bottom edge.
- **Weather** Forecast tab: detail rows under the current temperature now show right-now readings (feels like, wind, humidity) instead of daily high/low and other today-wide aggregates.
- **Weather** widget location map: lakes and rivers now appear on the map (hybrid satellite layer) instead of a pale road-only view that could omit nearby water bodies.
- **Clock** alarms: fired reminders and test notifications show the reminder text you typed (as the primary OS toast line on Windows); test notifications use the Message field when it is filled in.
- Link HUD widgets (**Top Sites** and **Bookmarks**) refetch when optional host permissions change, so granting access no longer leaves stale error placeholders until a full new-tab reload.
- Restored regressed defaults for **background rotate**, **HUD layout chaotic**, Chaotic labeling, and balanced default HUD widget toggles; **background rotate** defaults to on when settings are absent or invalid.
- Humor banner toggle is honored again; reload hint copy names the correct browser-specific steps.
- Weather **2 Lakes** accordion stays collapsed on first load.
- **Rearrange** (F10 / header dashboard icon) and resize auto-reposition use multi-column masonry again instead of forcing a single full-width vertical stack.
- Enabling a HUD widget reflows the masonry layout when auto-reposition is on so new widgets slot into open columns without overlapping neighbors.
- HUD panel resize grips and the snap grid stay above the fixed page footer instead of drawing underneath it.

## [0.1] - 2026-05-05

Initial changelog publication for the **0.1.x** minor line. Entries under **[Unreleased]** summarize substantive changes merged after this date and will be rolled into a new **major/minor** section (for example `0.2`) when that bump happens.
