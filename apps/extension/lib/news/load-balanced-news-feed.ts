import type { INewsFeedSnapshot } from "./balanced-news-types";
import type { TBalancedNewsCategory } from "./balanced-news-types";
import type { TBalancedNewsCountry } from "./balanced-news-country";
import {
  isBalancedNewsRateLimitError,
  readBalancedNewsCache,
  recordBalancedNewsRateLimit,
  writeBalancedNewsCache,
} from "./balanced-news-cache";
import { clusterNewsTopics } from "./cluster-news-topics";
import { fetchBalancedNewsArticles } from "./fetch-balanced-news";

export interface ILoadBalancedNewsFeedInput {
  country: TBalancedNewsCountry;
  category: TBalancedNewsCategory;
  topicCount: number;
  apiKey?: string;
  forceRefresh?: boolean;
}

export type TLoadBalancedNewsFeedResult =
  | { kind: "ok"; snapshot: INewsFeedSnapshot }
  | { kind: "cached"; snapshot: INewsFeedSnapshot }
  | { kind: "rate_limited"; snapshot: INewsFeedSnapshot | null; message: string };

export async function loadBalancedNewsFeed(
  input: ILoadBalancedNewsFeedInput,
  signal?: AbortSignal,
): Promise<TLoadBalancedNewsFeedResult> {
  const now = Date.now();
  const cacheRead = await readBalancedNewsCache(input.country, input.category, now);

  if (!input.forceRefresh && cacheRead.snapshot && !cacheRead.staleOnly) {
    return { kind: "cached", snapshot: cacheRead.snapshot };
  }

  if (!input.forceRefresh && cacheRead.snapshot && !cacheRead.canRefresh) {
    return {
      kind: "cached",
      snapshot: { ...cacheRead.snapshot, stale: true },
    };
  }

  try {
    const articles = await fetchBalancedNewsArticles(
      {
        country: input.country,
        category: input.category,
        limit: input.topicCount,
        apiKey: input.apiKey,
      },
      signal,
    );
    const topics = clusterNewsTopics(articles, input.topicCount, now);
    const snapshot: INewsFeedSnapshot = {
      topics,
      fetchedAt: now,
      country: input.country,
      category: input.category,
      stale: false,
    };
    await writeBalancedNewsCache(input.country, input.category, snapshot, now);
    return { kind: "ok", snapshot };
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Balanced news failed";
    if (isBalancedNewsRateLimitError(message)) {
      await recordBalancedNewsRateLimit(now);
      if (cacheRead.snapshot) {
        return {
          kind: "rate_limited",
          snapshot: { ...cacheRead.snapshot, stale: true },
          message,
        };
      }
      return { kind: "rate_limited", snapshot: null, message };
    }
    if (cacheRead.snapshot) {
      return {
        kind: "cached",
        snapshot: { ...cacheRead.snapshot, stale: true },
      };
    }
    throw e;
  }
}
