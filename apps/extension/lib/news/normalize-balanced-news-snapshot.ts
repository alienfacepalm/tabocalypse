import type { INewsArticleRef, INewsFeedSnapshot, INewsTopicRoundup } from "./balanced-news-types";

function slotArticles(topic: INewsTopicRoundup): INewsArticleRef[] {
  const seen = new Set<string>();
  const out: INewsArticleRef[] = [];
  for (const article of [topic.left, topic.center, topic.right, topic.reporting]) {
    if (!article || seen.has(article.url)) continue;
    seen.add(article.url);
    out.push(article);
  }
  return out;
}

/** Backfills {@link INewsTopicRoundup.articles} for snapshots saved before that field existed. */
export function normalizeNewsTopicRoundup(topic: INewsTopicRoundup): INewsTopicRoundup {
  const articles = Array.isArray(topic.articles) ? topic.articles : slotArticles(topic);
  return articles === topic.articles ? topic : { ...topic, articles };
}

/** Ensures cached balanced-news snapshots match the current topic shape. */
export function normalizeNewsFeedSnapshot(snapshot: INewsFeedSnapshot): INewsFeedSnapshot {
  const topics = Array.isArray(snapshot.topics)
    ? snapshot.topics.map((topic) => normalizeNewsTopicRoundup(topic))
    : [];
  return topics === snapshot.topics ? snapshot : { ...snapshot, topics };
}
