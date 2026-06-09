import type { INewsArticleRef, INewsTopicRoundup, TNewsPerspective } from "./balanced-news-types";

const CLUSTER_WINDOW_MS = 48 * 60 * 60 * 1000;
const SIMILARITY_THRESHOLD = 0.35;

const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "at",
  "be",
  "by",
  "for",
  "from",
  "has",
  "have",
  "in",
  "is",
  "it",
  "its",
  "of",
  "on",
  "or",
  "s",
  "that",
  "the",
  "their",
  "this",
  "to",
  "was",
  "were",
  "will",
  "with",
]);

function tokenizeTitle(title: string): Set<string> {
  const tokens = title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 2 && !STOP_WORDS.has(t));
  return new Set(tokens);
}

function jaccardSimilarity(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let intersection = 0;
  for (const token of a) {
    if (b.has(token)) intersection += 1;
  }
  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

function articleRecency(article: INewsArticleRef): number {
  return article.publishedAt ?? 0;
}

function pickBetterArticle(
  current: INewsArticleRef | null,
  candidate: INewsArticleRef,
): INewsArticleRef {
  if (!current) return candidate;
  const curTime = articleRecency(current);
  const candTime = articleRecency(candidate);
  if (candTime !== curTime) return candTime > curTime ? candidate : current;
  return candidate.title.length > current.title.length ? candidate : current;
}

function balanceScoreForTopic(topic: Omit<INewsTopicRoundup, "balanceScore" | "id">): number {
  if (topic.kind === "reporting") return topic.reporting ? 1 : 0;
  let score = 0;
  if (topic.left) score += 1;
  if (topic.center) score += 1;
  if (topic.right) score += 1;
  return score;
}

function sharedPhraseTitle(articles: INewsArticleRef[]): string {
  if (articles.length === 0) return "News topic";
  const tokenLists = articles.map((a) => [...tokenizeTitle(a.title)]);
  if (tokenLists.length === 1) return articles[0]!.title;

  const counts = new Map<string, number>();
  for (const tokens of tokenLists) {
    for (const token of tokens) {
      counts.set(token, (counts.get(token) ?? 0) + 1);
    }
  }
  const shared = [...counts.entries()]
    .filter(([, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1] || b[0].length - a[0].length)
    .map(([token]) => token);

  if (shared.length >= 2) {
    const phrase = shared.slice(0, 4).join(" ");
    return phrase.charAt(0).toUpperCase() + phrase.slice(1);
  }

  const newest = [...articles].sort((a, b) => articleRecency(b) - articleRecency(a))[0];
  return newest?.title ?? articles[0]!.title;
}

interface IClusterBucket {
  articles: INewsArticleRef[];
  tokens: Set<string>;
  maxPublishedAt: number;
}

function withinWindow(articles: INewsArticleRef[], now: number): INewsArticleRef[] {
  return articles.filter((a) => {
    if (a.publishedAt == null) return true;
    return now - a.publishedAt <= CLUSTER_WINDOW_MS;
  });
}

function stableTopicId(cluster: INewsArticleRef[]): string {
  const primary = [...cluster].sort((a, b) => articleRecency(b) - articleRecency(a))[0];
  const seed = primary?.url ?? cluster.map((a) => a.url).join("|");
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  }
  return `topic-${Math.abs(hash)}`;
}

function buildTopicFromCluster(cluster: INewsArticleRef[]): INewsTopicRoundup {
  const opinionArticles = cluster.filter((a) => a.isOpinion);
  const reportingArticles = cluster.filter((a) => !a.isOpinion);
  const useOpinion = opinionArticles.length > 0;

  const slots: Record<TNewsPerspective, INewsArticleRef | null> = {
    left: null,
    center: null,
    right: null,
  };

  if (useOpinion) {
    for (const article of opinionArticles) {
      if (!article.perspective) continue;
      slots[article.perspective] = pickBetterArticle(slots[article.perspective], article);
    }
  }

  const reporting =
    !useOpinion && reportingArticles.length > 0
      ? [...reportingArticles].sort((a, b) => articleRecency(b) - articleRecency(a))[0]!
      : null;

  const publishedAt = Math.max(...cluster.map((a) => a.publishedAt ?? 0), 0);
  const articles = [...cluster].sort((a, b) => articleRecency(b) - articleRecency(a));

  const base = {
    title: sharedPhraseTitle(cluster),
    kind: useOpinion ? ("opinion" as const) : ("reporting" as const),
    publishedAt: publishedAt > 0 ? publishedAt : null,
    articles,
    left: slots.left,
    center: slots.center,
    right: slots.right,
    reporting,
  };

  return {
    id: stableTopicId(cluster),
    ...base,
    balanceScore: balanceScoreForTopic(base),
  };
}

/** Groups articles into topics and assigns L/C/R representatives for opinion clusters. */
export function clusterNewsTopics(
  articles: readonly INewsArticleRef[],
  topicCount: number,
  now: number = Date.now(),
): INewsTopicRoundup[] {
  const recent = withinWindow([...articles], now);
  const sorted = [...recent].sort((a, b) => articleRecency(b) - articleRecency(a));
  const buckets: IClusterBucket[] = [];

  for (const article of sorted) {
    const tokens = tokenizeTitle(article.title);
    let bestIdx = -1;
    let bestScore = 0;

    for (let i = 0; i < buckets.length; i++) {
      const score = jaccardSimilarity(tokens, buckets[i]!.tokens);
      if (score > bestScore) {
        bestScore = score;
        bestIdx = i;
      }
    }

    if (bestIdx >= 0 && bestScore >= SIMILARITY_THRESHOLD) {
      const bucket = buckets[bestIdx]!;
      bucket.articles.push(article);
      for (const token of tokens) bucket.tokens.add(token);
      bucket.maxPublishedAt = Math.max(bucket.maxPublishedAt, articleRecency(article));
    } else {
      buckets.push({
        articles: [article],
        tokens,
        maxPublishedAt: articleRecency(article),
      });
    }
  }

  const topics = buckets
    .map((bucket) => buildTopicFromCluster(bucket.articles))
    .sort((a, b) => {
      if (b.balanceScore !== a.balanceScore) return b.balanceScore - a.balanceScore;
      return (b.publishedAt ?? 0) - (a.publishedAt ?? 0);
    });

  return topics.slice(0, topicCount);
}
