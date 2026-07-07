# Tabocalypse documentation

Start here for **development**, **local testing** (including non-developers), and **store publishing**.

| Document                                                          | Audience                                                                |
| ----------------------------------------------------------------- | ----------------------------------------------------------------------- |
| [Development guide](DEVELOPMENT.md)                               | Contributors: setup, commands, repo layout, quality checks              |
| [Install and test locally](INSTALL-LOCAL-TESTING.md)              | Anyone trying the extension on their machine without writing code       |
| [Publishing to extension stores](PUBLISHING-EXTENSION-STORES.md)  | Maintainers shipping to Chrome, Edge, Firefox, and Safari               |
| [Cross-browser publishing plan](CROSS-BROWSER-PUBLISHING-PLAN.md) | Phased rollout, deliverables, and blueprint corrections for Tabocalypse |
| [Future enhancements roadmap](PLAN/ROADMAP.md)                    | Candidate backlog before Projocalypse board sync                        |
| [Projocalypse PM board](PLAN/PROJOCALYPSE.md)                     | Submodule setup, `pnpm pm:board`, plan ↔ board sync                     |
| [Architecture overview](ARCHITECTURE.md)                          | High-level map of packages and extension surfaces                       |
| [Contributing](CONTRIBUTING.md)                                   | PR expectations and checks                                              |
| [GitHub Actions](GITHUB-ACTIONS.md)                               | CI and automated release packages per browser                           |
| [Troubleshooting](TROUBLESHOOTING.md)                             | Common load / build / pnpm issues                                       |
| [Alpha setup](ALPHA-SETUP.md)                                     | Clone, build, and install in developer mode (alpha testers / devs)      |
| [Agent instructions](AGENT-INSTRUCTIONS.md)                       | Agent-agnostic rules and sync targets                                   |
| [Agent parallelism](AGENT-PARALLELISM.md)                         | Avoid collisions when running multiple Cursor chats/agents              |

**Reference (technical):**

- [Changelog](CHANGELOG.md) — curated shipped changes (Keep a Changelog style; complements Git history)
- [Declarative plugin schema (v1)](PLUGIN-SCHEMA.md) — JSON fields and widget types
- [Store listing checklist](STORE-LISTING.md) — short checklist (expanded in publishing guide)
- [Privacy policy](../PRIVACY.md) — basis for store privacy disclosures
- [Repository README](../README.md) — quick start and links to agents / Cursor rules
