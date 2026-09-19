import React, { useCallback, useMemo } from "react";
import {
  CRYPTO_SEARCH_DEBOUNCE_MS,
  fetchCryptoSearchHits,
  MIN_CRYPTO_SEARCH_QUERY_LENGTH,
  type ICryptoSearchHit,
} from "../../lib/crypto/fetch-crypto-search";
import { withResolvedCryptoCoinIcon } from "../../lib/crypto/crypto-coin-icon-url";
import type { ICryptoWatchlistEntry } from "../../lib/crypto/crypto-watchlist";
import { MAX_CRYPTO_WATCHLIST } from "../../lib/crypto/crypto-watchlist";
import { CryptoCoinIcon } from "./crypto-coin-icon";
import { WatchlistAddField, type IWatchlistAddFieldLabels } from "./watchlist-add-field";

const CRYPTO_ADD_FIELD_LABELS: IWatchlistAddFieldLabels = {
  placeholder: "Add a coin by name or symbol",
  inputAriaLabel: "Add coin to watchlist",
  listAriaLabel: "CoinGecko coin matches",
  submitAriaLabel: "Add coin",
  submitTip: "Add the highlighted coin match to your watchlist",
  searching: "Searching coins…",
  searchFailed: "Could not search coins",
  full: `Watchlist full (${MAX_CRYPTO_WATCHLIST} coins). Remove one to add another.`,
};

function cryptoHitId(hit: ICryptoSearchHit): string {
  return hit.coinId;
}

function renderCryptoHitIcon(hit: ICryptoSearchHit): React.ReactNode {
  return (
    <CryptoCoinIcon
      entry={{ coinId: hit.coinId, symbol: hit.symbol, iconUrl: hit.iconUrl }}
      size="sm"
    />
  );
}

export function CryptoWatchlistAddField({
  watchlist,
  onAdd,
}: {
  watchlist: readonly ICryptoWatchlistEntry[];
  onAdd: (entry: ICryptoWatchlistEntry) => void;
}) {
  const existingIds = useMemo(() => new Set(watchlist.map((e) => e.coinId)), [watchlist]);

  const addHit = useCallback(
    (hit: ICryptoSearchHit) => {
      onAdd(
        withResolvedCryptoCoinIcon({
          coinId: hit.coinId,
          symbol: hit.symbol,
          ...(hit.iconUrl ? { iconUrl: hit.iconUrl } : {}),
        }),
      );
    },
    [onAdd],
  );

  return (
    <WatchlistAddField
      existingIds={existingIds}
      atLimit={watchlist.length >= MAX_CRYPTO_WATCHLIST}
      minQueryLength={MIN_CRYPTO_SEARCH_QUERY_LENGTH}
      debounceMs={CRYPTO_SEARCH_DEBOUNCE_MS}
      labels={CRYPTO_ADD_FIELD_LABELS}
      hitId={cryptoHitId}
      searchHits={fetchCryptoSearchHits}
      onAddHit={addHit}
      renderHitIcon={renderCryptoHitIcon}
    />
  );
}
