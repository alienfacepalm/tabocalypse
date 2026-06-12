import browser from "webextension-polyfill";
import React, { useCallback, useMemo, useState } from "react";
import { Mail, Send } from "lucide-react";
import { HudTip } from "./hud-tip";
import {
  TABOCALYPSE_FEEDBACK_SEND,
  type TFeedbackKind,
  type TTabocalypseFeedbackSendResponse,
} from "../lib/feedback/feedback-message";
import { isFeedbackSmtpConfigured } from "../lib/feedback/feedback-smtp-config";
import { buildFeedbackMailtoUrl } from "../lib/feedback/send-feedback-via-smtp";

export function SettingsFeedbackForm({
  extensionVersion,
}: {
  extensionVersion: string;
}): React.JSX.Element {
  const smtpConfigured = useMemo(() => isFeedbackSmtpConfigured(), []);
  const [kind, setKind] = useState<TFeedbackKind>("feedback");
  const [replyEmail, setReplyEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState<{ tone: "ok" | "err"; text: string } | null>(null);

  const submitFeedback = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setStatus(null);
      const trimmed = message.trim();
      if (!trimmed) {
        setStatus({ tone: "err", text: "Enter a message before sending." });
        return;
      }
      setSending(true);
      try {
        const response = (await browser.runtime.sendMessage({
          type: TABOCALYPSE_FEEDBACK_SEND,
          kind,
          message: trimmed,
          replyEmail: replyEmail.trim() || undefined,
          extensionVersion,
          userAgent: navigator.userAgent,
        })) as TTabocalypseFeedbackSendResponse | undefined;
        if (response?.ok) {
          setMessage("");
          setStatus({ tone: "ok", text: "Thanks — your message was sent." });
          return;
        }
        setStatus({
          tone: "err",
          text: response?.error ?? "Could not send your message. Try again or use your email app.",
        });
      } catch (e: unknown) {
        setStatus({
          tone: "err",
          text: e instanceof Error ? e.message : "Could not send your message.",
        });
      } finally {
        setSending(false);
      }
    },
    [extensionVersion, kind, message, replyEmail],
  );

  const openMailtoFallback = useCallback(() => {
    const trimmed = message.trim();
    if (!trimmed) {
      setStatus({ tone: "err", text: "Enter a message before opening your email app." });
      return;
    }
    const url = buildFeedbackMailtoUrl({
      kind,
      message: trimmed,
      replyEmail: replyEmail.trim() || undefined,
      extensionVersion,
      userAgent: navigator.userAgent,
    });
    window.location.href = url;
  }, [extensionVersion, kind, message, replyEmail]);

  return (
    <div>
      <p className="muted sm mt-0">
        Send feedback or feature ideas to the maintainer. Messages go by public SMTP relay when this
        build is configured; otherwise use your email app.
      </p>
      <form className="mt-3 flex flex-col gap-2" onSubmit={(e) => void submitFeedback(e)}>
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
          <HudTip
            tip={smtpConfigured ? "Send via SMTP relay" : "SMTP is not configured for this build"}
          >
            <button type="submit" className="btn has-icon" disabled={sending || !smtpConfigured}>
              <Send size={18} strokeWidth={2} aria-hidden />
              <span>{sending ? "Sending…" : "Send message"}</span>
            </button>
          </HudTip>
          <HudTip tip="Open your email app with this message prefilled">
            <button
              type="button"
              className="btn ghost has-icon"
              onClick={openMailtoFallback}
              aria-label="Send with your email app"
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
      {!smtpConfigured ? (
        <p className="muted sm mt-2 mb-0">
          Direct send is unavailable in this build — use{" "}
          <span className="text-text">Use email app</span> or ask the maintainer to configure SMTP
          for store builds.
        </p>
      ) : null}
    </div>
  );
}
