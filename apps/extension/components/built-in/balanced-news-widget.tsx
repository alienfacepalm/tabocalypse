/**
 * Built-in HUD balanced news panel (FreeQuickNews + client-side topic clustering).
 */
import browser from "webextension-polyfill";
import { RefreshCw, Settings2 } from "lucide-react";
import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
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
import { formatArticleSynopsis } from "../../lib/news/format-article-synopsis";
import { loadBalancedNewsFeed } from "../../lib/news/load-balanced-news-feed";
import { resolveNewsArticleDisplayThumbnailUrl } from "../../lib/news/resolve-news-article-display-thumbnail-url";
import { resolveTopicPreviewArticle } from "../../lib/news/resolve-topic-preview-article";
import {
  resolveTopicPreviewPlacement,
  type ITopicPreviewPlacementResult,
} from "../../lib/news/resolve-topic-preview-placement";
import { normalizeNewsTopicRoundup } from "../../lib/news/normalize-balanced-news-snapshot";
import { resolveBalancedNewsCountry } from "../../lib/news/resolve-balanced-news-region";
import type { TPeapixBingCountry } from "../../lib/bing-wallpaper-country";

const TOPIC_PREVIEW_WIDTH_PX = 320;
const TOPIC_PREVIEW_ESTIMATED_HEIGHT_PX = 300;
/** Debounced delay before closing the topic preview after pointer leaves the widget and popover. */
const TOPIC_PREVIEW_ROLLOFF_DEBOUNCE_MS = 350;

interface IHoverTopicPreview {
  topic: INewsTopicRoundup;
  previewArticle: INewsArticleRef;
  anchorEl: HTMLElement;
}

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
/** Thumbnail beside a headline row; `lg` is 2× the default list size for the selected preview. */
function ArticleThumbnail({
  article,
  size = "md",
}: {
  article: INewsArticleRef;
  size?: "md" | "lg";
}) {
  const [failed, setFailed] = useState(false);
  const url = resolveNewsArticleDisplayThumbnailUrl(article);
  const sizeClass = size === "lg" ? "h-24 w-24" : "h-12 w-12";
  if (failed) return null;

  return (
    <img
      src={url}
      alt=""
      width={size === "lg" ? 96 : 48}
      height={size === "lg" ? 96 : 48}
      loading="lazy"
      decoding="async"
      className={`${sizeClass} shrink-0 border border-border object-cover bg-surface-container`}
      onError={() => setFailed(true)}
    />
  );
}

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
          className="linkish flex w-full min-w-0 gap-2 text-left font-mono text-xs leading-snug"
          onClick={() => openArticle(article.url)}
        >
          <ArticleThumbnail article={article} />
          <span className="min-w-0 flex-1">
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
      className="linkish flex w-full min-w-0 gap-2 text-left font-mono text-xs leading-snug"
      onClick={() => openArticle(article.url)}
    >
      <ArticleThumbnail article={article} />
      <span className="min-w-0 flex-1">
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
      </span>
    </button>
  );
}

function TopicHoverPreviewPanel({
  topic,
  previewArticle,
  locale,
  previewId,
  placement,
  panelRef,
  onStayOpen,
  onRequestClose,
}: {
  topic: INewsTopicRoundup;
  previewArticle: INewsArticleRef;
  locale: string;
  previewId: string;
  placement: ITopicPreviewPlacementResult;
  panelRef: React.RefObject<HTMLDivElement | null>;
  onStayOpen: () => void;
  onRequestClose: () => void;
}) {
  const synopsis = formatArticleSynopsis(previewArticle);
  const sectionLabel = topic.kind === "reporting" ? "Reporting" : "Preview";

  return (
    <div
      ref={panelRef}
      id={previewId}
      role="tooltip"
      data-hud-no-drag
      className="hud-glass-popover pointer-events-auto fixed z-[1500] w-[20rem] max-w-[min(20rem,calc(100vw-1rem))] p-3"
      style={{
        top: placement.topPx,
        left: placement.leftPx,
      }}
      onPointerEnter={onStayOpen}
      onPointerLeave={onRequestClose}
      onFocus={onStayOpen}
      onBlur={onRequestClose}
    >
      <p className="mb-2 font-display text-[10px] font-bold uppercase tracking-wider text-primary">
        {sectionLabel}
      </p>
      <p className="mb-3 font-mono text-[10px] text-muted">
        Open the article to read the full story.
      </p>
      <button
        type="button"
        className="linkish flex w-full min-w-0 gap-3 text-left"
        onClick={() => openArticle(previewArticle.url)}
      >
        <ArticleThumbnail article={previewArticle} size="lg" />
        <span className="min-w-0 flex-1">
          <TruncatedHudLabel
            text={previewArticle.title}
            className="font-mono text-base leading-snug"
            lines={3}
          />
          <p className="hud-scrollbar mt-2 max-h-24 overflow-y-auto font-mono text-xs leading-relaxed text-on-surface-variant">
            {synopsis}
          </p>
          <span className="mt-2 flex min-w-0 max-w-full flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[10px] text-muted">
            {previewArticle.perspective ? (
              <NewsPerspectiveIcon
                perspective={previewArticle.perspective}
                size={12}
                bias={previewArticle.bias}
                source={previewArticle.source}
                isOpinion={previewArticle.isOpinion}
                role="article"
              />
            ) : null}
            <TruncatedHudLabel
              text={previewArticle.source}
              className="min-w-0 text-[10px] text-muted"
            />
            <span aria-hidden>·</span>
            <span>{formatTopicAge(previewArticle.publishedAt ?? topic.publishedAt, locale)}</span>
          </span>
        </span>
      </button>
    </div>
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

function TopicDetail({
  topic,
  locale,
  previewArticle,
}: {
  topic: INewsTopicRoundup;
  locale: string;
  previewArticle: INewsArticleRef | null;
}) {
  const normalizedTopic = normalizeNewsTopicRoundup(topic);
  const articles = normalizedTopic.articles;
  const slottedUrls = new Set(
    [normalizedTopic.left, normalizedTopic.center, normalizedTopic.right, normalizedTopic.reporting]
      .filter((article): article is INewsArticleRef => article != null)
      .map((article) => article.url),
  );
  const related = articles.filter((article) => !slottedUrls.has(article.url));
  const reportingArticles =
    previewArticle && normalizedTopic.kind === "reporting"
      ? articles.filter((article) => article.url !== previewArticle.url)
      : articles;

  if (normalizedTopic.kind === "reporting") {
    if (reportingArticles.length === 0) return null;
    return (
      <TopicArticleList
        articles={reportingArticles}
        label="More reporting"
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
  const [hoverPreview, setHoverPreview] = useState<IHoverTopicPreview | null>(null);
  const [previewPlacement, setPreviewPlacement] = useState<ITopicPreviewPlacementResult | null>(
    null,
  );
  const [reloadToken, setReloadToken] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const isMountRef = useRef(true);
  const prevCategoryRef = useRef(balancedNewsCategory);
  const widgetSectionRef = useRef<HTMLElement | null>(null);
  const hoverPreviewPanelRef = useRef<HTMLDivElement | null>(null);
  const hoverCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearHoverCloseTimer = useCallback(() => {
    if (hoverCloseTimerRef.current != null) {
      clearTimeout(hoverCloseTimerRef.current);
      hoverCloseTimerRef.current = null;
    }
  }, []);

  const isHoverPreviewTargetHovered = useCallback((): boolean => {
    const widgetEl = widgetSectionRef.current;
    const popoverEl = hoverPreviewPanelRef.current;
    return Boolean(
      (widgetEl && widgetEl.matches(":hover")) || (popoverEl && popoverEl.matches(":hover")),
    );
  }, []);

  const scheduleHoverPreviewClose = useCallback(() => {
    clearHoverCloseTimer();
    hoverCloseTimerRef.current = setTimeout(() => {
      if (isHoverPreviewTargetHovered()) return;
      setHoverPreview(null);
      setPreviewPlacement(null);
    }, TOPIC_PREVIEW_ROLLOFF_DEBOUNCE_MS);
  }, [clearHoverCloseTimer, isHoverPreviewTargetHovered]);

  const openHoverPreview = useCallback(
    (topic: INewsTopicRoundup, anchorEl: HTMLElement) => {
      const previewArticle = resolveTopicPreviewArticle(topic);
      if (!previewArticle) return;
      clearHoverCloseTimer();
      const anchorRect = anchorEl.getBoundingClientRect();
      setPreviewPlacement(
        resolveTopicPreviewPlacement({
          anchorRect,
          previewWidthPx: TOPIC_PREVIEW_WIDTH_PX,
          previewHeightPx: TOPIC_PREVIEW_ESTIMATED_HEIGHT_PX,
          viewportWidthPx: window.innerWidth,
          viewportHeightPx: window.innerHeight,
        }),
      );
      setHoverPreview({ topic, previewArticle, anchorEl });
    },
    [clearHoverCloseTimer],
  );

  const updatePreviewPlacement = useCallback(() => {
    if (!hoverPreview) return;
    const anchorRect = hoverPreview.anchorEl.getBoundingClientRect();
    const measuredHeight =
      hoverPreviewPanelRef.current?.offsetHeight ?? TOPIC_PREVIEW_ESTIMATED_HEIGHT_PX;
    setPreviewPlacement(
      resolveTopicPreviewPlacement({
        anchorRect,
        previewWidthPx: TOPIC_PREVIEW_WIDTH_PX,
        previewHeightPx: measuredHeight,
        viewportWidthPx: window.innerWidth,
        viewportHeightPx: window.innerHeight,
      }),
    );
  }, [hoverPreview]);

  useLayoutEffect(() => {
    if (!hoverPreview) return;
    updatePreviewPlacement();
  }, [hoverPreview, updatePreviewPlacement]);

  useEffect(() => {
    if (!hoverPreview) return;
    const onViewportChange = (): void => {
      updatePreviewPlacement();
    };
    window.addEventListener("resize", onViewportChange);
    window.addEventListener("scroll", onViewportChange, true);
    return () => {
      window.removeEventListener("resize", onViewportChange);
      window.removeEventListener("scroll", onViewportChange, true);
    };
  }, [hoverPreview, updatePreviewPlacement]);

  useEffect(() => () => clearHoverCloseTimer(), [clearHoverCloseTimer]);

  const loadFeed = useCallback(
    (forceRefresh: boolean) => {
      let cancelled = false;
      setErr(null);
      setRateLimitHint(null);
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
      setHoverPreview(null);
      setPreviewPlacement(null);
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

  const hoverPreviewId =
    hoverPreview != null ? `balanced-news-preview-${hoverPreview.topic.id}` : undefined;

  return (
    <>
      <section
        ref={widgetSectionRef}
        className="card flex h-full min-h-0 flex-col gap-3"
        onPointerEnter={clearHoverCloseTimer}
        onPointerLeave={scheduleHoverPreviewClose}
      >
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
              <ul className="m-0 flex list-none flex-col gap-1 p-0" aria-label="Headline topics">
                {snapshot.topics.map((topic) => {
                  const active = topic.id === selectedTopicId;
                  const previewArticle = resolveTopicPreviewArticle(topic);
                  const previewPanelId = `balanced-news-preview-${topic.id}`;
                  return (
                    <li key={topic.id}>
                      <button
                        type="button"
                        aria-selected={active}
                        aria-describedby={
                          hoverPreview?.topic.id === topic.id ? previewPanelId : undefined
                        }
                        className={
                          active
                            ? "btn primary flex w-full min-w-0 items-center gap-2 text-left normal-case tracking-normal ring-2 ring-primary ring-offset-2 ring-offset-surface"
                            : "btn ghost flex w-full min-w-0 items-center gap-2 text-left normal-case tracking-normal"
                        }
                        aria-pressed={active}
                        onClick={() => setSelectedTopicId(topic.id)}
                        onPointerEnter={(e) => openHoverPreview(topic, e.currentTarget)}
                        onFocus={(e) => openHoverPreview(topic, e.currentTarget)}
                        onBlur={(e) => {
                          const next = e.relatedTarget;
                          if (
                            next instanceof Node &&
                            hoverPreviewPanelRef.current?.contains(next)
                          ) {
                            return;
                          }
                          scheduleHoverPreviewClose();
                        }}
                      >
                        {previewArticle ? (
                          <ArticleThumbnail article={previewArticle} />
                        ) : (
                          <span
                            className="h-12 w-12 shrink-0 border border-border bg-surface-container"
                            aria-hidden
                          />
                        )}
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
                <TopicDetail
                  key={selectedTopic.id}
                  topic={selectedTopic}
                  locale={displayLocale}
                  previewArticle={resolveTopicPreviewArticle(selectedTopic)}
                />
              ) : null}
            </>
          ) : null}
        </HudPanelBody>
      </section>
      {hoverPreview != null && previewPlacement != null && typeof document !== "undefined"
        ? createPortal(
            <TopicHoverPreviewPanel
              topic={hoverPreview.topic}
              previewArticle={hoverPreview.previewArticle}
              locale={displayLocale}
              previewId={hoverPreviewId ?? `balanced-news-preview-${hoverPreview.topic.id}`}
              placement={previewPlacement}
              panelRef={hoverPreviewPanelRef}
              onStayOpen={clearHoverCloseTimer}
              onRequestClose={scheduleHoverPreviewClose}
            />,
            document.body,
          )
        : null}
    </>
  );
}
