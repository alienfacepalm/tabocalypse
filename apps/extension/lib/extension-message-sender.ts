import type { Runtime } from "webextension-polyfill";
import browser from "webextension-polyfill";

/** True when the message sender is this extension (same `runtime.id`). */
export function isTrustedExtensionSender(sender: Runtime.MessageSender | undefined): boolean {
  try {
    const myId = browser.runtime.id;
    if (!myId || !sender?.id) return false;
    return sender.id === myId;
  } catch {
    return false;
  }
}
