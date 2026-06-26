import React from "react";
import { isMacOsHost } from "../../lib/extension-host-platform";
import {
  isTabocalypseAlarmMacSafariUnsupported,
  listTabocalypseAlarmMacSetupHints,
  TABOCALYPSE_ALARM_MAC_SAFARI_UNSUPPORTED_MESSAGE,
} from "../../lib/tabocalypse-alarm-mac-hints";

/** macOS-only setup notes when the user opens Clock alarms. */
export function ClockAlarmsMacHints(): React.JSX.Element | null {
  if (!isMacOsHost()) return null;

  if (isTabocalypseAlarmMacSafariUnsupported()) {
    return (
      <div
        className="rounded border border-solid border-accent/35 bg-black/25 px-3 py-2"
        role="note"
        aria-label="Mac clock alarm limitations in Safari"
      >
        <p className="font-display m-0 text-xs uppercase tracking-wide text-accent">
          Mac notifications
        </p>
        <p className="err sm m-0 mt-2">{TABOCALYPSE_ALARM_MAC_SAFARI_UNSUPPORTED_MESSAGE}</p>
      </div>
    );
  }

  const hints = listTabocalypseAlarmMacSetupHints();

  return (
    <div
      className="rounded border border-solid border-accent/35 bg-black/25 px-3 py-2"
      role="note"
      aria-label="Mac clock alarm notification setup"
    >
      <p className="font-display m-0 text-xs uppercase tracking-wide text-accent">
        Mac notifications
      </p>
      <ul className="muted sm m-0 mt-2 grid list-disc gap-1 pl-4">
        {hints.map((hint) => (
          <li key={hint.text}>{hint.text}</li>
        ))}
      </ul>
    </div>
  );
}
