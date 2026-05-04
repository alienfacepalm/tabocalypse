/** BYO OpenAI-compatible chat completion smoke test. User pays provider. */

export async function testOpenAiCompatible(opts: {
  apiKey: string;
  baseUrl: string;
}): Promise<{ ok: true; reply: string } | { ok: false; error: string }> {
  const base = opts.baseUrl.replace(/\/$/, "");
  const url = `${base}/chat/completions`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${opts.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: "Reply with exactly: Tabocalypse OK" }],
        max_tokens: 32,
      }),
    });
    const text = await res.text();
    if (!res.ok) return { ok: false, error: `${res.status}: ${text.slice(0, 200)}` };
    const data = JSON.parse(text) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const reply = data.choices?.[0]?.message?.content?.trim() ?? "";
    if (!reply) return { ok: false, error: "Empty response" };
    return { ok: true, reply };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}
