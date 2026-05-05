import type { FormEvent } from "react";
import React from "react";

export interface IHudColorInputProps {
  id?: string;
  value: string;
  "aria-label": string;
  onChange: (e: FormEvent<HTMLInputElement>) => void;
}

/**
 * Safari/WebKit often fails to repaint the native color swatch from a controlled
 * `value`, so the visible fill is a plain box; the real input is transparent and
 * only used to open the system picker.
 */
export function HudColorInput({
  id,
  value,
  "aria-label": ariaLabel,
  onChange,
}: IHudColorInputProps): React.JSX.Element {
  return (
    <span className="relative inline-block h-9 w-12 shrink-0 cursor-pointer border-2 border-border shadow-[3px_3px_0_0_var(--color-accent)] focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-accent">
      <span
        aria-hidden
        className="pointer-events-none absolute inset-[2px]"
        style={{ backgroundColor: value }}
      />
      <input
        id={id}
        type="color"
        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        value={value}
        aria-label={ariaLabel}
        onChange={onChange}
        onInput={onChange}
      />
    </span>
  );
}
