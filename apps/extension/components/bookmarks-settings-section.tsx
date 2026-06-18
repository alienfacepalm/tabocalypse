import { ChevronDown, ChevronUp, Eye } from "lucide-react";
import React from "react";
import browser from "webextension-polyfill";
import {
  clearBookmarksStripOrder,
  moveBookmarksStripOrderEntry,
  type TBookmarksStripItem,
  unhideBookmarksStripBookmark,
} from "../lib/bookmarks-strip-preferences";
import { coerceAlarmMetaMessage } from "../lib/alarm-meta-message";
import { faviconUrl } from "../lib/favicon-url";
import { HudTip } from "./hud-tip";

async function fetchBookmarksStripItems(ids: readonly string[]): Promise<TBookmarksStripItem[]> {
  const api = browser.bookmarks;
  if (!api?.get || ids.length === 0) return [];

  const rows = await Promise.all(
    ids.map(async (id) => {
      try {
        const result = await api.get(id);
        const nodes = Array.isArray(result) ? result : [result];
        const node = nodes[0];
        if (!node?.url) return { id } satisfies TBookmarksStripItem;
        return {
          id: node.id,
          title: node.title,
          url: node.url,
        } satisfies TBookmarksStripItem;
      } catch {
        return { id } satisfies TBookmarksStripItem;
      }
    }),
  );

  return rows;
}

function BookmarksSettingsSubAccordion({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  const summaryLabel = count > 0 ? `${title} (${count})` : title;

  return (
    <details className="acc-sub-item">
      <summary className="acc-sub-summary">
        <span className="acc-sub-title">{summaryLabel}</span>
      </summary>
      <div className="acc-sub-body">{children}</div>
    </details>
  );
}

function BookmarkSettingsRow({
  item,
  primaryAction,
}: {
  item: TBookmarksStripItem;
  primaryAction: React.ReactNode;
}) {
  const label = coerceAlarmMetaMessage(item.title as unknown) || item.url || "Bookmark";

  return (
    <li className="flex flex-wrap items-center gap-2 border border-outline/30 p-2">
      <img
        src={faviconUrl(item.url ?? "")}
        alt=""
        width={16}
        height={16}
        className="favicon shrink-0"
      />
      <div className="min-w-0 flex-1">
        <p className="m-0 truncate text-sm">{label}</p>
        {item.url ? (
          <p className="muted m-0 mt-0.5 truncate text-xs normal-case tracking-normal">
            {item.url}
          </p>
        ) : null}
      </div>
      <div className="flex shrink-0 items-center gap-1">{primaryAction}</div>
    </li>
  );
}

export function BookmarksSettingsSection({
  hidden,
  orderIds,
  permissionsEpoch,
  onHiddenChange,
  onOrderIdsChange,
  onOpenOptionalPermissions,
}: {
  hidden: TBookmarksStripItem[];
  orderIds: string[];
  permissionsEpoch: number;
  onHiddenChange: (next: TBookmarksStripItem[]) => void;
  onOrderIdsChange: (next: string[]) => void;
  onOpenOptionalPermissions: () => void;
}) {
  const [hasBookmarkPermission, setHasBookmarkPermission] = React.useState<boolean | null>(null);
  const [orderedItems, setOrderedItems] = React.useState<TBookmarksStripItem[]>([]);
  const [orderLoading, setOrderLoading] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    void browser.permissions.contains({ permissions: ["bookmarks"] }).then((granted) => {
      if (!cancelled) setHasBookmarkPermission(granted);
    });
    return () => {
      cancelled = true;
    };
  }, [permissionsEpoch]);

  React.useEffect(() => {
    if (!hasBookmarkPermission || orderIds.length === 0) {
      setOrderedItems([]);
      return;
    }

    let cancelled = false;
    setOrderLoading(true);
    void fetchBookmarksStripItems(orderIds)
      .then((ordered) => {
        if (!cancelled) setOrderedItems(ordered);
      })
      .finally(() => {
        if (!cancelled) setOrderLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [hasBookmarkPermission, orderIds, permissionsEpoch]);

  if (hasBookmarkPermission === false) {
    return (
      <p className="err">
        Bookmarks need browser permission. Open{" "}
        <HudTip tip="Open Settings and jump to Optional permissions">
          <button
            type="button"
            className="linkish p-0"
            onClick={onOpenOptionalPermissions}
            aria-label="Open Settings and jump to Optional permissions to enable Bookmarks"
          >
            Settings &gt; Optional permissions
          </button>
        </HudTip>{" "}
        and enable Bookmarks.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="muted sm m-0">
        Hide bookmarks from the HUD strip without changing your browser bookmarks. Use the arrows in
        the panel or under Panel order to pin favorites to the top.
      </p>

      <div className="settings-sub-accordion">
        <BookmarksSettingsSubAccordion title="Panel order" count={orderIds.length}>
          {orderIds.length === 0 ? (
            <p className="muted sm m-0">
              No custom order yet. Use the up and down arrows beside a bookmark in the Bookmarks
              panel.
            </p>
          ) : orderLoading ? (
            <p className="muted sm m-0">Loading bookmarks…</p>
          ) : (
            <ul className="m-0 flex list-none flex-col gap-2 p-0">
              {orderedItems.map((item, index) => {
                const cannotMoveUp = index === 0;
                const cannotMoveDown = index >= orderedItems.length - 1;
                return (
                  <BookmarkSettingsRow
                    key={item.id}
                    item={item}
                    primaryAction={
                      <>
                        <HudTip
                          tip={
                            cannotMoveUp
                              ? "Already first in the panel order"
                              : "Move earlier in the panel order"
                          }
                        >
                          <button
                            type="button"
                            className="btn ghost icon-only sm disabled:pointer-events-none"
                            aria-label={
                              cannotMoveUp
                                ? "Bookmark is already first in the panel order"
                                : "Move bookmark earlier in the panel order"
                            }
                            title={cannotMoveUp ? "Already first in the panel order" : undefined}
                            disabled={cannotMoveUp}
                            onClick={() =>
                              onOrderIdsChange(
                                moveBookmarksStripOrderEntry(orderIds, item.id, "up"),
                              )
                            }
                          >
                            <ChevronUp size={18} strokeWidth={2} aria-hidden />
                          </button>
                        </HudTip>
                        <HudTip
                          tip={
                            cannotMoveDown
                              ? "Already last in the panel order"
                              : "Move later in the panel order"
                          }
                        >
                          <button
                            type="button"
                            className="btn ghost icon-only sm disabled:pointer-events-none"
                            aria-label={
                              cannotMoveDown
                                ? "Bookmark is already last in the panel order"
                                : "Move bookmark later in the panel order"
                            }
                            title={cannotMoveDown ? "Already last in the panel order" : undefined}
                            disabled={cannotMoveDown}
                            onClick={() =>
                              onOrderIdsChange(
                                moveBookmarksStripOrderEntry(orderIds, item.id, "down"),
                              )
                            }
                          >
                            <ChevronDown size={18} strokeWidth={2} aria-hidden />
                          </button>
                        </HudTip>
                      </>
                    }
                  />
                );
              })}
            </ul>
          )}
          {orderIds.length > 0 ? (
            <button
              type="button"
              className="btn ghost sm mt-3"
              onClick={() => onOrderIdsChange(clearBookmarksStripOrder())}
            >
              Clear custom order
            </button>
          ) : null}
        </BookmarksSettingsSubAccordion>

        <BookmarksSettingsSubAccordion title="Hidden from panel" count={hidden.length}>
          {hidden.length === 0 ? (
            <p className="muted sm m-0">
              No hidden bookmarks. Use the hide control in the Bookmarks panel.
            </p>
          ) : (
            <ul className="m-0 flex list-none flex-col gap-2 p-0">
              {hidden.map((item) => (
                <BookmarkSettingsRow
                  key={item.id}
                  item={item}
                  primaryAction={
                    <HudTip tip="Show this bookmark in the panel again">
                      <button
                        type="button"
                        className="btn ghost icon-only sm"
                        aria-label="Show bookmark in panel again"
                        onClick={() =>
                          onHiddenChange(unhideBookmarksStripBookmark(hidden, item.id))
                        }
                      >
                        <Eye size={18} strokeWidth={2} aria-hidden />
                      </button>
                    </HudTip>
                  }
                />
              ))}
            </ul>
          )}
        </BookmarksSettingsSubAccordion>
      </div>
    </div>
  );
}
