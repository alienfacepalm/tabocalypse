# Tabocalypse — Privacy

**AlienFacepalm does not operate a Tabocalypse backend.** The extension does not send your new tab content, notes, todos, imported packs, or settings to AlienFacepalm.

## Data stored on your device

- Preferences, widget toggles, and **notes** (text and which note panels are open) may sync via the browser’s extension storage sync (if you use browser sync), controlled by Mozilla/Google/Microsoft/Apple — not by us.
- **Per-monitor** widget toggles and note panel **screen positions** stay in **local** extension storage on each device (they are not part of browser sync).
- API keys (OpenAI-compatible, OpenWeather), imported packs/plugins, todos, a single saved **HUD location** (latitude/longitude used by Weather, Clock timezone, Balanced News device region, and related panels), and optional background images stay in **local** extension storage on your device.

## Network requests (only when you use a feature)

- **Open-Meteo** (`api.open-meteo.com`) when Weather, Clock, or other geo-based HUD panels are enabled — forecast and timezone lookup from the **shared HUD coordinates** you set under **Settings > Weather** (or from the browser geolocation prompt if you click **Use my location**). The same saved coordinates drive Weather, Clock local time/timezone, and Balanced News device region when those features are on.
- **Yandex Static Maps** (`static-maps.yandex.ru`) when the Weather widget is enabled — loads a hybrid satellite **image** centered on your saved HUD coordinates for the location map in the Weather panel (no Tabocalypse account; no publisher API key; subject to Yandex’s terms for that imagery).
- **Wikimedia** (`api.wikimedia.org`) when you open the Weather **Forecast** view — fetches public “on this day” facts for the current calendar date (English Wikipedia feed by default). No Tabocalypse account; facts are attributed to Wikipedia in the panel.
- **CoinGecko** (`api.coingecko.com`, `assets.coingecko.com`, `coin-images.coingecko.com`) when the Crypto prices widget is enabled — public USD spot and chart samples for the coins on your watchlist (default BTC and ETH), plus coin logos from CoinGecko’s CDN (no Tabocalypse account; no API key shipped by the publisher).
- **FreeQuickNews** (`freequicknews.com`) when the **Balanced news** widget is enabled — bias-labeled headline metadata for your chosen region and category (optional API key you supply stays in local storage; headlines open the original publisher in a new tab). **Open-Meteo Geocoding** (`geocoding-api.open-meteo.com`) may be used when device location is enabled for region — reverse lookup only, no Tabocalypse account.
- **Peapix** (`peapix.com`, `img.peapix.com`) when you choose **Bing spotlight** as the new-tab background — the extension loads a public JSON feed that mirrors Bing’s daily images (no Tabocalypse account; subject to Peapix’s and Microsoft’s terms and privacy policies for that imagery).
- **Search** opens your chosen engine in a new tab (normal web navigation). While you type in the HUD search field (when the Search widget is enabled), Tabocalypse may request **live query suggestions** from that same engine (DuckDuckGo, Google, or Bing — whichever you selected in Settings). Partial queries are sent only for autocomplete; Tabocalypse does not store them.
- **BYO AI** sends chat requests to the **base URL you configure** (e.g. OpenAI) using **your** API key when you click “Test chat completion” in Settings or send a message in the **AI chat** widget (if enabled). Conversation text in the widget stays in memory for that tab session until you reload. You are subject to that provider’s privacy policy and billing.
- **Declarative plugins** may include `LinkGrid` or other types that open URLs **you** supplied in the plugin JSON.

## Donations / feature suggestions

Support links open third-party sites (e.g. Ko-fi, GitHub Issues) in a new tab. Tabocalypse does not process payments.

When you submit **Settings > Feedback & Feature Requests**, the extension may send your message (type, text, optional reply email, extension version, and browser user-agent string) to the maintainer via **Elastic Email’s public SMTP relay** (`smtp.elasticemail.com`) using a build-time SMTP.js secure token — only when that token is configured for the build. If direct send is unavailable, you can use **Use email app** (your local mail client). We do not store feedback on AlienFacepalm servers.

## User-imported content

You are responsible for text and media you import. The publisher does not moderate your private imports.
