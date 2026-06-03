# Store listing checklist

For a full publishing walkthrough (Chrome, Edge, Firefox, Safari, builds, privacy), see **[`PUBLISHING-EXTENSION-STORES.md`](PUBLISHING-EXTENSION-STORES.md)** and the phased **[`CROSS-BROWSER-PUBLISHING-PLAN.md`](CROSS-BROWSER-PUBLISHING-PLAN.md)**.

- **Single purpose**: Replace the new tab page with widgets and optional humor; user-imported JSON/ZIP packs are optional personal content.
- **Permissions**: `storage`, `alarms`, `notifications`; optional `bookmarks`, `topSites`, `tabs`; `host_permissions` for Open-Meteo, CoinGecko, and Peapix/Bing imagery; optional HTTPS/localhost hosts for BYO AI (settings test and optional AI chat widget).
- **Privacy**: Summarize [PRIVACY.md](../PRIVACY.md); disclose user-directed network calls (weather, user-configured AI base URL).
- **Fundraising**: Donate links open third-party sites; the extension does not process payments.
- **Screenshots**: New tab default view; Settings showing widgets + Chaos section; Import / BYO AI disclaimer.
