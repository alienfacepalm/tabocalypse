import { useCallback, useEffect, useMemo, useRef } from "react";

export type TDebouncedCallback<TArgs extends unknown[]> = {
  call: (...args: TArgs) => void;
  cancel: () => void;
  flush: () => void;
};

export function useDebouncedCallback<TArgs extends unknown[]>(
  fn: (...args: TArgs) => void,
  delayMs: number,
): TDebouncedCallback<TArgs> {
  const fnRef = useRef(fn);
  const timerRef = useRef<number | null>(null);
  const latestArgsRef = useRef<TArgs | null>(null);

  useEffect(() => {
    fnRef.current = fn;
  }, [fn]);

  const cancel = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    latestArgsRef.current = null;
  }, []);

  const flush = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    const args = latestArgsRef.current;
    latestArgsRef.current = null;
    if (args) fnRef.current(...args);
  }, []);

  useEffect(() => cancel, [cancel]);

  const call = useCallback(
    (...args: TArgs) => {
      latestArgsRef.current = args;
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }
      timerRef.current = window.setTimeout(() => {
        timerRef.current = null;
        const flushArgs = latestArgsRef.current;
        latestArgsRef.current = null;
        if (flushArgs) fnRef.current(...flushArgs);
      }, delayMs);
    },
    [delayMs],
  );

  return useMemo(() => ({ call, cancel, flush }), [call, cancel, flush]);
}
