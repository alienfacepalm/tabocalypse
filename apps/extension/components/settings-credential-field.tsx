import { Eye, EyeOff } from "lucide-react";
import React, { useEffect, useState } from "react";
import {
  normalizeCredentialPaste,
  SETTINGS_CREDENTIAL_INPUT_ATTRS,
  SETTINGS_SECRET_MASK_STYLE,
  type TSettingsCredentialKind,
} from "../lib/settings-credential-field";
import { HudTip } from "./hud-tip";

export interface ISettingsCredentialFieldProps {
  id: string;
  /** Unique `name` so password managers do not treat this as a login password field. */
  name: string;
  kind: TSettingsCredentialKind;
  value: string;
  onCommit: (next: string) => void;
  /** Optional coerce after raw edit / paste (e.g. Steam ID digit-string normalization). */
  transform?: (raw: string) => string;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  "aria-label"?: string;
  /** Secrets start masked; set true only when empty first-entry UX needs an open field. */
  defaultRevealed?: boolean;
}

/**
 * Local-draft Settings field for API keys (`secret`) and account identifiers.
 * Owns show/hide for secrets; callers persist via `onCommit` (local storage).
 */
export function SettingsCredentialField({
  id,
  name,
  kind,
  value,
  onCommit,
  transform,
  placeholder,
  className,
  inputClassName,
  "aria-label": ariaLabel,
  defaultRevealed = false,
}: ISettingsCredentialFieldProps): React.JSX.Element {
  const [draft, setDraft] = useState(value);
  const [revealed, setRevealed] = useState(defaultRevealed);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  const commit = (raw: string, opts?: { revealAfterPaste?: boolean }) => {
    const next = transform ? transform(raw) : kind === "secret" ? raw.trim() : raw;
    setDraft(next);
    if (opts?.revealAfterPaste && kind === "secret") {
      setRevealed(true);
    }
    onCommit(next);
  };

  const masked = kind === "secret" && !revealed;

  return (
    <div className={className ?? (kind === "secret" ? "row gap-2" : undefined)}>
      <input
        {...SETTINGS_CREDENTIAL_INPUT_ATTRS}
        id={id}
        name={name}
        aria-label={ariaLabel}
        className={inputClassName ?? (kind === "secret" ? "min-w-0 flex-1" : undefined)}
        placeholder={placeholder}
        value={draft}
        style={masked ? (SETTINGS_SECRET_MASK_STYLE as React.CSSProperties) : undefined}
        onChange={(e) => {
          const raw = e.target.value;
          setDraft(raw);
          const next = transform ? transform(raw) : raw;
          onCommit(next);
        }}
        onPaste={(e) => {
          const text = e.clipboardData.getData("text/plain");
          if (!text) return;
          e.preventDefault();
          commit(normalizeCredentialPaste(kind, text), { revealAfterPaste: true });
        }}
        onBlur={() => {
          if (kind === "secret" && draft !== draft.trim()) {
            commit(draft);
          }
        }}
      />
      {kind === "secret" ? (
        <HudTip tip={revealed ? "Hide key" : "Show key"}>
          <button
            type="button"
            className="btn ghost icon-only sm shrink-0"
            aria-pressed={revealed}
            aria-label={revealed ? "Hide API key" : "Show API key"}
            onClick={() => setRevealed((v) => !v)}
          >
            {revealed ? (
              <EyeOff size={18} strokeWidth={2} aria-hidden />
            ) : (
              <Eye size={18} strokeWidth={2} aria-hidden />
            )}
          </button>
        </HudTip>
      ) : null}
    </div>
  );
}
