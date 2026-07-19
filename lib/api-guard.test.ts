import { describe, expect, it } from "vitest";
import { guardAiRequest } from "@/lib/api-guard";

function makeRequest({
  ip,
  origin = "https://satya.example",
}: {
  ip: string;
  origin?: string;
}) {
  return new Request("https://satya.example/api/tts", {
    method: "POST",
    headers: {
      Origin: origin,
      "Sec-Fetch-Site": "same-origin",
      "X-Real-IP": ip,
    },
  });
}

describe("AI API guard", () => {
  it("accepts same-origin requests and rejects another origin", async () => {
    expect(guardAiRequest(makeRequest({ ip: "test-origin-ok" }), "tts")).toBeNull();

    const blocked = guardAiRequest(
      makeRequest({ ip: "test-origin-bad", origin: "https://attacker.example" }),
      "tts",
    );

    expect(blocked?.status).toBe(403);
    await expect(blocked?.json()).resolves.toMatchObject({
      code: "FORBIDDEN_ORIGIN",
    });
  });

  it("allows two complete practice demos from the same IP", () => {
    for (let run = 0; run < 2; run += 1) {
      expect(
        guardAiRequest(makeRequest({ ip: "test-demo-burst" }), "transcribe"),
      ).toBeNull();
      expect(
        guardAiRequest(makeRequest({ ip: "test-demo-burst" }), "transform"),
      ).toBeNull();
      expect(
        guardAiRequest(makeRequest({ ip: "test-demo-burst" }), "tts"),
      ).toBeNull();
      expect(
        guardAiRequest(makeRequest({ ip: "test-demo-burst" }), "tts"),
      ).toBeNull();
    }
  });

  it("rate-limits costly requests with a shared per-IP token bucket", async () => {
    for (let index = 0; index < 20; index += 1) {
      expect(guardAiRequest(makeRequest({ ip: "test-rate-limit" }), "tts")).toBeNull();
    }

    const limited = guardAiRequest(
      makeRequest({ ip: "test-rate-limit" }),
      "tts",
    );

    expect(limited?.status).toBe(429);
    expect(Number(limited?.headers.get("Retry-After"))).toBeGreaterThan(0);
    await expect(limited?.json()).resolves.toMatchObject({ code: "RATE_LIMITED" });
  });
});
