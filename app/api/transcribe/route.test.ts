import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const openAiMocks = vi.hoisted(() => ({
  transcribe: vi.fn(),
  format: vi.fn(),
}));

vi.mock("server-only", () => ({}));

vi.mock("@/lib/openai", () => ({
  isOpenAIConfigured: () => true,
  getOpenAIClient: () => ({
    audio: {
      transcriptions: { create: openAiMocks.transcribe },
    },
    chat: {
      completions: { create: openAiMocks.format },
    },
  }),
}));

describe("POST /api/transcribe", () => {
  beforeEach(() => {
    openAiMocks.transcribe.mockResolvedValue({
      text: "mujhe aaj office jaana hai",
    });
    openAiMocks.format.mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify({ transcript: "मुझे आज office जाना है।" }),
          },
        },
      ],
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("returns the mixed-script transcript produced by the formatter LLM", async () => {
    const { POST } = await import("@/app/api/transcribe/route");
    const formData = new FormData();
    formData.append(
      "file",
      new File(["audio"], "recording.webm", { type: "audio/webm" }),
    );
    formData.append("durationMs", "1234");

    const response = await POST(
      new Request("http://localhost/api/transcribe", {
        method: "POST",
        headers: {
          origin: "http://localhost",
          "sec-fetch-site": "same-origin",
          "x-forwarded-for": "transcription-route-test",
        },
        body: formData,
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      transcript: "मुझे आज office जाना है।",
      durationMs: 1234,
    });
    expect(openAiMocks.transcribe).toHaveBeenCalledOnce();
    expect(openAiMocks.format).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "gpt-4.1-nano",
        messages: expect.arrayContaining([
          expect.objectContaining({
            role: "user",
            content: expect.stringContaining("mujhe aaj office jaana hai"),
          }),
        ]),
      }),
    );
  });
});
