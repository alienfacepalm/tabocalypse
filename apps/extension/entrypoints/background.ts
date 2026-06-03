import { defineBackground } from "wxt/sandbox";
import browser from "webextension-polyfill";
import { ALARM_PREFIX, META_KEY, removeAlarmMeta, type TAlarmMeta } from "../lib/alarm-meta";
import { coerceAlarmMetaMessage } from "../lib/alarm-meta-message";
import { coerceCryptoChartDays } from "../lib/crypto/crypto-chart-days";
import { handleCryptoCoingeckoMarketRowRequest } from "../lib/crypto/crypto-coingecko-background";
import { TABOCALYPSE_CRYPTO_COINGECKO_MARKET_ROW } from "../lib/crypto/crypto-coingecko-message";
import {
  coercePrivilegedFetchJsonHeaders,
  TABOCALYPSE_PRIV_FETCH_BYTES,
  TABOCALYPSE_PRIV_FETCH_JSON,
} from "../lib/privileged-extension-fetch";
import {
  privilegedFetchBytesInBackground,
  privilegedFetchJsonInBackground,
} from "../lib/privileged-extension-fetch-handler";

async function getMeta(): Promise<TAlarmMeta> {
  const r = await browser.storage.local.get(META_KEY);
  return ((r[META_KEY] as TAlarmMeta) ?? {}) as TAlarmMeta;
}

export default defineBackground(() => {
  browser.runtime.onMessage.addListener((message: unknown) => {
    if (!message || typeof message !== "object" || !("type" in message)) return undefined;
    const m = message as {
      type: unknown;
      url?: unknown;
      headers?: unknown;
      coinId?: unknown;
      ticker?: unknown;
      days?: unknown;
    };
    if (m.type === TABOCALYPSE_CRYPTO_COINGECKO_MARKET_ROW) {
      const coinId = m.coinId;
      const ticker = m.ticker;
      const daysRaw = m.days;
      const pairOk =
        (coinId === "bitcoin" && ticker === "BTC") || (coinId === "ethereum" && ticker === "ETH");
      if (pairOk && typeof daysRaw === "number") {
        const days = coerceCryptoChartDays(daysRaw, 7);
        return handleCryptoCoingeckoMarketRowRequest({
          type: TABOCALYPSE_CRYPTO_COINGECKO_MARKET_ROW,
          coinId,
          ticker,
          days,
        });
      }
    }
    if (m.type === TABOCALYPSE_PRIV_FETCH_JSON && typeof m.url === "string") {
      const rawHeaders =
        m.headers != null && typeof m.headers === "object" && !Array.isArray(m.headers)
          ? (m.headers as Record<string, string>)
          : undefined;
      const headers = coercePrivilegedFetchJsonHeaders(m.url, rawHeaders);
      return privilegedFetchJsonInBackground(m.url, headers);
    }
    if (m.type === TABOCALYPSE_PRIV_FETCH_BYTES && typeof m.url === "string") {
      return privilegedFetchBytesInBackground(m.url);
    }
    return undefined;
  });

  browser.alarms.onAlarm.addListener(async (alarm) => {
    if (!alarm.name.startsWith(ALARM_PREFIX)) return;
    const meta = await getMeta();
    const message = coerceAlarmMetaMessage(meta[alarm.name]) || "Tabocalypse alarm.";
    await browser.storage.local.set({ [META_KEY]: removeAlarmMeta(meta, alarm.name) });

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
