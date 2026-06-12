import React, { useMemo } from "react";
import { parseChangelogMarkdown } from "../lib/changelog/parse-changelog-markdown";
import {
  SETTINGS_CHANGELOG_EXTENSION_VERSION,
  SETTINGS_CHANGELOG_MARKDOWN,
} from "../lib/changelog/changelog.generated";

export function SettingsChangelogPanel(): React.JSX.Element {
  const blocks = useMemo(() => parseChangelogMarkdown(SETTINGS_CHANGELOG_MARKDOWN), []);

  return (
    <div>
      <p className="muted sm mt-0 mb-2">
        Full release history for Tabocalypse as shipped in this build (v
        {SETTINGS_CHANGELOG_EXTENSION_VERSION}
        ).
      </p>
      <div className="settings-changelog hud-scrollbar max-h-[min(28rem,50vh)] overflow-y-auto border border-border bg-surface-weak p-3">
        {blocks.map((block, index) => {
          if (block.type === "heading") {
            return (
              <h4 key={`${index}-${block.text}`} className="settings-changelog-h2">
                {block.text}
              </h4>
            );
          }
          if (block.type === "subheading") {
            return (
              <h5 key={`${index}-${block.text}`} className="settings-changelog-h3">
                {block.text}
              </h5>
            );
          }
          if (block.type === "listItem") {
            return (
              <p key={`${index}-${block.text}`} className="settings-changelog-li">
                {block.text}
              </p>
            );
          }
          return (
            <p key={`${index}-${block.text}`} className="settings-changelog-p">
              {block.text}
            </p>
          );
        })}
      </div>
    </div>
  );
}
