import { afterEach, describe, expect, it, vi } from "vitest";
import {
  buildOpenAiChatCompletionsUrl,
  parseOpenAiChatCompletionBody,
  postOpenAiCompatibleChat,
  testOpenAiCompatible,
} from "./openai-compatible-chat";

describe("buildOpenAiChatCompletionsUrl", () => {
  it("trims trailing slashes on the base URL", () => {
    expect(buildOpenAiChatCompletionsUrl("https://api.openai.com/v1/")).toBe(
      "https://api.openai.com/v1/chat/completions",
    );
  });
});

describe("parseOpenAiChatCompletionBody", () => {
  it("reads assistant content from choices", () => {
    expect(
      parseOpenAiChatCompletionBody(
        JSON.stringify({ choices: [{ message: { content: "  hello  " } }] }),
      ),
    ).toBe("hello");
  });

  it("returns null for empty or invalid payloads", () => {
    expect(parseOpenAiChatCompletionBody("{}")).toBeNull();
    expect(parseOpenAiChatCompletionBody("not json")).toBeNull();
  });
});

describe("postOpenAiCompatibleChat", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("POSTs messages and returns the assistant reply", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify({ choices: [{ message: { content: "Hi there" } }] }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await postOpenAiCompatibleChat({
      apiKey: "sk-test",
      baseUrl: "https://api.example.com/v1",
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: "Hello" }],
    });

    expect(result).toEqual({ ok: true, reply: "Hi there" });
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.example.com/v1/chat/completions",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ Authorization: "Bearer sk-test" }),
      }),
    );
  });

  it("surfaces HTTP errors", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        text: async () => "Unauthorized",
      }),
    );

    const result = await postOpenAiCompatibleChat({
      apiKey: "bad",
      baseUrl: "https://api.example.com/v1",
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: "x" }],
    });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("401");
  });
});

describe("testOpenAiCompatible", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("uses the Tabocalypse OK probe message", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => JSON.stringify({ choices: [{ message: { content: "Tabocalypse OK" } }] }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await testOpenAiCompatible({
      apiKey: "sk",
      baseUrl: "https://api.openai.com/v1",
    });

    expect(result).toEqual({ ok: true, reply: "Tabocalypse OK" });
    const body = JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body)) as {
      messages: Array<{ content: string }>;
      max_tokens: number;
    };
    expect(body.messages[0]?.content).toContain("Tabocalypse OK");
    expect(body.max_tokens).toBe(32);
  });
});
