# Tabocalypse — Privacy

**AlienFacepalm does not operate a Tabocalypse backend.** The extension does not send your new tab content, notes, todos, imported packs, or settings to AlienFacepalm.

## Data stored on your device

- Preferences, widget toggles, and **notes** (text and which note panels are open) may sync via the browser’s extension storage sync (if you use browser sync), controlled by Mozilla/Google/Microsoft/Apple — not by us.
- **Per-monitor** widget toggles and note panel **screen positions** stay in **local** extension storage on each device (they are not part of browser sync).
- API keys (OpenAI-compatible, FreeQuickNews, Steam Web API), optional Steam ID, imported packs/plugins, todos, a single saved **HUD location** (latitude/longitude used by Weather, Clock timezone, Balanced News device region, and related panels), and optional background images stay in **local** extension storage on your device. Default **Settings export** omits API keys and Steam ID so shared backup files do not include them.

## Network requests (only when you use a feature)

- **Open-Meteo** (`api.open-meteo.com`) when Weather, Clock, or other geo-based HUD panels are enabled — forecast and timezone lookup from the **shared HUD coordinates** you set under **Settings > Weather** (or from the browser geolocation prompt if you click **Use my location**). The same saved coordinates drive Weather, Clock local time/timezone, and Balanced News device region when those features are on.
- **Yandex Static Maps** (`static-maps.yandex.ru`) when the Weather widget is enabled — loads a hybrid satellite **image** for the Weather location map (defaults to your saved HUD coordinates; per-monitor pan/zoom stays in local storage on this device; no Tabocalypse account; no publisher API key; subject to Yandex’s terms for that imagery).
- **Wikimedia** (`api.wikimedia.org`) when you open the Weather **Forecast** view — fetches public “on this day” facts for the current calendar date (English Wikipedia feed by default). No Tabocalypse account; facts are attributed to Wikipedia in the panel.
- **CoinGecko** (`api.coingecko.com`, `assets.coingecko.com`, `coin-images.coingecko.com`) when the Crypto prices widget is enabled — public USD spot and chart samples for the coins on your watchlist (default BTC and ETH), plus coin logos from CoinGecko’s CDN (no Tabocalypse account; no API key shipped by the publisher).
- **FreeQuickNews** (`freequicknews.com`) when the **Balanced news** widget is enabled — bias-labeled headline metadata for your chosen region and category (optional API key you supply stays in local storage; headlines open the original publisher in a new tab). **Open-Meteo Geocoding** (`geocoding-api.open-meteo.com`) may be used when device location is enabled for region — reverse lookup only, no Tabocalypse account.
- **Peapix** (`peapix.com`, `img.peapix.com`) when you choose **Bing spotlight** as the new-tab background — the extension loads a public JSON feed that mirrors Bing’s daily images (no Tabocalypse account; subject to Peapix’s and Microsoft’s terms and privacy policies for that imagery).
- **Search** opens your chosen engine in a new tab (normal web navigation). While you type in the HUD search field (when the Search widget is enabled), Tabocalypse may request **live query suggestions** from that same engine (DuckDuckGo, Google, or Bing — whichever you selected in Settings). Partial queries are sent only for autocomplete; Tabocalypse does not store them.
- **BYO AI** sends chat requests to the **base URL you configure** (e.g. OpenAI) using **your** API key when you click “Test chat completion” in Settings or send a message in the **AI chat** widget (if enabled). Conversation text in the widget stays in memory for that tab session until you reload. You are subject to that provider’s privacy policy and billing.
- **Steam Charts** (`steamcharts.com`) when the **Steam® leaderboard** widget is enabled — public concurrent-player chart by default (no Tabocalypse account; no publisher API key). If you add your own **Steam Web API key** and Steam ID under Settings, the widget may call **Steam** (`api.steampowered.com`) for your owned games (last played dates and hours; key and Steam ID stay in local storage). Game capsule artwork loads from Steam’s public CDN (`cdn.cloudflare.steamstatic.com` and related hosts) for identification only.
- **Cloudflare Speed Test** (`speed.cloudflare.com`) when the **Speed test** widget is enabled — measures download/upload against Cloudflare’s public endpoints (no Tabocalypse account).
- **King County** (`green2.kingcounty.gov`) when Weather **2 Lakes** buoy data is enabled — public lake buoy readings for the Pacific Northwest (no Tabocalypse account).
- **Unsuck-it** (`www.unsuck-it.com`) when humor pack refresh is configured — optional fetch of public jargon lines for the built-in classics pack (no Tabocalypse account).
- **Declarative plugins** may include `LinkGrid` or other types that open **HTTPS** URLs **you** supplied in the plugin JSON.

## Donations, purchases / feature suggestions

Support links open third-party sites (e.g. GitHub Sponsors, Ko-fi, Patreon, GitHub Issues) in a new tab. Tabocalypse does not process payments and contains no checkout.

If you buy optional paid content (a premium pack or a Pro license) from a third-party merchant, it is delivered to you as a file or text token. The extension verifies its signature **offline** using a public key built into the extension. No purchase, license, or account information is sent to AlienFacepalm, and no network request is made to validate it. A license token you paste in may sync via your browser's extension storage sync like other preferences; the default Settings export omits it.

When you use **Settings > Feedback & Feature Requests**, Tabocalypse opens your local mail client with a prefilled message (mailto). No publisher SMTP relay or embedded mail credentials are used. We do not store feedback on AlienFacepalm servers.

## User-imported content

You are responsible for text and media you import. The publisher does not moderate your private imports.
