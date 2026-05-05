import type { FormEvent } from "react";
import React, { useCallback, useRef } from "react";

export interface IHudColorInputProps {
  id?: string;
  value: string;
  "aria-label": string;
  onChange: (e: FormEvent<HTMLInputElement>) => void;
}

function openOrActivateColorInput(el: HTMLInputElement): void {
  const pick = el.showPicker;
  if (typeof pick === "function") {
    try {
      pick.call(el);
    } catch {
      el.click();
    }
  } else {
    el.click();
  }
}

/**
 * Draws the swatch from `value` in a real button (reliable hit targets everywhere).
 * The native `<input type="color">` is visually hidden and only used to host the
 * picker and `value` — WebKit is unreliable for both repainting the native swatch
 * and click-through on fully transparent overlay inputs.
 */
export function HudColorInput({
  id,
  value,
  "aria-label": ariaLabel,
  onChange,
}: IHudColorInputProps): React.JSX.Element {
  const inputRef = useRef<HTMLInputElement>(null);

  const openPicker = useCallback(() => {
    const el = inputRef.current;
    if (el) openOrActivateColorInput(el);
  }, []);

  return (
    <span className="inline-flex max-w-full align-middle">
      <button
        type="button"
        id={id}
        className="relative h-9 w-12 shrink-0 cursor-pointer border-2 border-border bg-transparent p-0 shadow-[3px_3px_0_0_var(--color-accent)] transition-[transform,box-shadow,filter] duration-100 hover:translate-x-px hover:translate-y-px hover:shadow-[2px_2px_0_0_var(--color-accent)] hover:brightness-110 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none active:brightness-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        aria-label={ariaLabel}
        onClick={openPicker}
      >
        <span
          aria-hidden
          className="pointer-events-none absolute inset-[2px] block"
          style={{ backgroundColor: value }}
        />
      </button>
      <input
        ref={inputRef}
        type="color"
        tabIndex={-1}
        className="sr-only"
        value={value}
        aria-hidden
        onChange={onChange}
        onInput={onChange}
      />
    </span>
  );
}
