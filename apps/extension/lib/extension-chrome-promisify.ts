interface IChromeRuntimeShim {
  id?: string;
  lastError?: { message?: string };
}

interface IGlobalWithOptionalChrome {
  chrome?: { runtime?: IChromeRuntimeShim };
}

export function getExtensionChromeRuntime(): IChromeRuntimeShim | undefined {
  return (globalThis as IGlobalWithOptionalChrome).chrome?.runtime;
}

/** True in the MV3 background service worker (not extension HTML pages). */
export function isExtensionServiceWorkerContext(): boolean {
  return typeof (globalThis as { importScripts?: unknown }).importScripts === "function";
}

export function formatExtensionChromeError(err: unknown): string {
  if (err instanceof Error && err.message.trim()) return err.message.trim();
  if (typeof err === "string" && err.trim()) return err.trim();
  return "Unknown error.";
}

export function withExtensionPromiseTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  timeoutMessage: string,
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    let settled = false;
    const timer = globalThis.setTimeout(() => {
      if (settled) return;
      settled = true;
      void promise.catch(() => undefined);
      reject(new Error(timeoutMessage));
    }, timeoutMs);
    void promise.then(
      (value) => {
        if (settled) return;
        settled = true;
        globalThis.clearTimeout(timer);
        resolve(value);
      },
      (err: unknown) => {
        if (settled) return;
        settled = true;
        globalThis.clearTimeout(timer);
        reject(err instanceof Error ? err : new Error(formatExtensionChromeError(err)));
      },
    );
  });
}

/**
 * Call a Chrome extension API method that may return a Promise (MV3) or use a callback (MV2).
 * Uses one invocation — never calls the API twice.
 */
export function promisifyExtensionChromeApi<T>(
  invoke: (callback: (value: T) => void) => unknown,
  timeoutMs: number,
  timeoutMessage: string,
): Promise<T> {
  const runtime = getExtensionChromeRuntime();

  const promise = new Promise<T>((resolve, reject) => {
    let settled = false;
    const finish = (fn: () => void): void => {
      if (settled) return;
      settled = true;
      fn();
    };

    try {
      const maybePromise = invoke((value: T) => {
        finish(() => {
          const err = runtime?.lastError;
          if (err?.message) reject(new Error(err.message));
          else resolve(value);
        });
      });
      if (maybePromise != null && typeof (maybePromise as Promise<T>).then === "function") {
        void (maybePromise as Promise<T>).then(
          (value) => finish(() => resolve(value)),
          (err: unknown) =>
            finish(() => {
              reject(err instanceof Error ? err : new Error(formatExtensionChromeError(err)));
            }),
        );
      }
    } catch (err) {
      finish(() => {
        reject(err instanceof Error ? err : new Error(formatExtensionChromeError(err)));
      });
    }
  });

  return withExtensionPromiseTimeout(promise, timeoutMs, timeoutMessage);
}
