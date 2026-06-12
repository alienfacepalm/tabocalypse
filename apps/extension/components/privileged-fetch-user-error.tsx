import React from "react";
import { resolvePrivilegedFetchUserMessage } from "../lib/privileged-fetch-user-message";
import { ExtensionReloadHint } from "./extension-reload-hint";

export function PrivilegedFetchUserError({
  error,
  className = "muted sm mt-0",
}: {
  error: string;
  className?: string;
}): React.JSX.Element {
  const resolved = resolvePrivilegedFetchUserMessage(error);

  return (
    <div className={className}>
      <p className="m-0">{resolved.userMessage}</p>
      {resolved.showReloadHint ? (
        <div className="mt-2">
          <ExtensionReloadHint />
        </div>
      ) : null}
      {resolved.showTechnicalDetail && resolved.technicalDetail ? (
        <p className="muted sm mb-0 mt-2 font-mono text-[10px] leading-relaxed">
          {resolved.technicalDetail}
        </p>
      ) : null}
    </div>
  );
}
