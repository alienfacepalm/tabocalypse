import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const browserNotificationsCreate = vi.fn();
const getManifest = vi.fn(() => ({ icons: { "128": "icons/128.png" } }));
const getURL = vi.fn((path: string) => `chrome-extension://unit-test/${path}`);

const NOTIFICATION_CREATE_TIMEOUT_MS = 12_000;

vi.mock("webextension-polyfill", () => ({
  default: {
    runtime: {
      getManifest,
      getURL,
      id: "unit-test",
    },
    notifications: {
      create: (...args: unknown[]) => browserNotificationsCreate(...args),
      getPermissionLevel: undefined,
    },
  },
}));

vi.mock("./privileged-extension-fetch", () => ({
  extensionRuntimeSendMessage: vi.fn(),
}));

describe("buildTabocalypseNotificationOptionSets", () => {
  beforeEach(async () => {
    vi.resetModules();
    vi.unstubAllGlobals();
    getManifest.mockReturnValue({ icons: { "128": "icons/128.png" } });
    getURL.mockImplementation((path: string) => `chrome-extension://unit-test/${path}`);
    browserNotificationsCreate.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("includes the root notification icon path for MV3 service workers", async () => {
    vi.stubGlobal("importScripts", () => undefined);

    const { buildTabocalypseNotificationOptionSets } =
      await import("./tabocalypse-alarm-notification");
    const [first] = buildTabocalypseNotificationOptionSets("hello");
    expect(first?.iconUrl).toBe("notification-icon.png");
    expect(first?.message).toBe("hello");
  });

  it("prefers runtime.getURL icon paths on extension HTML pages", async () => {
    vi.stubGlobal("self", globalThis);

    const { buildTabocalypseNotificationOptionSets } =
      await import("./tabocalypse-alarm-notification");
    const [first] = buildTabocalypseNotificationOptionSets("hello");
    expect(first?.iconUrl).toBe("chrome-extension://unit-test/notification-icon.png");
  });
});

describe("createTabocalypseNotificationOnce", () => {
  beforeEach(async () => {
    vi.resetModules();
    vi.unstubAllGlobals();
    browserNotificationsCreate.mockReset();
    getURL.mockImplementation((path: string) => `chrome-extension://unit-test/${path}`);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("uses the Chrome MV3 promise API with two arguments (no callback)", async () => {
    const create = vi.fn((_id: string, options: { iconUrl: string }) => {
      expect(options.iconUrl).toBe("notification-icon.png");
      return Promise.resolve("generated-id");
    });
    vi.stubGlobal("chrome", { runtime: {}, notifications: { create } });

    const { createTabocalypseNotificationOnce } = await import("./tabocalypse-alarm-notification");
    await expect(
      createTabocalypseNotificationOnce("", {
        type: "basic",
        title: "Tabocalypse",
        message: "hello",
        iconUrl: "notification-icon.png",
      }),
    ).resolves.toBe("generated-id");
    expect(create).toHaveBeenCalledTimes(1);
    expect(create.mock.calls[0]?.length).toBe(2);
  });

  it("falls back to browser.notifications when Chrome promise API is unavailable", async () => {
    browserNotificationsCreate.mockResolvedValue("polyfill-id");

    const { createTabocalypseNotificationOnce } = await import("./tabocalypse-alarm-notification");
    await expect(
      createTabocalypseNotificationOnce("", {
        type: "basic",
        title: "Tabocalypse",
        message: "hello",
        iconUrl: "notification-icon.png",
      }),
    ).resolves.toBe("polyfill-id");
    expect(browserNotificationsCreate).toHaveBeenCalledOnce();
  });

  it("tries the next icon option when the first create attempt throws", async () => {
    browserNotificationsCreate.mockReturnValue(undefined);
    const create = vi
      .fn()
      .mockRejectedValueOnce(new Error("Unable to download all specified images."))
      .mockResolvedValueOnce("second-id");
    vi.stubGlobal("chrome", { runtime: {}, notifications: { create } });

    const mod = await import("./tabocalypse-alarm-notification");
    vi.spyOn(mod, "buildTabocalypseNotificationOptionSets").mockReturnValue([
      {
        type: "basic",
        title: "Tabocalypse",
        message: "Reminder",
        iconUrl: "bad.png",
      },
      {
        type: "basic",
        title: "Tabocalypse",
        message: "Reminder",
        iconUrl: "good.png",
      },
    ]);

    vi.useFakeTimers();
    const pending = mod.showTabocalypseAlarmNotification("alarm-1", "Reminder");
    await vi.advanceTimersByTimeAsync(750);
    await expect(pending).resolves.toEqual({ ok: true });
    vi.useRealTimers();
    expect(create).toHaveBeenCalledTimes(2);
  });
});

describe("sendTabocalypseTestNotification", () => {
  beforeEach(async () => {
    vi.resetModules();
    vi.unstubAllGlobals();
    browserNotificationsCreate.mockReset();
    getURL.mockImplementation((path: string) => `chrome-extension://unit-test/${path}`);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("returns ok when the page context can create a notification", async () => {
    browserNotificationsCreate.mockResolvedValue("test-id");

    const { sendTabocalypseTestNotification } = await import("./tabocalypse-alarm-notification");
    const { extensionRuntimeSendMessage } = await import("./privileged-extension-fetch");

    vi.useFakeTimers();
    const pending = sendTabocalypseTestNotification();
    await vi.advanceTimersByTimeAsync(750);
    await expect(pending).resolves.toEqual({ ok: true });
    expect(extensionRuntimeSendMessage).not.toHaveBeenCalled();
    vi.useRealTimers();
  });

  it("falls back to the background handler when the page context fails", async () => {
    browserNotificationsCreate.mockRejectedValue(new Error("page create failed"));
    const { extensionRuntimeSendMessage } = await import("./privileged-extension-fetch");
    vi.mocked(extensionRuntimeSendMessage).mockResolvedValue({ ok: true });

    const { sendTabocalypseTestNotification } = await import("./tabocalypse-alarm-notification");

    vi.useFakeTimers();
    const pending = sendTabocalypseTestNotification();
    await vi.advanceTimersByTimeAsync(750);
    await expect(pending).resolves.toEqual({ ok: true });
    expect(extensionRuntimeSendMessage).toHaveBeenCalledWith({
      type: "tabocalypse/alarmTestNotification",
    });
    vi.useRealTimers();
  });

  it("times out when notifications.create never settles", async () => {
    browserNotificationsCreate.mockReturnValue(new Promise(() => undefined));

    const { createTabocalypseNotificationOnce } = await import("./tabocalypse-alarm-notification");
    vi.useFakeTimers();
    const pending = createTabocalypseNotificationOnce("", {
      type: "basic",
      title: "Tabocalypse",
      message: "hello",
      iconUrl: "notification-icon.png",
    });
    const assertion = expect(pending).rejects.toThrow(
      /Timed out waiting for the system notification API/,
    );
    await vi.advanceTimersByTimeAsync(NOTIFICATION_CREATE_TIMEOUT_MS + 1);
    await assertion;
    vi.useRealTimers();
  });
});

describe("isTabocalypseNotificationPermissionError", () => {
  it("detects permission-related Chrome errors", async () => {
    const { isTabocalypseNotificationPermissionError } =
      await import("./tabocalypse-alarm-notification");
    expect(isTabocalypseNotificationPermissionError("Notifications are not allowed")).toBe(true);
    expect(isTabocalypseNotificationPermissionError("Unable to download images")).toBe(false);
  });
});
