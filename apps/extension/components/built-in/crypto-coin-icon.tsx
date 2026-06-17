import React, { useState } from "react";
import { resolveCryptoCoinIconUrl } from "../../lib/crypto/crypto-coin-icon-url";
import type { ICryptoWatchlistEntry } from "../../lib/crypto/crypto-watchlist";

export function CryptoCoinIcon({
  entry,
  iconUrl,
  symbol,
  size = "sm",
  className = "",
}: {
  entry?: Pick<ICryptoWatchlistEntry, "coinId" | "iconUrl" | "symbol">;
  iconUrl?: string | null;
  symbol?: string;
  size?: "sm" | "md";
  className?: string;
}) {
  const resolvedSymbol = symbol ?? entry?.symbol ?? "?";
  const resolvedUrl = iconUrl ?? (entry ? resolveCryptoCoinIconUrl(entry) : null);
  const [failed, setFailed] = useState(false);
  const sizeClass = size === "md" ? "h-6 w-6" : "h-5 w-5";
  const px = size === "md" ? 24 : 20;

  if (!resolvedUrl || failed) {
    return (
      <span
        className={`${sizeClass} flex shrink-0 items-center justify-center border border-border bg-surface2 font-display text-[9px] font-bold uppercase leading-none text-muted ${className}`}
        aria-hidden
      >
        {resolvedSymbol.slice(0, 3)}
      </span>
    );
  }

  return (
    <img
      src={resolvedUrl}
      alt=""
      width={px}
      height={px}
      loading="lazy"
      decoding="async"
      className={`${sizeClass} shrink-0 object-contain bg-surface-container ${className}`}
      onError={() => setFailed(true)}
    />
  );
}
