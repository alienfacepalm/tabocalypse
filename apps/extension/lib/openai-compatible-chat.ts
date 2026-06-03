/** BYO OpenAI-compatible chat completions. User pays the provider; no publisher backend. */

export type TOpenAiChatRole = "user" | "assistant" | "system";

export interface IOpenAiChatMessage {
  role: TOpenAiChatRole;
  content: string;
}

export const DEFAULT_OPENAI_COMPATIBLE_MODEL = "gpt-4o-mini";

export function buildOpenAiChatCompletionsUrl(baseUrl: string): string {
  const base = baseUrl.trim().replace(/\/$/, "");
  return `${base}/chat/completions`;
}

export function parseOpenAiChatCompletionBody(text: string): string | null {
  try {
    const data = JSON.parse(text) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const reply = data.choices?.[0]?.message?.content?.trim() ?? "";
    return reply.length > 0 ? reply : null;
  } catch {
    return null;
  }
}

export async function postOpenAiCompatibleChat(opts: {
  apiKey: string;
  baseUrl: string;
  model: string;
  messages: IOpenAiChatMessage[];
  maxTokens?: number;
}): Promise<{ ok: true; reply: string } | { ok: false; error: string }> {
  const model = opts.model.trim() || DEFAULT_OPENAI_COMPATIBLE_MODEL;
  const url = buildOpenAiChatCompletionsUrl(opts.baseUrl);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${opts.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: opts.messages,
        max_tokens: opts.maxTokens ?? 1024,
      }),
    });
    const text = await res.text();
    if (!res.ok) return { ok: false, error: `${res.status}: ${text.slice(0, 200)}` };
    const reply = parseOpenAiChatCompletionBody(text);
    if (!reply) return { ok: false, error: "Empty response" };
    return { ok: true, reply };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

/** Smoke test: single user message with a short expected reply. */
export async function testOpenAiCompatible(opts: {
  apiKey: string;
  baseUrl: string;
  model?: string;
}): Promise<{ ok: true; reply: string } | { ok: false; error: string }> {
  return postOpenAiCompatibleChat({
    apiKey: opts.apiKey,
    baseUrl: opts.baseUrl,
    model: opts.model?.trim() || DEFAULT_OPENAI_COMPATIBLE_MODEL,
    messages: [{ role: "user", content: "Reply with exactly: Tabocalypse OK" }],
    maxTokens: 32,
  });
}
