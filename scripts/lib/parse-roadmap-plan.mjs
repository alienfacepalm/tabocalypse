/**
 * Parse Tabocalypse roadmap plan markdown with multi-word pm:section values.
 */
import { parsePlanMarkdown } from "@projocalypse/plan";

const SECTION_FROM_COMMENT_RE = /pm:section=((?:W\d+\s·\s.+?|Done|Backlog))(?=\s*(?:pm:|-->))/i;

/**
 * @param {string} content
 * @param {string} filePath
 * @param {{ defaultSection?: string; doneSection?: string }} options
 */
export function parseRoadmapPlanMarkdown(content, filePath, options = {}) {
  const lines = content.split(/\r?\n/);
  const items = parsePlanMarkdown(content, filePath, options);

  return items.map((item) => {
    const line = lines[item.source.line - 1] ?? "";
    const commentSection = SECTION_FROM_COMMENT_RE.exec(line)?.[1]?.trim();
    if (commentSection) {
      return { ...item, section: commentSection };
    }
    return item;
  });
}
