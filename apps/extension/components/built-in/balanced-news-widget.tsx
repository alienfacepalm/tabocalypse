/**
 * Built-in HUD balanced news panel (FreeQuickNews + client-side topic clustering).
 */
import browser from "webextension-polyfill";
import { RefreshCw, Settings2 } from "lucide-react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { HudPanelBody, HudPanelTitleInline } from "../hud-panel-drag-context";
import { HudTip } from "../hud-tip";
import { PrivilegedFetchErrorPanel } from "../privileged-fetch-error-panel";
import type {
  INewsArticleRef,
  INewsFeedSnapshot,
  INewsTopicRoundup,
} from "../../lib/news/balanced-news-types";
import { BALANCED_NEWS_CATEGORY_LABELS } from "../../lib/news/balanced-news-labels";
import {
  NewsPerspectiveIcon,
  PERSPECTIVE_SLOT_ACCENT_CLASS,
  PerspectiveHeader,
  TopicBalanceIcons,
} from "../news-perspective-icon";
import type { TBalancedNewsCategory } from "../../lib/news/balanced-news-types";
import {
  BALANCED_NEWS_CATEGORY_OPTIONS,
  type TBalancedNewsCountry,
} from "../../lib/news/balanced-news-country";
import { markBalancedNewsManualRefresh } from "../../lib/news/balanced-news-cache";
import { loadBalancedNewsFeed } from "../../lib/news/load-balanced-news-feed";
import { normalizeNewsTopicRoundup } from "../../lib/news/normalize-balanced-news-snapshot";
import { resolveBalancedNewsCountry } from "../../lib/news/resolve-balanced-news-region";
import type { TPeapixBingCountry } from "../../lib/bing-wallpaper-country";

function formatTopicAge(ms: number | null, locale: string): string {
  if (ms == null) return "";
  const diff = Date.now() - ms;
  const hours = Math.floor(diff / (60 * 60 * 1000));
  if (hours < 1) return "Just now";
  if (hours < 48) return `${hours}h ago`;
  return new Intl.DateTimeFormat(locale, { month: "short", day: "numeric" }).format(new Date(ms));
}

function openArticle(url: string): void {
  void browser.tabs.create({ url });
}

/** Single-line or clamped label with ellipsis and a HUD hover tip for the full string. */
function TruncatedHudLabel({
  text,
  className,
  wrapClassName,
  lines = 1,
}: {
  text: string;
  className?: string;
  wrapClassName?: string;
  lines?: 1 | 2 | 3;
}) {
  const clampClass = lines === 1 ? "truncate" : lines === 2 ? "line-clamp-2" : "line-clamp-3";
  return (
    <HudTip
      tip={text}
      wrapClassName={["block min-w-0 max-w-full", wrapClassName].filter(Boolean).join(" ")}
    >
      <span
        className={["block min-w-0 max-w-full", clampClass, className].filter(Boolean).join(" ")}
      >
        {text}
      </span>
    </HudTip>
  );
}

function PerspectiveSlot({
  perspective,
  article,
  accentClass,
}: {
  perspective: "left" | "center" | "right";
  article: INewsArticleRef | null;
  accentClass: string;
}) {
  return (
    <div className={`min-w-0 flex-1 border border-border p-2 ${accentClass}`}>
      <PerspectiveHeader perspective={perspective} />
      {article ? (
        <button
          type="button"
          className="linkish w-full min-w-0 text-left font-mono text-xs leading-snug"
          onClick={() => openArticle(article.url)}
        >
          <TruncatedHudLabel text={article.title} lines={3} />
          <span className="mt-1 flex min-w-0 max-w-full items-center gap-1">
            <NewsPerspectiveIcon
              perspective={perspective}
              size={12}
              bias={article.bias}
              source={article.source}
              isOpinion={article.isOpinion}
              role="article"
            />
            <TruncatedHudLabel
              text={article.source}
              className="min-w-0 flex-1 text-[10px] text-muted"
            />
          </span>
        </button>
      ) : (
        <p className="font-mono text-[10px] text-muted">No {perspective} take found</p>
      )}
    </div>
  );
}

function ArticleRow({ article }: { article: INewsArticleRef }) {
  return (
    <button
      type="button"
      className="linkish w-full min-w-0 text-left font-mono text-xs leading-snug"
      onClick={() => openArticle(article.url)}
    >
      <TruncatedHudLabel text={article.title} lines={3} />
      <span className="mt-1 flex min-w-0 max-w-full items-center gap-1">
        {article.perspective ? (
          <NewsPerspectiveIcon
            perspective={article.perspective}
            size={12}
            bias={article.bias}
            source={article.source}
            isOpinion={article.isOpinion}
            role="article"
          />
        ) : null}
        <TruncatedHudLabel
          text={article.source}
          className="min-w-0 flex-1 text-[10px] text-muted"
        />
      </span>
    </button>
  );
}

function TopicArticleList({
  articles,
  label,
  locale,
  publishedAt,
}: {
  articles: readonly INewsArticleRef[];
  label: string;
  locale: string;
  publishedAt: number | null;
}) {
  if (articles.length === 0) {
    return <p className="mt-2 font-mono text-[10px] text-muted">No headlines for this topic.</p>;
  }

  return (
    <div className="mt-2 border border-border p-2">
      <p className="mb-2 font-display text-[10px] font-bold uppercase tracking-wider text-muted">
        {label}
      </p>
      <ul className="m-0 flex list-none flex-col gap-2 p-0">
        {articles.map((article) => (
          <li key={article.url} className="border-t border-border pt-2 first:border-t-0 first:pt-0">
            <ArticleRow article={article} />
          </li>
        ))}
      </ul>
      <p className="mt-2 font-mono text-[10px] text-muted">{formatTopicAge(publishedAt, locale)}</p>
    </div>
  );
}

function TopicDetail({ topic, locale }: { topic: INewsTopicRoundup; locale: string }) {
  const normalizedTopic = normalizeNewsTopicRoundup(topic);
  const articles = normalizedTopic.articles;
  const slottedUrls = new Set(
    [normalizedTopic.left, normalizedTopic.center, normalizedTopic.right, normalizedTopic.reporting]
      .filter((article): article is INewsArticleRef => article != null)
      .map((article) => article.url),
  );
  const related = articles.filter((article) => !slottedUrls.has(article.url));

  if (normalizedTopic.kind === "reporting") {
    return (
      <TopicArticleList
        articles={articles}
        label="Reporting"
        locale={locale}
        publishedAt={normalizedTopic.publishedAt}
      />
    );
  }

  return (
    <div className="mt-2 flex flex-col gap-2">
      <div className="flex flex-col gap-2 sm:flex-row">
        <PerspectiveSlot
          perspective="left"
          article={normalizedTopic.left}
          accentClass={PERSPECTIVE_SLOT_ACCENT_CLASS.left}
        />
        <PerspectiveSlot
          perspective="center"
          article={normalizedTopic.center}
          accentClass={PERSPECTIVE_SLOT_ACCENT_CLASS.center}
        />
        <PerspectiveSlot
          perspective="right"
          article={normalizedTopic.right}
          accentClass={PERSPECTIVE_SLOT_ACCENT_CLASS.right}
        />
      </div>
      {related.length > 0 ? (
        <TopicArticleList
          articles={related}
          label="Related"
          locale={locale}
          publishedAt={normalizedTopic.publishedAt}
        />
      ) : null}
    </div>
  );
}

export function BalancedNewsWidget({
  balancedNewsCountryAuto,
  balancedNewsCountry,
  balancedNewsUseDeviceGeo,
  balancedNewsCategory,
  balancedNewsTopicCount,
  balancedNewsApiKey,
  weatherGeoAdjusted,
  weatherLat,
  weatherLon,
  displayLocale,
  onOpenBalancedNewsSettings,
  onSelectCategory,
}: {
  balancedNewsCountryAuto: boolean;
  balancedNewsCountry: TPeapixBingCountry;
  balancedNewsUseDeviceGeo: boolean;
  balancedNewsCategory: TBalancedNewsCategory;
  balancedNewsTopicCount: number;
  balancedNewsApiKey: string;
  weatherGeoAdjusted: boolean;
  weatherLat: number;
  weatherLon: number;
  displayLocale: string;
  onOpenBalancedNewsSettings: () => void;
  onSelectCategory: (category: TBalancedNewsCategory) => void;
}) {
  const [snapshot, setSnapshot] = useState<INewsFeedSnapshot | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [rateLimitHint, setRateLimitHint] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const isMountRef = useRef(true);
  const prevCategoryRef = useRef(balancedNewsCategory);

  const loadFeed = useCallback(
    (forceRefresh: boolean) => {
      let cancelled = false;
      setErr(null);
      setRateLimitHint(null);
      if (forceRefresh) {
        setSnapshot(null);
      }
      setLoading(true);

      void (async () => {
        try {
          const country: TBalancedNewsCountry = await resolveBalancedNewsCountry(
            {
              balancedNewsCountryAuto,
              balancedNewsCountry,
              balancedNewsUseDeviceGeo,
              weatherGeoAdjusted,
              weatherLat,
              weatherLon,
            },
            undefined,
          );
          const result = await loadBalancedNewsFeed(
            {
              country,
              category: balancedNewsCategory,
              topicCount: balancedNewsTopicCount,
              apiKey: balancedNewsApiKey.trim() || undefined,
              forceRefresh,
            },
            undefined,
          );

          if (cancelled) return;

          if (result.kind === "rate_limited") {
            setRateLimitHint(
              "FreeQuickNews rate limit reached. Showing cached headlines if available.",
            );
            if (result.snapshot) {
              setSnapshot(result.snapshot);
            } else {
              setErr(result.message);
            }
            return;
          }

          setSnapshot(result.snapshot);
        } catch (e: unknown) {
          if (!cancelled) {
            setErr(e instanceof Error ? e.message : "Balanced news failed");
          }
        } finally {
          if (!cancelled) {
            setLoading(false);
            setRefreshing(false);
          }
        }
      })();

      return () => {
        cancelled = true;
      };
    },
    [
      balancedNewsApiKey,
      balancedNewsCategory,
      balancedNewsCountry,
      balancedNewsCountryAuto,
      balancedNewsTopicCount,
      balancedNewsUseDeviceGeo,
      weatherGeoAdjusted,
      weatherLat,
      weatherLon,
    ],
  );

  useEffect(() => {
    const categoryChanged = !isMountRef.current && prevCategoryRef.current !== balancedNewsCategory;
    prevCategoryRef.current = balancedNewsCategory;
    isMountRef.current = false;

    if (categoryChanged) {
      setSelectedTopicId(null);
      setRefreshing(true);
      void markBalancedNewsManualRefresh().then(() => loadFeed(true));
      return undefined;
    }

    return loadFeed(false);
  }, [loadFeed, reloadToken, balancedNewsCategory]);

  useEffect(() => {
    if (!snapshot || snapshot.topics.length === 0) {
      setSelectedTopicId(null);
      return;
    }
    if (!selectedTopicId || !snapshot.topics.some((t) => t.id === selectedTopicId)) {
      setSelectedTopicId(snapshot.topics[0]!.id);
    }
  }, [snapshot, selectedTopicId]);

  const selectedTopic =
    selectedTopicId != null
      ? (snapshot?.topics.find((topic) => topic.id === selectedTopicId) ?? null)
      : null;

  const manualRefresh = (): void => {
    setRefreshing(true);
    void markBalancedNewsManualRefresh().then(() => {
      loadFeed(true);
    });
  };

  const regionLabel = snapshot
    ? `${snapshot.country} · ${BALANCED_NEWS_CATEGORY_LABELS[snapshot.category as TBalancedNewsCategory] ?? snapshot.category}`
    : BALANCED_NEWS_CATEGORY_LABELS[balancedNewsCategory];

  return (
    <section className="card flex h-full min-h-0 flex-col gap-3">
      <div className="shrink-0">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <HudPanelTitleInline>Balanced news</HudPanelTitleInline>
          <div className="flex flex-wrap items-center gap-1">
            <HudTip tip="Refresh headlines (respects cache and rate limits)">
              <button
                type="button"
                className="btn ghost icon-only sm"
                aria-label="Refresh balanced news headlines"
                disabled={refreshing || loading}
                onClick={manualRefresh}
              >
                <RefreshCw size={18} strokeWidth={2} aria-hidden />
              </button>
            </HudTip>
            <HudTip tip="Open Settings, Balanced news section">
              <button
                type="button"
                className="btn ghost icon-only sm"
                aria-label="Open balanced news settings"
                onClick={onOpenBalancedNewsSettings}
              >
                <Settings2 size={18} strokeWidth={2} aria-hidden />
              </button>
            </HudTip>
          </div>
        </div>
        <p className="mt-1 font-mono text-[10px] text-muted">{regionLabel}</p>
        <div className="row wrap mt-2 gap-1" role="group" aria-label="News category">
          {BALANCED_NEWS_CATEGORY_OPTIONS.map((category) => (
            <HudTip
              key={category}
              tip={`Show latest ${BALANCED_NEWS_CATEGORY_LABELS[category].toLowerCase()} headlines`}
            >
              <button
                type="button"
                className={balancedNewsCategory === category ? "btn primary sm" : "btn sm"}
                aria-pressed={balancedNewsCategory === category}
                disabled={refreshing || (loading && balancedNewsCategory === category)}
                onClick={() => {
                  if (category === balancedNewsCategory) return;
                  onSelectCategory(category);
                }}
              >
                {BALANCED_NEWS_CATEGORY_LABELS[category]}
              </button>
            </HudTip>
          ))}
        </div>
      </div>

      <HudPanelBody className="min-h-0 flex-1 overflow-y-auto">
        {loading && !snapshot ? (
          <p className="muted font-mono text-xs">Loading headlines…</p>
        ) : err ? (
          <div className="flex flex-col gap-3">
            <PrivilegedFetchErrorPanel
              message={err}
              onRetry={() => setReloadToken((n) => n + 1)}
              retryTip="Try fetching balanced news headlines again"
              retryAriaLabel="Retry balanced news headlines"
            />
            <p className="muted m-0 border-t border-border pt-3 text-xs leading-relaxed">
              Check Settings &gt; Balanced news for region and optional API key.{" "}
              <button type="button" className="linkish" onClick={onOpenBalancedNewsSettings}>
                Open settings
              </button>
            </p>
          </div>
        ) : snapshot && snapshot.topics.length === 0 ? (
          <p className="muted font-mono text-xs">
            No topics found for this region. Try another category above.
          </p>
        ) : snapshot ? (
          <>
            {rateLimitHint ? (
              <p className="mb-2 font-mono text-[10px] text-[var(--color-accent2)]">
                {rateLimitHint}
              </p>
            ) : null}
            {snapshot.stale ? (
              <p className="mb-2 font-mono text-[10px] text-muted">Showing cached headlines.</p>
            ) : null}
            <ul className="m-0 flex list-none flex-col gap-1 p-0">
              {snapshot.topics.map((topic) => {
                const active = topic.id === selectedTopicId;
                return (
                  <li key={topic.id}>
                    <button
                      type="button"
                      className={
                        active
                          ? "btn primary flex w-full min-w-0 items-center gap-2 text-left normal-case tracking-normal"
                          : "btn ghost flex w-full min-w-0 items-center gap-2 text-left normal-case tracking-normal"
                      }
                      aria-pressed={active}
                      onClick={() => setSelectedTopicId(topic.id)}
                    >
                      <TruncatedHudLabel
                        text={topic.title}
                        className="font-mono text-xs"
                        wrapClassName="min-w-0 flex-1"
                      />
                      <TopicBalanceIcons topic={topic} />
                    </button>
                  </li>
                );
              })}
            </ul>
            {selectedTopic ? (
              <TopicDetail key={selectedTopic.id} topic={selectedTopic} locale={displayLocale} />
            ) : null}
          </>
        ) : null}
      </HudPanelBody>
    </section>
  );
}
