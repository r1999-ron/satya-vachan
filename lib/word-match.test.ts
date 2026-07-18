import { describe, expect, it } from "vitest";
import { containsTargetWord } from "@/lib/word-match";

describe("containsTargetWord", () => {
  it("matches whole words in Devanagari and common romanization variants", () => {
    expect(containsTargetWord("Kripya sheeghra uttar dijiye.", "sheeghra")).toBe(true);
    expect(containsTargetWord("Kripya shighra uttar dijiye.", "sheeghra")).toBe(true);
    expect(containsTargetWord("कृपया शीघ्र उत्तर दीजिए।", "शीघ्र")).toBe(true);
  });

  it("does not match a target embedded inside another word", () => {
    expect(containsTargetWord("Yeh asambhav hai.", "sambhav")).toBe(false);
    expect(containsTargetWord("", "sambhav")).toBe(false);
  });
});
