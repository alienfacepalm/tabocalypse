import type React from "react";

export function BingWallpaperFooterAttribution({
  caption,
}: {
  caption: string;
}): React.JSX.Element {
  return (
    <p className="footer-wallpaper-attribution" aria-live="polite">
      {caption}
    </p>
  );
}
