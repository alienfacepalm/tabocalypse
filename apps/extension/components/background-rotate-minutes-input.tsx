import React, { useEffect, useRef, useState } from "react";
import {
  BACKGROUND_ROTATE_MINUTES_MAX,
  BACKGROUND_ROTATE_MINUTES_MIN,
  coerceBackgroundRotateMinutes,
} from "../lib/settings";

export function BackgroundRotateMinutesInput({
  className,
  value,
  ariaLabel,
  onCommit,
}: {
  className?: string;
  value: number;
  ariaLabel: string;
  onCommit: (next: number) => void;
}): React.JSX.Element {
  const inputRef = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState(() => String(value));

  useEffect(() => {
    if (inputRef.current === document.activeElement) return;
    setDraft(String(value));
  }, [value]);

  return (
    <input
      ref={inputRef}
      type="number"
      min={BACKGROUND_ROTATE_MINUTES_MIN}
      max={BACKGROUND_ROTATE_MINUTES_MAX}
      className={className}
      value={draft}
      aria-label={ariaLabel}
      onChange={(e) => {
        setDraft(e.target.value);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          inputRef.current?.blur();
        }
      }}
      onBlur={() => {
        const parsed = draft.trim() === "" ? Number.NaN : Number(draft);
        const next = coerceBackgroundRotateMinutes(parsed, value);
        setDraft(String(next));
        if (next !== value) {
          onCommit(next);
        }
      }}
    />
  );
}
