import { describe, expect, it } from "vitest";
import {
  ALARM_PREFIX,
  isTabocalypseAlarm,
  META_KEY,
  removeAlarmMeta,
  TABOCALYPSE_ALARM_NOTIFICATION_ICON,
  tabocalypseAlarmNotificationId,
} from "./alarm-meta";

describe("alarm-meta constants", () => {
  it("ALARM_PREFIX is a non-empty string ending with ':'", () => {
    expect(ALARM_PREFIX.length).toBeGreaterThan(0);
    expect(ALARM_PREFIX.endsWith(":")).toBe(true);
  });

  it("META_KEY is 'alarmMeta'", () => {
    expect(META_KEY).toBe("alarmMeta");
  });
});

describe("isTabocalypseAlarm", () => {
  it("returns true for names starting with the prefix", () => {
    expect(isTabocalypseAlarm(`${ALARM_PREFIX}my-alarm`)).toBe(true);
    expect(isTabocalypseAlarm(`${ALARM_PREFIX}123`)).toBe(true);
  });

  it("returns false for names without the prefix", () => {
    expect(isTabocalypseAlarm("other:alarm")).toBe(false);
    expect(isTabocalypseAlarm("")).toBe(false);
    expect(isTabocalypseAlarm("tabocalyps:almost")).toBe(false);
  });
});

describe("tabocalypseAlarmNotificationId", () => {
  it("prefixes alarm names for stable notification ids", () => {
    expect(tabocalypseAlarmNotificationId("tabocalypse:abc")).toBe("tabocalypse-tabocalypse_abc");
  });
});

describe("TABOCALYPSE_ALARM_NOTIFICATION_ICON", () => {
  it("points at the packaged extension icon path", () => {
    expect(TABOCALYPSE_ALARM_NOTIFICATION_ICON).toBe("icons/128.png");
  });
});

describe("removeAlarmMeta", () => {
  it("removes the entry matching the alarm name", () => {
    const meta = { [`${ALARM_PREFIX}a`]: "msg-a", [`${ALARM_PREFIX}b`]: "msg-b" };
    const result = removeAlarmMeta(meta, `${ALARM_PREFIX}a`);
    expect(result).toEqual({ [`${ALARM_PREFIX}b`]: "msg-b" });
  });

  it("returns the same entries when alarm name is not present", () => {
    const meta = { [`${ALARM_PREFIX}a`]: "msg-a" };
    const result = removeAlarmMeta(meta, `${ALARM_PREFIX}missing`);
    expect(result).toEqual({ [`${ALARM_PREFIX}a`]: "msg-a" });
  });

  it("returns empty object when removing the last entry", () => {
    const meta = { [`${ALARM_PREFIX}only`]: "msg" };
    const result = removeAlarmMeta(meta, `${ALARM_PREFIX}only`);
    expect(result).toEqual({});
  });

  it("does not mutate the original", () => {
    const meta = { [`${ALARM_PREFIX}a`]: "msg-a", [`${ALARM_PREFIX}b`]: "msg-b" };
    const copy = { ...meta };
    removeAlarmMeta(meta, `${ALARM_PREFIX}a`);
    expect(meta).toEqual(copy);
  });
});
