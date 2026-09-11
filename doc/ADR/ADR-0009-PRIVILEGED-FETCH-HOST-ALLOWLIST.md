# ADR-0009: Widget network calls go through the background worker against a host allowlist

| Status | ✅ Accepted                                                              |
| ------ | ------------------------------------------------------------------------ |
| Date   | 2026-05-04                                                               |
| Scope  | `background.ts`, `lib/privileged-extension-fetch*.ts`, every data widget |

## Context

Widgets need public data (weather, Steam Charts pages, news feeds, wallpaper feeds). Fetching from the new-tab page hits CORS on many of those hosts; fetching from the service worker with `host_permissions` works but must not turn into an open proxy that any imported content could point at arbitrary URLs.

## Decision

- The new-tab page sends `runtime.sendMessage` requests (`TABOCALYPSE_PRIV_FETCH_JSON` / `TEXT` / `BYTES`) to the **MV3 service worker**, which performs the `fetch`.
- The worker accepts only **HTTPS** URLs whose host is in **`PRIVILEGED_EXTENSION_FETCH_ALLOWED_HOSTS`**; the same hosts are declared as manifest `host_permissions`. Redirects to another host or to non-HTTPS are rejected. Messages from untrusted senders are ignored.
- Adding a data source means appending the host to the allowlist **and** to `wxt.config.ts`, then updating `PRIVACY.md` and the store permission table. Image-only sources (Yandex static map, CoinGecko logos) load through `<img>` and need no allowlist entry.
- CoinGecko market rows go through a dedicated background handler that caches and honours `Retry-After`.
- Users never see allowlist internals: `resolvePrivilegedFetchUserMessage` maps errors to plain language, and a reload hint accompanies stale-worker cases.

## Consequences

- Every network host is enumerable from one file, which keeps store reviews and the privacy policy honest.
- Declarative plugins ([ADR-0002](ADR-0002-DECLARATIVE-PLUGINS-ONLY.md)) cannot use the proxy; future data-card widgets will require a user-approved optional host permission at import time.
- A user with a stale service worker after an update may see "reload the extension" until they do; docs and UI explain this.

## References

- [`apps/extension/lib/privileged-extension-fetch.ts`](../../apps/extension/lib/privileged-extension-fetch.ts), [`privileged-extension-fetch-handler.ts`](../../apps/extension/lib/privileged-extension-fetch-handler.ts), [`extension-message-sender.ts`](../../apps/extension/lib/extension-message-sender.ts)
- [`.cursor/rules/privileged-fetch-user-errors.mdc`](../../.cursor/rules/privileged-fetch-user-errors.mdc)
- [`doc/STORE-LISTING.md`](../STORE-LISTING.md) — permission justifications
