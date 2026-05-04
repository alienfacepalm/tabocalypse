# Tabocalypse — Privacy

**AlienFacepalm does not operate a Tabocalypse backend.** The extension does not send your new tab content, notes, todos, imported packs, or settings to AlienFacepalm.

## Data stored on your device

- Preferences and widget toggles may sync via the browser’s extension storage sync (if you use browser sync), controlled by Mozilla/Google/Microsoft — not by us.
- API keys (OpenAI-compatible, OpenWeather), imported packs/plugins, notes, todos, and optional background images stay in **local** extension storage on your device.

## Network requests (only when you use a feature)

- **Open-Meteo** (`api.open-meteo.com`) when the Weather widget is enabled — approximate location from coordinates you set (or from the browser geolocation prompt if you click “Use my location”).
- **Bing** (`www.bing.com`) when you choose **Bing spotlight** as the new-tab background — the extension fetches Microsoft’s public daily wallpaper metadata and image URLs (no account; subject to Microsoft’s terms and privacy policy).
- **Search** opens your chosen engine in a new tab (normal web navigation).
- **BYO AI test** sends a minimal chat request to the **base URL you configure** (e.g. OpenAI) using **your** API key, only when you click “Test chat completion”. You are subject to that provider’s privacy policy and billing.
- **Declarative plugins** may include `LinkGrid` or other types that open URLs **you** supplied in the plugin JSON.

## Donations / feature suggestions

Support links open third-party sites (e.g. Ko-fi, GitHub Issues) in a new tab. Tabocalypse does not process payments.

## User-imported content

You are responsible for text and media you import. The publisher does not moderate your private imports.
