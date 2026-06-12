import { defineBackground } from "wxt/sandbox";
import browser from "webextension-polyfill";
import { coerceCryptoChartDays } from "../lib/crypto/crypto-chart-days";
import { handleCryptoCoingeckoMarketRowRequest } from "../lib/crypto/crypto-coingecko-background";
import { TABOCALYPSE_CRYPTO_COINGECKO_MARKET_ROW } from "../lib/crypto/crypto-coingecko-message";
import {
  TABOCALYPSE_PRIV_FETCH_BYTES,
  TABOCALYPSE_PRIV_FETCH_JSON,
  TABOCALYPSE_PRIV_FETCH_TEXT,
} from "../lib/privileged-extension-fetch";
import {
  privilegedFetchBytesInBackground,
  privilegedFetchJsonInBackground,
  privilegedFetchTextInBackground,
} from "../lib/privileged-extension-fetch-handler";
import { sendTabocalypseTestNotificationFromBackground } from "../lib/tabocalypse-alarm-notification";
import {
  TABOCALYPSE_ALARM_DELETE,
  TABOCALYPSE_ALARM_SCHEDULE,
  TABOCALYPSE_ALARM_TEST_NOTIFICATION,
} from "../lib/tabocalypse-alarm-message";
import {
  deleteTabocalypseAlarm,
  handleTabocalypseAlarmFired,
  scheduleTabocalypseAlarm,
} from "../lib/tabocalypse-alarm-service";
import { TABOCALYPSE_FEEDBACK_SEND } from "../lib/feedback/feedback-message";
import { handleTabocalypseFeedbackSendRequest } from "../lib/feedback/feedback-background-handler";

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
      whenMs?: unknown;
      message?: unknown;
      existingName?: unknown;
      name?: unknown;
    };
    if (m.type === TABOCALYPSE_ALARM_SCHEDULE) {
      const whenMs = m.whenMs;
      const reminder = m.message;
      if (typeof whenMs === "number" && typeof reminder === "string") {
        const existingName =
          m.existingName === null || m.existingName === undefined
            ? null
            : typeof m.existingName === "string"
              ? m.existingName
              : null;
        return scheduleTabocalypseAlarm({ whenMs, message: reminder, existingName });
      }
    }
    if (m.type === TABOCALYPSE_ALARM_DELETE && typeof m.name === "string") {
      return deleteTabocalypseAlarm(m.name);
    }
    if (m.type === TABOCALYPSE_ALARM_TEST_NOTIFICATION) {
      return sendTabocalypseTestNotificationFromBackground();
    }
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
      const headers =
        m.headers != null && typeof m.headers === "object" && !Array.isArray(m.headers)
          ? (m.headers as Record<string, string>)
          : undefined;
      return privilegedFetchJsonInBackground(m.url, headers);
    }
    if (m.type === TABOCALYPSE_PRIV_FETCH_TEXT && typeof m.url === "string") {
      const headers =
        m.headers != null && typeof m.headers === "object" && !Array.isArray(m.headers)
          ? (m.headers as Record<string, string>)
          : undefined;
      return privilegedFetchTextInBackground(m.url, headers);
    }
    if (m.type === TABOCALYPSE_PRIV_FETCH_BYTES && typeof m.url === "string") {
      return privilegedFetchBytesInBackground(m.url);
    }
    if (m.type === TABOCALYPSE_FEEDBACK_SEND) {
      return handleTabocalypseFeedbackSendRequest(message);
    }
    return undefined;
  });

  browser.alarms.onAlarm.addListener((alarm) => {
    // Return the promise so the MV3 service worker stays alive until the OS notification is created.
    return handleTabocalypseAlarmFired(alarm.name);
  });
});
