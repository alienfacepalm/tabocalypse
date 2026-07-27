import React, { useEffect, useState } from "react";
import { steamAppCapsuleSmUrl, steamAppHeaderUrl } from "../../lib/steam-charts/steam-app-assets";

/**
 * Small Steam store capsule for a game (CDN asset). Falls back to header, then initials.
 * Does not use the Steam corporate trademark logo.
 */
export function SteamAppCapsule({
  appId,
  name,
  className = "",
}: {
  appId: number;
  name: string;
  className?: string;
}) {
  const capsuleUrl = steamAppCapsuleSmUrl(appId);
  const headerUrl = steamAppHeaderUrl(appId);
  const [src, setSrc] = useState(capsuleUrl);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setSrc(capsuleUrl);
    setFailed(false);
  }, [capsuleUrl]);

  if (failed) {
    const initials = name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? "")
      .join("");
    return (
      <span
        className={`flex h-8 w-[3.75rem] shrink-0 items-center justify-center border border-border bg-surface2 font-display text-[9px] font-bold uppercase leading-none text-muted ${className}`}
        aria-hidden
      >
        {initials || "?"}
      </span>
    );
  }

  return (
    <img
      src={src}
      alt=""
      width={60}
      height={32}
      loading="lazy"
      decoding="async"
      className={`h-8 w-[3.75rem] shrink-0 border border-border object-cover bg-surface-container ${className}`}
      onError={() => {
        if (src === capsuleUrl) {
          setSrc(headerUrl);
          return;
        }
        setFailed(true);
      }}
    />
  );
}
