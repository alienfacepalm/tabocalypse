const GITHUB_REPO_PATH_RE = /^\/([^/]+)\/([^/]+)/;
const GITHUB_RESERVED_SEGMENTS = new Set([
  "apps",
  "collections",
  "customer-stories",
  "events",
  "explore",
  "features",
  "login",
  "marketplace",
  "new",
  "notifications",
  "orgs",
  "pricing",
  "pulls",
  "search",
  "settings",
  "sponsors",
  "topics",
  "trending",
]);

function parseYoutubeVideoId(url: URL): string | null {
  if (url.hostname === "youtu.be") {
    const id = url.pathname.replace(/^\//, "").split("/")[0];
    return id && id.length > 0 ? id : null;
  }
  if (url.hostname === "www.youtube.com" || url.hostname === "youtube.com") {
    if (url.pathname === "/watch") {
      const id = url.searchParams.get("v");
      return id && id.length > 0 ? id : null;
    }
    const shortsMatch = url.pathname.match(/^\/shorts\/([^/?#]+)/);
    if (shortsMatch?.[1]) return shortsMatch[1];
  }
  return null;
}

function parseGithubRepoOpenGraphUrl(url: URL): string | null {
  if (url.hostname !== "github.com" && url.hostname !== "www.github.com") return null;
  const match = url.pathname.match(GITHUB_REPO_PATH_RE);
  if (!match) return null;
  const owner = match[1];
  const repo = match[2];
  if (!owner || !repo) return null;
  if (GITHUB_RESERVED_SEGMENTS.has(owner.toLowerCase())) return null;
  const repoBase = repo.split(".")[0];
  if (!repoBase || repoBase.length === 0) return null;
  return `https://opengraph.githubassets.com/1/${encodeURIComponent(owner)}/${encodeURIComponent(repoBase)}`;
}

/**
 * Derives a thumbnail URL from well-known article URL patterns (no page fetch).
 * Returns null when the URL shape is not recognized.
 */
export function resolveKnownArticleThumbnailUrl(articleUrl: string): string | null {
  try {
    const url = new URL(articleUrl.trim());
    const youtubeId = parseYoutubeVideoId(url);
    if (youtubeId) {
      return `https://img.youtube.com/vi/${encodeURIComponent(youtubeId)}/mqdefault.jpg`;
    }
    return parseGithubRepoOpenGraphUrl(url);
  } catch {
    return null;
  }
}
