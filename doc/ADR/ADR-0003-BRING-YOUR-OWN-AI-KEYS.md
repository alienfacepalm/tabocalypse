# ADR-0003: AI features use only user-supplied keys and base URLs

| Status | ✅ Accepted                                      |
| ------ | ------------------------------------------------ |
| Date   | 2026-05-03                                       |
| Scope  | Settings › BYO AI, AI chat widget, search assist |

## Context

An AI chat panel and AI-assisted search are expected features in 2026, but the usual way to ship them (a publisher API key behind a proxy) violates [ADR-0001](ADR-0001-NO-PUBLISHER-BACKEND.md) twice: it needs a backend and it creates a recurring bill that grows with installs.

## Decision

- The extension ships **no LLM credentials**. Under **Settings › BYO AI** the user supplies an **OpenAI-compatible base URL** and **their own API key** (presets for OpenAI and Gemini; any HTTPS host or `localhost` for self-hosted models).
- Because the host is user-chosen, the manifest declares those hosts as **`optional_host_permissions`**; the extension requests the origin permission only when the user saves a base URL, and only for **HTTPS** (or loopback) URLs.
- The **search assist** action never calls a model itself: it opens the vendor's own chat/search page in a new tab with the query in the URL, using the user's normal browser session.
- API keys are stored in the **local** slice only (never `storage.sync`) and are **redacted from Settings export** by default.

## Consequences

- Users pay their provider directly and can point the widget at a local model; the maintainer has no AI cost and no key-rotation burden.
- The AI chat widget is off by default and cannot be "one-click" for people without a key; onboarding copy must explain this.
- Credential inputs needed hardening (masked field, paste handling, autofill suppression, no `type=password` so password managers do not clear them).

## References

- [`apps/extension/lib/byo-ai-host-permission.ts`](../../apps/extension/lib/byo-ai-host-permission.ts)
- [`apps/extension/lib/openai-compatible-chat.ts`](../../apps/extension/lib/openai-compatible-chat.ts)
- [`apps/extension/lib/settings-export.ts`](../../apps/extension/lib/settings-export.ts)
- [`doc/ARCHITECTURE.md`](../ARCHITECTURE.md) — "Search widget (web vs assist)"
