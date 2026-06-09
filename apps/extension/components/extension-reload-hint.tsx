import React from "react";
import {
  detectExtensionHostBrowser,
  getExtensionReloadHint,
  openExtensionManagementPage,
} from "../lib/extension-management-page";

/** Shown when privileged background fetch needs a fresh service worker (e.g. first Balanced news load). */
export function ExtensionReloadHint(): React.JSX.Element {
  const hint = getExtensionReloadHint(detectExtensionHostBrowser());

  if (hint.browser === "safari") {
    return (
      <p className="muted m-0 text-xs leading-relaxed">
        Reload Tabocalypse after enabling this feature: open{" "}
        <strong>Safari → Settings → Extensions</strong>, find <strong>Tabocalypse</strong>, click{" "}
        <strong>Reload</strong>, then open a new tab and try again.
      </p>
    );
  }

  return (
    <p className="muted m-0 text-xs leading-relaxed">
      Reload Tabocalypse after enabling this feature: open{" "}
      {hint.managementPageUrl ? (
        <button
          type="button"
          className="linkish p-0"
          onClick={() => openExtensionManagementPage(hint.browser)}
          aria-label={`Open ${hint.managementPageLabel} in a new tab`}
        >
          {hint.managementPageLabel}
        </button>
      ) : (
        hint.managementPageLabel
      )}
      , search for <strong>Tabocalypse</strong>, click <strong>Reload</strong>, then open a new tab
      and try again.
    </p>
  );
}
