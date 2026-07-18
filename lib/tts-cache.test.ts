import { describe, expect, it } from "vitest";
import { cacheTtsAudio, getCachedTtsAudio } from "@/lib/tts-cache";

describe("tts audio cache", () => {
  it("keeps audio for each voice in a separate cache entry", () => {
    const femaleAudio = new Blob(["female-audio"], { type: "audio/mpeg" });
    const maleAudio = new Blob(["male-audio"], { type: "audio/mpeg" });

    cacheTtsAudio("  सत्य की जीत होती है  ", "natural", "female", femaleAudio);
    cacheTtsAudio("सत्य की जीत होती है", "natural", "male", maleAudio);

    expect(
      getCachedTtsAudio("सत्य की जीत होती है", "natural", "female"),
    ).toBe(femaleAudio);
    expect(
      getCachedTtsAudio("सत्य की जीत होती है", "natural", "male"),
    ).toBe(maleAudio);
  });

  it("keeps natural and elevated variants in separate cache entries", () => {
    const naturalAudio = new Blob(["natural-audio"], { type: "audio/mpeg" });
    const elevatedAudio = new Blob(["elevated-audio"], { type: "audio/mpeg" });

    cacheTtsAudio("एक अलग वाक्य", "natural", "female", naturalAudio);
    cacheTtsAudio("एक अलग वाक्य", "elevated", "female", elevatedAudio);

    expect(getCachedTtsAudio("एक अलग वाक्य", "natural", "female")).toBe(
      naturalAudio,
    );
    expect(getCachedTtsAudio("एक अलग वाक्य", "elevated", "female")).toBe(
      elevatedAudio,
    );
  });
});
