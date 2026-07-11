import { Bell, Calendar, CalendarClock, Pencil, Trash2 } from "lucide-react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import browser from "webextension-polyfill";
import {
  defaultAlarmWhenLocal,
  formatAlarmScheduledLabel,
  formatDatetimeLocalFromDate,
} from "../../lib/alarm-datetime";
import { coerceAlarmMetaMessage } from "../../lib/alarm-meta-message";
import type { TClockHourFormat } from "../../lib/clock-hour-format";
import {
  deleteTabocalypseAlarmViaBackground,
  scheduleTabocalypseAlarmViaBackground,
} from "../../lib/tabocalypse-alarm-client";
import {
  getTabocalypseAlarmTestSuccessMessage,
  getTabocalypseNotificationDeniedMessage,
} from "../../lib/tabocalypse-alarm-mac-hints";
import {
  getTabocalypseNotificationPermissionLevel,
  hasNativeExtensionNotificationsApi,
  sendTabocalypseTestNotification,
  type TNotificationPermissionLevel,
} from "../../lib/tabocalypse-alarm-notification";
import { ClockAlarmsMacHints } from "./clock-alarms-mac-hints";
import {
  listTabocalypseAlarms,
  type ITabocalypsePendingAlarm,
} from "../../lib/tabocalypse-alarm-service";
import { TABOCALYPSE_ALARM_DEFAULT_MESSAGE } from "../../lib/tabocalypse-alarm-validation";
import { PanelTip as HudTip } from "../panel-sdk";

type TAlarmScheduleBanner = { kind: "ok" | "err"; message: string };

function formatAlarmReminderForList(raw: unknown): string | null {
  const line = coerceAlarmMetaMessage(raw).trim();
  if (!line) return null;
  if (/^Tabocalypse alarm\.?$/.test(line)) return null;
  return line;
}

export function ClockAlarmsSection({
  locale,
  hourFormat,
}: {
  locale: string;
  hourFormat: TClockHourFormat;
}) {
  const [alarmWhen, setAlarmWhen] = useState("");
  const [alarmMessage, setAlarmMessage] = useState("");
  const [alarmScheduleBanner, setAlarmScheduleBanner] = useState<TAlarmScheduleBanner | null>(null);
  const [pendingAlarms, setPendingAlarms] = useState<ITabocalypsePendingAlarm[]>([]);
  const [editingAlarmName, setEditingAlarmName] = useState<string | null>(null);
  const [alarmDatetimeMin, setAlarmDatetimeMin] = useState(() =>
    formatDatetimeLocalFromDate(new Date()),
  );
  const [notificationPermission, setNotificationPermission] =
    useState<TNotificationPermissionLevel>("unknown");
  const [testNotificationBusy, setTestNotificationBusy] = useState(false);
  const alarmWhenInputRef = useRef<HTMLInputElement>(null);

  const refreshPendingAlarms = useCallback(async () => {
    try {
      setPendingAlarms(await listTabocalypseAlarms());
    } catch {
      // alarms API unavailable outside extension context
    }
  }, []);

  useEffect(() => {
    setAlarmWhen((prev) => (prev ? prev : defaultAlarmWhenLocal()));
    void refreshPendingAlarms();
    void getTabocalypseNotificationPermissionLevel().then(setNotificationPermission);
  }, [refreshPendingAlarms]);

  useEffect(() => {
    const tickMin = window.setInterval(() => {
      setAlarmDatetimeMin(formatDatetimeLocalFromDate(new Date()));
    }, 60_000);
    return () => window.clearInterval(tickMin);
  }, []);

  useEffect(() => {
    const onStorageChanged = (
      changes: Record<string, { oldValue?: unknown; newValue?: unknown }>,
      areaName: string,
    ) => {
      if (areaName === "local" && changes.alarmMeta !== undefined) {
        void refreshPendingAlarms();
      }
    };
    browser.storage.onChanged.addListener(onStorageChanged);
    return () => browser.storage.onChanged.removeListener(onStorageChanged);
  }, [refreshPendingAlarms]);

  const openAlarmWhenPicker = useCallback(() => {
    const el = alarmWhenInputRef.current;
    if (!el) return;
    const pick = el.showPicker;
    if (typeof pick === "function") {
      void Promise.resolve(pick.call(el)).catch(() => {
        el.focus();
      });
    } else {
      el.focus();
    }
  }, []);

  const scheduleAlarm = async () => {
    setAlarmScheduleBanner(null);
    const raw = alarmWhen.trim();
    if (!raw) {
      setAlarmScheduleBanner({
        kind: "err",
        message: "Choose a date and time first (or use the calendar button).",
      });
      return;
    }
    const whenMs = new Date(raw).getTime();
    if (Number.isNaN(whenMs)) {
      setAlarmScheduleBanner({
        kind: "err",
        message: "That date and time is not valid.",
      });
      return;
    }
    if (whenMs < Date.now()) {
      setAlarmScheduleBanner({
        kind: "err",
        message: "Pick a time in the future.",
      });
      return;
    }
    const isEdit = editingAlarmName !== null;
    const result = await scheduleTabocalypseAlarmViaBackground({
      whenMs,
      message: alarmMessage,
      existingName: editingAlarmName,
    });
    if (!result.ok) {
      setAlarmScheduleBanner({
        kind: "err",
        message: result.error,
      });
      return;
    }
    setAlarmMessage("");
    setAlarmWhen("");
    setEditingAlarmName(null);
    const permission = await getTabocalypseNotificationPermissionLevel();
    setNotificationPermission(permission);
    const permissionNote =
      permission === "denied" ? ` ${getTabocalypseNotificationDeniedMessage()}` : "";
    setAlarmScheduleBanner({
      kind: permission === "denied" ? "err" : "ok",
      message: isEdit
        ? permission === "denied"
          ? `Alarm updated, but notifications are blocked.${permissionNote}`
          : "Alarm updated."
        : permission === "denied"
          ? `Scheduled, but notifications are blocked — you may not see a reminder.${permissionNote}`
          : "Scheduled. System notification at that time — you can close this tab.",
    });
    void refreshPendingAlarms();
    window.setTimeout(() => {
      setAlarmScheduleBanner((b) => (b?.kind === "ok" ? null : b));
    }, 6000);
  };

  const deleteAlarm = async (name: string) => {
    await deleteTabocalypseAlarmViaBackground(name);
    if (editingAlarmName === name) {
      setEditingAlarmName(null);
      setAlarmWhen(defaultAlarmWhenLocal());
      setAlarmMessage("");
    }
    void refreshPendingAlarms();
  };

  const startEditAlarm = (alarm: ITabocalypsePendingAlarm) => {
    setEditingAlarmName(alarm.name);
    setAlarmWhen(formatDatetimeLocalFromDate(new Date(alarm.scheduledTime)));
    setAlarmMessage(
      alarm.message === TABOCALYPSE_ALARM_DEFAULT_MESSAGE
        ? ""
        : coerceAlarmMetaMessage(alarm.message),
    );
    setAlarmScheduleBanner(null);
  };

  const cancelEdit = () => {
    setEditingAlarmName(null);
    setAlarmWhen(defaultAlarmWhenLocal());
    setAlarmMessage("");
    setAlarmScheduleBanner(null);
  };

  const runTestNotification = async () => {
    setTestNotificationBusy(true);
    setAlarmScheduleBanner(null);
    try {
      if (!hasNativeExtensionNotificationsApi()) {
        setAlarmScheduleBanner({
          kind: "err",
          message:
            "System notifications are unavailable in this browser context. Reload the extension and try again.",
        });
        return;
      }
      const result = await sendTabocalypseTestNotification(alarmMessage);
      if (!result.ok) {
        setAlarmScheduleBanner({ kind: "err", message: result.error });
        return;
      }
      setAlarmScheduleBanner({
        kind: "ok",
        message: getTabocalypseAlarmTestSuccessMessage(),
      });
      window.setTimeout(() => {
        setAlarmScheduleBanner((b) => (b?.kind === "ok" ? null : b));
      }, 8000);
    } finally {
      setTestNotificationBusy(false);
      void getTabocalypseNotificationPermissionLevel().then(setNotificationPermission);
    }
  };

  const alarmSummaryLabel =
    pendingAlarms.length > 0 ? `Alarms (${pendingAlarms.length} scheduled)` : "Alarms";

  return (
    <details
      className="clock-alarms mt-3 border-t border-border pt-3"
      open={editingAlarmName !== null}
    >
      <summary className="cursor-pointer font-display text-sm uppercase tracking-wide text-accent">
        {alarmSummaryLabel}
      </summary>
      <div className="mt-3 grid gap-3">
        <p className="muted sm m-0">
          One-time reminders via system notification. The extension background tracks the time — you
          do not need to keep this tab open.
        </p>
        <ClockAlarmsMacHints />
        {notificationPermission === "denied" ? (
          <p className="err sm m-0" role="status">
            {getTabocalypseNotificationDeniedMessage()}
          </p>
        ) : null}
        <div className="grid gap-2">
          <HudTip tip="Send a test OS notification now to verify browser and system notification settings">
            <button
              type="button"
              className="btn sm has-icon"
              disabled={testNotificationBusy}
              onClick={() => void runTestNotification()}
            >
              <Bell size={18} strokeWidth={2} aria-hidden />
              <span>{testNotificationBusy ? "Sending…" : "Test notification"}</span>
            </button>
          </HudTip>
          {alarmScheduleBanner ? (
            <p
              role="status"
              className={
                alarmScheduleBanner.kind === "err" ? "err sm m-0" : "m-0 text-sm text-accent"
              }
            >
              {alarmScheduleBanner.message}
            </p>
          ) : null}
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void scheduleAlarm();
          }}
          className="grid gap-3"
        >
          <label className="block">
            <span className="muted sm">Date and time</span>
            <div className="mt-1 flex gap-2">
              <input
                ref={alarmWhenInputRef}
                id="tabocalypse-clock-alarm-when"
                type="datetime-local"
                step={60}
                min={alarmDatetimeMin}
                className="min-w-0 flex-1"
                value={alarmWhen}
                onChange={(e) => {
                  setAlarmWhen(e.target.value);
                  setAlarmScheduleBanner((b) => (b?.kind === "err" ? null : b));
                }}
                aria-label="Alarm date and time"
              />
              <HudTip tip="Open the date and time picker">
                <button
                  type="button"
                  className="btn ghost sm icon-only shrink-0"
                  aria-label="Open date and time picker"
                  onClick={() => openAlarmWhenPicker()}
                >
                  <Calendar size={18} strokeWidth={2} aria-hidden />
                </button>
              </HudTip>
            </div>
          </label>
          <label className="block">
            <span className="muted sm">Message (optional)</span>
            <input
              id="tabocalypse-clock-alarm-msg"
              type="text"
              placeholder="What the notification should say"
              className="mt-1 w-full"
              value={alarmMessage}
              onChange={(e) => {
                setAlarmMessage(e.target.value);
                setAlarmScheduleBanner((b) => (b?.kind === "err" ? null : b));
              }}
              aria-label="Alarm notification message"
            />
          </label>
          <div className="flex items-center gap-2">
            <HudTip
              tip={
                editingAlarmName
                  ? "Save changes to this alarm"
                  : "Save this one-time reminder using the time and message above"
              }
            >
              <button type="submit" className="btn primary has-icon sm">
                <CalendarClock size={18} strokeWidth={2} aria-hidden />
                <span>{editingAlarmName ? "Update" : "Schedule"}</span>
              </button>
            </HudTip>
            {editingAlarmName ? (
              <button type="button" className="btn ghost sm" onClick={cancelEdit}>
                Cancel
              </button>
            ) : null}
          </div>
        </form>
        {pendingAlarms.length > 0 ? (
          <>
            <h4 className="mb-1 mt-1 text-sm">Scheduled</h4>
            <ul className="grid gap-2" style={{ listStyle: "none", padding: 0 }}>
              {pendingAlarms.map((alarm) => {
                const reminderLine = formatAlarmReminderForList(alarm.message);
                return (
                  <li
                    key={alarm.name}
                    className={`flex items-center gap-2 rounded border px-2 py-1.5 text-sm${editingAlarmName === alarm.name ? " border-accent" : ""}`}
                  >
                    <div className="min-w-0 flex-1">
                      <span className="font-mono text-xs opacity-70">
                        {formatAlarmScheduledLabel(
                          new Date(alarm.scheduledTime),
                          locale,
                          hourFormat,
                        )}
                      </span>
                      {reminderLine ? <span className="ml-2">{reminderLine}</span> : null}
                    </div>
                    <HudTip tip="Edit this alarm">
                      <button
                        type="button"
                        className="btn ghost sm icon-only"
                        aria-label="Edit alarm"
                        onClick={() => startEditAlarm(alarm)}
                      >
                        <Pencil size={16} strokeWidth={2} aria-hidden />
                      </button>
                    </HudTip>
                    <HudTip tip="Delete this alarm">
                      <button
                        type="button"
                        className="btn ghost sm icon-only"
                        aria-label="Delete alarm"
                        onClick={() => void deleteAlarm(alarm.name)}
                      >
                        <Trash2 size={16} strokeWidth={2} aria-hidden />
                      </button>
                    </HudTip>
                  </li>
                );
              })}
            </ul>
          </>
        ) : null}
      </div>
    </details>
  );
}
