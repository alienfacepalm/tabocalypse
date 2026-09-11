# ADR-0001: Local-first — no publisher backend, no telemetry

| Status | ✅ Accepted                    |
| ------ | ------------------------------ |
| Date   | 2026-05-03                     |
| Scope  | Product invariant (whole repo) |

## Context

Tabocalypse replaces the browser's new tab page. New-tab extensions are a category with a poor trust record: many ship analytics, search hijacking, or an account you must create. The maintainer is a single person with no appetite for running servers, paying for hosting, or answering data requests.

## Decision

- Tabocalypse has **no AlienFacepalm-operated backend** of any kind: no sync server, no telemetry, no crash reporting, no "phone home" for core features.
- All state lives in `browser.storage` (local and the browser vendor's own sync). Settings are portable JSON the user can export and import.
- Network use is **user-directed only**: a widget the user enabled calls a public endpoint (Open-Meteo, CoinGecko, Steam Charts, FreeQuickNews and so on) directly from the browser. There are **no publisher API keys** in any build.
- The **zero recurring publisher operating cost** corollary: nothing may be added that the maintainer has to keep paying to run for users.

## Consequences

- Every feature must be designed to work with public, keyless endpoints or user-supplied credentials (see [ADR-0003](ADR-0003-BRING-YOUR-OWN-AI-KEYS.md)).
- Store listings and [`PRIVACY.md`](../../PRIVACY.md) can make an unusually strong privacy claim, which is the product's main marketing asset ([`doc/PLAN/MARKETING.md`](../PLAN/MARKETING.md)).
- Cross-device sync is limited by the browser vendor's `storage.sync` quota (about 8 KB per item), which drove [ADR-0008](ADR-0008-SETTINGS-PERSISTENCE-SYNC-AND-LOCAL.md).
- Monetization cannot rely on accounts, subscriptions with server-side state, or hosted content ([ADR-0016](ADR-0016-MONETIZATION-ONE-OFF-LINK-OUT-NO-ADS.md)).
- Feedback cannot go through a publisher relay ([ADR-0011](ADR-0011-FEEDBACK-VIA-MAILTO-ONLY.md)).

## References

- [`.cursor/rules/project-conventions.mdc`](../../.cursor/rules/project-conventions.mdc) — "Tabocalypse product invariants"
- [`PRIVACY.md`](../../PRIVACY.md)
- [`doc/ARCHITECTURE.md`](../ARCHITECTURE.md)
