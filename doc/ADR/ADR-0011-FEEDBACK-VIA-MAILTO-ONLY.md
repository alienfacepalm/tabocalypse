# ADR-0011: Feedback opens the user's mail app; builds carry no SMTP credentials

| Status | ✅ Accepted (supersedes the SMTP relay form shipped briefly in 2026-07) |
| ------ | ----------------------------------------------------------------------- |
| Date   | 2026-07-27                                                              |
| Scope  | Settings › Feedback & Feature Requests                                  |

## Context

An in-dialog feedback form that posted through a public SMTP relay (Elastic Email) was shipped so non-technical testers could report issues without GitHub. Any credential embedded in an extension is extractable, so the relay key was effectively public, and the relay was a small recurring cost and a spam target. Both conflict with [ADR-0001](ADR-0001-NO-PUBLISHER-BACKEND.md).

## Decision

- The feedback form stays, but its only action is **`mailto:`**: it composes subject and body (type, message, extension version, optional browser info) and opens the user's mail client.
- The recipient is a build-time value (`WXT_TABOCALYPSE_FEEDBACK_TO`, defaulting to the maintainer's address). No SMTP host, key, or relay code exists in the repo.
- Oversized browser-info strings are rejected so the mailto URL stays valid and the inbox usable.
- Feature requests may alternatively link out to GitHub Issues via the footer "Ideas" link.

## Consequences

- Zero credentials in builds; the store "remote code / data collection" answers are simpler.
- Users without a configured mail client get an unhelpful OS prompt; the form explains the "Use email app" behaviour and the GitHub alternative.
- Feedback volume is not measurable (no analytics), which is consistent with the product's stance.

## References

- [`apps/extension/lib/feedback/feedback-mailto.ts`](../../apps/extension/lib/feedback/feedback-mailto.ts), [`feedback-mailto-config.ts`](../../apps/extension/lib/feedback/feedback-mailto-config.ts)
- [`apps/extension/components/settings-feedback-form.tsx`](../../apps/extension/components/settings-feedback-form.tsx)
- `doc/CHANGELOG.md` 1.0 — "Settings › Feedback — opens your email app only (mailto)"
