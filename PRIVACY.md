# Tabocalypse — Privacy

**AlienFacepalm does not operate a Tabocalypse backend.** The extension does not send your new tab content, notes, todos, imported packs, or settings to AlienFacepalm.

## Data stored on your device

- Preferences, widget toggles, and **notes** (text and which note panels are open) may sync via the browser’s extension storage sync (if you use browser sync), controlled by Mozilla/Google/Microsoft/Apple — not by us.
- API keys (OpenAI-compatible, OpenWeather), imported packs/plugins, todos, note panel **screen positions**, and optional background images stay in **local** extension storage on your device.

## Network requests (only when you use a feature)

- **Open-Meteo** (`api.open-meteo.com`) when the Weather widget is enabled — approximate location from coordinates you set (or from the browser geolocation prompt if you click “Use my location”).
- **CoinGecko** (`api.coingecko.com`) when the Crypto prices widget is enabled — public USD spot and chart samples for BTC and ETH (no Tabocalypse account; no API key shipped by the publisher).
- **Peapix** (`peapix.com`, `img.peapix.com`) when you choose **Bing spotlight** as the new-tab background — the extension loads a public JSON feed that mirrors Bing’s daily images (no Tabocalypse account; subject to Peapix’s and Microsoft’s terms and privacy policies for that imagery).
- **Search** opens your chosen engine in a new tab (normal web navigation).
- **BYO AI** sends chat requests to the **base URL you configure** (e.g. OpenAI) using **your** API key when you click “Test chat completion” in Settings or send a message in the **AI chat** widget (if enabled). Conversation text in the widget stays in memory for that tab session until you reload. You are subject to that provider’s privacy policy and billing.
- **Declarative plugins** may include `LinkGrid` or other types that open URLs **you** supplied in the plugin JSON.

## Donations / feature suggestions

Support links open third-party sites (e.g. Ko-fi, GitHub Issues) in a new tab. Tabocalypse does not process payments.

## User-imported content

You are responsible for text and media you import. The publisher does not moderate your private imports.
