import { RotateCw } from "lucide-react";
import React from "react";
import { shouldShowPrivilegedFetchReloadHint } from "../lib/privileged-extension-fetch";
import { ExtensionReloadHint } from "./extension-reload-hint";
import { HudTip } from "./hud-tip";

export function PrivilegedFetchErrorPanel({
  message,
  onRetry,
  retryTip,
  retryAriaLabel,
}: {
  message: string;
  onRetry: () => void;
  retryTip: string;
  retryAriaLabel: string;
}) {
  return (
    <div className="flex flex-col gap-3">
      <p className="err">{message}</p>
      {shouldShowPrivilegedFetchReloadHint(message) ? <ExtensionReloadHint /> : null}
      <div className="flex w-full flex-wrap items-center gap-2 pb-1">
        <HudTip tip={retryTip}>
          <button
            type="button"
            className="btn primary sm"
            onClick={onRetry}
            aria-label={retryAriaLabel}
          >
            <RotateCw size={16} strokeWidth={2} aria-hidden />
            Retry
          </button>
        </HudTip>
      </div>
    </div>
  );
}
