export interface IChangelogBlock {
  type: "heading" | "subheading" | "paragraph" | "listItem";
  text: string;
}

/** Lightweight Keep-a-Changelog markdown for in-settings display (no HTML). */
export function parseChangelogMarkdown(markdown: string): IChangelogBlock[] {
  const blocks: IChangelogBlock[] = [];
  for (const rawLine of markdown.split(/\r?\n/)) {
    const line = rawLine.trimEnd();
    const trimmed = line.trim();
    if (!trimmed) {
      continue;
    }
    if (trimmed.startsWith("## ")) {
      blocks.push({ type: "heading", text: trimmed.slice(3).trim() });
      continue;
    }
    if (trimmed.startsWith("### ")) {
      blocks.push({ type: "subheading", text: trimmed.slice(4).trim() });
      continue;
    }
    if (trimmed.startsWith("- ")) {
      blocks.push({ type: "listItem", text: stripInlineMarkdown(trimmed.slice(2).trim()) });
      continue;
    }
    blocks.push({ type: "paragraph", text: stripInlineMarkdown(trimmed) });
  }
  return blocks;
}

function stripInlineMarkdown(text: string): string {
  return text.replace(/\*\*(.+?)\*\*/g, "$1").replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
}
