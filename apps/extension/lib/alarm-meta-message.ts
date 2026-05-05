/**
 * `alarmMeta` in storage is intended to map alarm ids to reminder strings.
 * Legacy or corrupt entries may contain objects (e.g. `{ title, message }`).
 * Coerce before rendering in React or passing to `notifications.create`.
 */
export function coerceAlarmMetaMessage(value: unknown): string {
  if (typeof value === "string") return value;

  if (value != null && typeof value === "object" && !Array.isArray(value)) {
    const rec = value as Record<string, unknown>;
    const titlePart = typeof rec.title === "string" ? rec.title.trim() : "";
    const msgPart = typeof rec.message === "string" ? rec.message.trim() : "";
    if (titlePart && msgPart) return `${titlePart}: ${msgPart}`;
    if (msgPart) return msgPart;
    if (titlePart) return titlePart;
  }

  if (value == null) return "";
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}
