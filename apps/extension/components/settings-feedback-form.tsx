import React, { useCallback, useState } from "react";
import { Mail } from "lucide-react";
import { HudTip } from "./hud-tip";
import type { TFeedbackKind } from "../lib/feedback/feedback-message";
import {
  buildFeedbackMailtoUrl,
  validateFeedbackMailtoPayload,
} from "../lib/feedback/feedback-mailto";

export function SettingsFeedbackForm({
  extensionVersion,
}: {
  extensionVersion: string;
}): React.JSX.Element {
  const [kind, setKind] = useState<TFeedbackKind>("feedback");
  const [replyEmail, setReplyEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<{ tone: "ok" | "err"; text: string } | null>(null);

  const openMailto = useCallback(
    (event?: React.FormEvent<HTMLFormElement>) => {
      event?.preventDefault();
      setStatus(null);
      const validated = validateFeedbackMailtoPayload({
        message,
        userAgent: navigator.userAgent,
      });
      if (!validated.ok) {
        setStatus({ tone: "err", text: validated.error });
        return;
      }
      const url = buildFeedbackMailtoUrl({
        kind,
        message: validated.message,
        replyEmail: replyEmail.trim() || undefined,
        extensionVersion,
        userAgent: validated.userAgent,
      });
      window.location.href = url;
      setStatus({
        tone: "ok",
        text: "Opened your email app with this message. Send it from there to reach the maintainer.",
      });
    },
    [extensionVersion, kind, message, replyEmail],
  );

  return (
    <div>
      <p className="muted sm mt-0">
        Send feedback or feature ideas with your email app (mailto). Tabocalypse does not send mail
        through a publisher relay or embed SMTP credentials.
      </p>
      <form className="mt-3 flex flex-col gap-2" onSubmit={(e) => openMailto(e)}>
        <label className="flex flex-col gap-1">
          <span className="font-display text-[10px] uppercase tracking-wide text-muted">Type</span>
          <select
            value={kind}
            onChange={(e) => setKind(e.target.value as TFeedbackKind)}
            aria-label="Feedback type"
          >
            <option value="feedback">Feedback</option>
            <option value="featureRequest">Feature request</option>
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="font-display text-[10px] uppercase tracking-wide text-muted">
            Reply email (optional)
          </span>
          <input
            type="email"
            value={replyEmail}
            onChange={(e) => setReplyEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="font-display text-[10px] uppercase tracking-wide text-muted">
            Message
          </span>
          <textarea
            rows={5}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="What should Tabocalypse do differently?"
            aria-label="Feedback message"
            required
          />
        </label>
        <div className="row wrap gap-2">
          <HudTip tip="Open your email app with this message prefilled">
            <button
              type="submit"
              className="btn has-icon"
              aria-label="Open email app with feedback"
            >
              <Mail size={18} strokeWidth={2} aria-hidden />
              <span>Use email app</span>
            </button>
          </HudTip>
        </div>
      </form>
      {status ? (
        <p
          className={`mt-2 font-mono text-xs ${status.tone === "ok" ? "text-accent" : "text-danger"}`}
          role="status"
        >
          {status.text}
        </p>
      ) : null}
    </div>
  );
}
