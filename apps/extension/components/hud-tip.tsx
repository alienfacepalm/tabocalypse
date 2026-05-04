import type { ReactElement } from "react";

/**
 * HUD-styled hover/focus-within hint (Space Mono). Supplemental for sighted users;
 * keep meaningful `aria-label` / visible text on the wrapped control.
 */
export function HudTip({ tip, children }: { tip: string; children: ReactElement }) {
  return (
    <div className="group/tool relative inline-flex max-w-full align-middle">
      {children}
      <span
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-full z-20 mt-1 w-max max-w-[min(14rem,calc(100vw-2rem))] -translate-x-1/2 whitespace-normal border border-accent bg-btn-bg px-2 py-1 text-center font-display text-[0.65rem] font-bold uppercase leading-snug tracking-widest text-accent opacity-0 shadow-[3px_3px_0_0_var(--color-accent)] transition-opacity duration-100 group-hover/tool:opacity-100 group-focus-within/tool:opacity-100"
      >
        {tip}
      </span>
    </div>
  );
}
