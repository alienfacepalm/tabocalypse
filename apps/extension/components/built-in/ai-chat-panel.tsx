import { Bot, Eraser, Send } from "lucide-react";
import React, { useRef, useState } from "react";
import { ensureByoAiHostPermission } from "../../lib/byo-ai-host-permission";
import {
  augmentRateLimitErrorWithAlternateProviders,
  BYO_AI_PROVIDER_LABELS,
  BYO_AI_PROVIDER_PRESETS,
  byoAiApiKeyForPreset,
  matchByoAiProviderPreset,
  type TByoAiProviderPreset,
} from "../../lib/byo-ai-provider-options";
import {
  postOpenAiCompatibleChat,
  type IOpenAiChatMessage,
} from "../../lib/openai-compatible-chat";
import { ByoAiProviderToggle } from "../byo-ai-provider-toggle";
import { PanelBody, PanelTip, PanelTitleInline, usePanelToast } from "../panel-sdk";
import {
  useTabocalypsePersist as usePanelPersist,
  useTabocalypseSettings as usePanelSettings,
} from "../tabocalypse-settings-context";

type TSendPhase = "idle" | "sending";

export function AiChatPanel({ onOpenByoAiSettings }: { onOpenByoAiSettings: () => void }) {
  const s = usePanelSettings();
  const persist = usePanelPersist();
  const [messages, setMessages] = useState<IOpenAiChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [phase, setPhase] = useState<TSendPhase>("idle");
  const { showToast } = usePanelToast();
  const listRef = useRef<HTMLDivElement | null>(null);

  const baseUrl = s.openaiBaseUrl;
  const model = s.openaiModel;
  const openaiApiKey = s.openaiApiKey;
  const geminiApiKey = s.geminiApiKey;

  const activePreset = matchByoAiProviderPreset(baseUrl, model);
  const apiKey = byoAiApiKeyForPreset(activePreset, { openai: openaiApiKey, gemini: geminiApiKey });
  const hasKey = apiKey.length > 0;
  const sending = phase === "sending";
  const providerLabel =
    activePreset !== null ? BYO_AI_PROVIDER_LABELS[activePreset] : "your configured endpoint";

  const scrollToBottom = () => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  };

  const selectProvider = (preset: TByoAiProviderPreset) => {
    if (activePreset === preset) return;
    setMessages([]);
    setDraft("");
    const next = BYO_AI_PROVIDER_PRESETS[preset];
    void persist((cur) => ({
      ...cur,
      openaiBaseUrl: next.baseUrl,
      openaiModel: next.model,
    }));
  };

  const send = async () => {
    const text = draft.trim();
    if (!text || sending) return;
    if (!hasKey) {
      const keyHint =
        activePreset === "gemini"
          ? BYO_AI_PROVIDER_PRESETS.gemini.apiKeyHint
          : activePreset === "openai"
            ? BYO_AI_PROVIDER_PRESETS.openai.apiKeyHint
            : "an API key";
      showToast({
        message: `Add ${keyHint} in Settings > BYO AI.`,
        variant: "warn",
      });
      return;
    }
    const perm = await ensureByoAiHostPermission(baseUrl);
    if (!perm.ok) {
      showToast({ message: perm.error, variant: "error", persist: true });
      return;
    }

    const nextMessages: IOpenAiChatMessage[] = [...messages, { role: "user", content: text }];
    setMessages(nextMessages);
    setDraft("");
    setPhase("sending");
    requestAnimationFrame(scrollToBottom);

    const result = await postOpenAiCompatibleChat({
      apiKey,
      baseUrl,
      model,
      messages: nextMessages,
    });

    setPhase("idle");
    if (!result.ok) {
      showToast({
        message: augmentRateLimitErrorWithAlternateProviders(result.error, activePreset, {
          openai: openaiApiKey,
          gemini: geminiApiKey,
        }),
        variant: "error",
        persist: true,
      });
      return;
    }
    setMessages((prev) => [...prev, { role: "assistant", content: result.reply }]);
    requestAnimationFrame(scrollToBottom);
  };

  const clearChat = () => {
    setMessages([]);
    setDraft("");
  };

  return (
    <section className="card flex h-full min-h-0 flex-col gap-3">
      <div className="shrink-0">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <Bot size={20} strokeWidth={2} className="shrink-0 text-accent" aria-hidden />
            <PanelTitleInline>AI chat</PanelTitleInline>
          </div>
          {messages.length > 0 ? (
            <PanelTip tip="Clear this conversation">
              <button
                type="button"
                className="btn ghost sm icon-only"
                aria-label="Clear chat"
                disabled={sending}
                onClick={clearChat}
              >
                <Eraser size={16} strokeWidth={2} aria-hidden />
              </button>
            </PanelTip>
          ) : null}
        </div>
        <div className="mt-2">
          <ByoAiProviderToggle
            baseUrl={baseUrl}
            model={model}
            compact
            onSelectPreset={selectProvider}
          />
        </div>
      </div>
      <PanelBody className="flex min-h-0 flex-1 flex-col gap-2">
        {!hasKey ? (
          <p className="muted text-xs leading-relaxed">
            Add your {providerLabel} API key in{" "}
            <button type="button" className="linkish p-0 text-xs" onClick={onOpenByoAiSettings}>
              Settings &gt; BYO AI
            </button>
            . Each send uses your provider and may incur cost.
          </p>
        ) : (
          <p className="muted text-xs leading-tight">
            Messages go to {providerLabel} when you send. This session clears when you reload the
            tab or switch provider.
          </p>
        )}

        <div
          ref={listRef}
          className="min-h-[6rem] flex-1 overflow-y-auto border border-border bg-surface-weak p-2 font-mono text-xs leading-relaxed shadow-[3px_3px_0px_0px_var(--color-accent)]"
          role="log"
          aria-live="polite"
          aria-relevant="additions"
        >
          {messages.length === 0 ? (
            <p className="muted m-0">No messages yet.</p>
          ) : (
            <ul className="m-0 flex list-none flex-col gap-2 p-0">
              {messages.map((m, i) => (
                <li
                  key={`${String(i)}-${m.role}`}
                  className={
                    m.role === "user"
                      ? "border-l-2 border-accent pl-2 text-foreground"
                      : "border-l-2 border-[var(--color-accent2)] pl-2 text-foreground"
                  }
                >
                  <span className="font-display text-[0.65rem] font-bold uppercase tracking-widest text-muted">
                    {m.role === "user" ? "You" : "Assistant"}
                  </span>
                  <p className="m-0 mt-0.5 whitespace-pre-wrap break-words">{m.content}</p>
                </li>
              ))}
            </ul>
          )}
          {sending ? (
            <p className="muted mt-2 font-display text-[0.65rem] uppercase tracking-widest">
              Waiting for reply…
            </p>
          ) : null}
        </div>

        <form
          className="flex shrink-0 gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            void send();
          }}
        >
          <input
            className="min-w-0 flex-1"
            placeholder="Message"
            value={draft}
            disabled={sending || !hasKey}
            onChange={(e) => setDraft(e.target.value)}
            autoComplete="off"
          />
          <PanelTip tip={`Send message to ${providerLabel}`}>
            <button
              type="submit"
              className="btn primary icon-only shrink-0"
              aria-label="Send message"
              disabled={sending || !hasKey || !draft.trim()}
            >
              <Send size={18} strokeWidth={2} aria-hidden />
            </button>
          </PanelTip>
        </form>
      </PanelBody>
    </section>
  );
}
