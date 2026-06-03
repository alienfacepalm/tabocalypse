import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { resolveHudToastPresentation, type THudToastVariant } from "../lib/hud-toast-style";

export type THudToastShowOptions = {
  message: string;
  variant?: THudToastVariant;
  /** Override auto-dismiss (ms). Ignored when `persist` is true. */
  durationMs?: number;
  /** Stay visible until the user clicks dismiss. */
  persist?: boolean;
};

export type THudToastHandle = {
  showToast: (opts: THudToastShowOptions) => void;
};

type THudToastItem = {
  id: string;
  message: string;
  variant: THudToastVariant;
};

type THudToastContextValue = {
  showToast: (opts: THudToastShowOptions) => void;
  chaotic: boolean;
};

const HudToastContext = createContext<THudToastContextValue | null>(null);

const DEFAULT_DURATION_MS: Record<THudToastVariant, number> = {
  error: 8000,
  warn: 7000,
  info: 5000,
  success: 4500,
};

function newToastId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `toast-${String(Date.now())}-${String(Math.random())}`;
}

export const HudToastProvider = React.forwardRef<
  THudToastHandle,
  { chaotic: boolean; children: React.ReactNode }
>(function HudToastProvider({ chaotic, children }, ref) {
  const [toasts, setToasts] = useState<THudToastItem[]>([]);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: string) => {
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (opts: THudToastShowOptions) => {
      const id = newToastId();
      const variant = opts.variant ?? "error";
      setToasts((prev) => [...prev, { id, message: opts.message, variant }]);
      if (opts.persist) return;
      const durationMs = opts.durationMs ?? DEFAULT_DURATION_MS[variant];
      const timer = setTimeout(() => dismiss(id), durationMs);
      timersRef.current.set(id, timer);
    },
    [dismiss],
  );

  useImperativeHandle(ref, () => ({ showToast }), [showToast]);

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      for (const timer of timers.values()) clearTimeout(timer);
      timers.clear();
    };
  }, []);

  const value = useMemo(() => ({ showToast, chaotic }), [showToast, chaotic]);

  return (
    <HudToastContext.Provider value={value}>
      {children}
      <HudToastViewport toasts={toasts} chaotic={chaotic} onDismiss={dismiss} />
    </HudToastContext.Provider>
  );
});

export function useHudToast(): THudToastContextValue {
  const ctx = useContext(HudToastContext);
  if (!ctx) {
    throw new Error("useHudToast must be used within HudToastProvider");
  }
  return ctx;
}

function HudToastViewport({
  toasts,
  chaotic,
  onDismiss,
}: {
  toasts: THudToastItem[];
  chaotic: boolean;
  onDismiss: (id: string) => void;
}) {
  if (toasts.length === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[55]" aria-live="polite">
      {toasts.map((toast, index) => {
        const stackIndex = toasts.length - 1 - index;
        const presentation = resolveHudToastPresentation(
          toast.id,
          toast.variant,
          chaotic,
          stackIndex,
        );
        const assertive = toast.variant === "error";
        return (
          <div
            key={toast.id}
            role={assertive ? "alert" : "status"}
            aria-live={assertive ? "assertive" : "polite"}
            className={`pointer-events-auto ${presentation.className}`}
            style={presentation.style}
          >
            <p className="m-0 max-w-[min(22rem,calc(100vw-2rem))] text-sm leading-snug text-inherit">
              {toast.message}
            </p>
            <button
              type="button"
              className="toast-dismiss btn ghost sm"
              aria-label="Dismiss notification"
              onClick={() => onDismiss(toast.id)}
            >
              ×
            </button>
          </div>
        );
      })}
    </div>
  );
}
