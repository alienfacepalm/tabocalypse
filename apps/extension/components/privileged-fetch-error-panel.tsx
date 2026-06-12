import { RotateCw } from "lucide-react";
import React from "react";
import { resolvePrivilegedFetchUserMessage } from "../lib/privileged-fetch-user-message";
import { ExtensionReloadHint } from "./extension-reload-hint";
import { HudTip } from "./hud-tip";

export function PrivilegedFetchErrorPanel({
  message,
  onRetry,
  retryTip,
  retryAriaLabel,
  supplement,
}: {
  message: string;
  onRetry: () => void;
  retryTip: string;
  retryAriaLabel: string;
  supplement?: React.ReactNode;
}) {
  const resolved = resolvePrivilegedFetchUserMessage(message);

  return (
    <div className="flex flex-col gap-3">
      <p className="err">{resolved.userMessage}</p>
      {resolved.showReloadHint ? <ExtensionReloadHint /> : null}
      {resolved.showTechnicalDetail && resolved.technicalDetail ? (
        <p className="muted mb-0 font-mono text-[10px] leading-relaxed">
          {resolved.technicalDetail}
        </p>
      ) : null}
      {supplement}
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
