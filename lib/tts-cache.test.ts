import { describe, expect, it } from "vitest";
import { cacheTtsAudio, getCachedTtsAudio } from "@/lib/tts-cache";

describe("tts audio cache", () => {
  it("normalizes surrounding whitespace in cache keys", () => {
    const audio = new Blob(["audio"], { type: "audio/mpeg" });

    cacheTtsAudio("  सत्य की जीत होती है  ", "natural", audio);

    expect(getCachedTtsAudio("सत्य की जीत होती है", "natural")).toBe(audio);
  });

  it("keeps natural and elevated variants in separate cache entries", () => {
    const naturalAudio = new Blob(["natural-audio"], { type: "audio/mpeg" });
    const elevatedAudio = new Blob(["elevated-audio"], { type: "audio/mpeg" });

    cacheTtsAudio("एक अलग वाक्य", "natural", naturalAudio);
    cacheTtsAudio("एक अलग वाक्य", "elevated", elevatedAudio);

    expect(getCachedTtsAudio("एक अलग वाक्य", "natural")).toBe(
      naturalAudio,
    );
    expect(getCachedTtsAudio("एक अलग वाक्य", "elevated")).toBe(
      elevatedAudio,
    );
  });
});
