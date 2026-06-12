---
name: sync-settings-changelog
description: >-
  Regenerate the embedded settings changelog and roll doc/CHANGELOG.md when
  apps/extension/package.json version bumps or when changelog history must ship
  to Settings > Changelog. Use on version bumps, release prep, or when the user
  asks to sync the in-settings changelog.
---

# sync-settings-changelog

Keep **Settings > Changelog** in sync with [`doc/CHANGELOG.md`](../../doc/CHANGELOG.md) via the generated embed.

## When to use

- **`apps/extension/package.json` `version` is bumped** (patch, minor, or major).
- **`doc/CHANGELOG.md`** was updated with shipped user-visible history that should appear in settings.
- User asks to refresh or sync the in-settings changelog.

## Workflow

1. **Update [`doc/CHANGELOG.md`](../../doc/CHANGELOG.md)**
   - For a **version bump**: roll **[Unreleased]** into a new `## [x.y] - YYYY-MM-DD` section (major/minor policy per the file header).
   - For ongoing work: append under **[Unreleased]** (Added / Changed / Fixed).

2. **Regenerate embed** (repo root):

   ```powershell
   pnpm generate:settings-changelog
   ```

   Output: [`apps/extension/lib/changelog/changelog.generated.ts`](../../apps/extension/lib/changelog/changelog.generated.ts)

3. **Verify**
   - `SETTINGS_CHANGELOG_EXTENSION_VERSION` matches `apps/extension/package.json` `version`.
   - Settings accordion **Changelog** would show the full markdown body (headings + lists).

4. **Commit together** with the version bump and product changes when applicable.

## Do not

- Edit `changelog.generated.ts` by hand.
- Bump extension version without regenerating when changelog content changed.

## Related rules

- [settings-changelog-version-bump.mdc](../../rules/settings-changelog-version-bump.mdc)
- [update-docs-before-commit.mdc](../../rules/update-docs-before-commit.mdc)
