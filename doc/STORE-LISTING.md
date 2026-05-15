# Store listing checklist

For a full publishing walkthrough (Chrome, Edge, Firefox, Safari, builds, privacy), see **[`PUBLISHING-EXTENSION-STORES.md`](PUBLISHING-EXTENSION-STORES.md)**.

- **Single purpose**: Replace the new tab page with widgets and optional humor; user-imported JSON/ZIP packs are optional personal content.
- **Permissions**: `storage`, `alarms`, `notifications`; optional `bookmarks`, `topSites`, `tabs`; `host_permissions` for Open-Meteo, CoinGecko, and Peapix/Bing imagery; optional OpenAI host for BYO API test only.
- **Privacy**: Summarize [PRIVACY.md](../PRIVACY.md); disclose user-directed network calls (weather, user-configured AI base URL).
- **Fundraising**: Donate links open third-party sites; the extension does not process payments.
- **Screenshots**: New tab default view; Settings showing widgets + Chaos section; Import / BYO AI disclaimer.
