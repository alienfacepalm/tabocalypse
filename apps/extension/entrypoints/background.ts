import { defineBackground } from "wxt/sandbox";
import browser from "webextension-polyfill";

const ALARM_PREFIX = "tabocalypse:";
const META_KEY = "alarmMeta";

type TAlarmMeta = Record<string, string>;

async function getMeta(): Promise<TAlarmMeta> {
  const r = await browser.storage.local.get(META_KEY);
  return ((r[META_KEY] as TAlarmMeta) ?? {}) as TAlarmMeta;
}

export default defineBackground(() => {
  browser.alarms.onAlarm.addListener(async (alarm) => {
    if (!alarm.name.startsWith(ALARM_PREFIX)) return;
    const meta = await getMeta();
    const message = meta[alarm.name] ?? "Tabocalypse alarm.";
    const { [alarm.name]: _, ...rest } = meta;
    await browser.storage.local.set({ [META_KEY]: rest });

    try {
      await browser.notifications.create(`tabocalypse-${alarm.name}`, {
        type: "basic",
        title: "Tabocalypse",
        message,
      });
    } catch {
      // notifications may fail without permission on some builds
    }
  });
});
