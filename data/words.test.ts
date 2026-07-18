import { describe, expect, it } from "vitest";
import { wordCorpus } from "@/data/words";
import { containsTargetWord } from "@/lib/word-match";

const DEVANAGARI = /[\u0900-\u097f]/u;

describe("bilingual word corpus", () => {
  it("provides both scripts and English example translations for every entry", () => {
    expect(wordCorpus).toHaveLength(60);

    for (const entry of wordCorpus) {
      const words = [entry.common, entry.elevated, ...entry.synonyms];
      const examples = [entry.simpleExample, entry.elevatedExample, entry.scholarExample];

      for (const word of words) {
        expect(word.dev, entry.id).toMatch(DEVANAGARI);
        expect(word.roman.trim(), entry.id).not.toBe("");
      }

      for (const example of examples) {
        expect(example.dev, entry.id).toMatch(DEVANAGARI);
        expect(example.roman.trim(), entry.id).not.toBe("");
        expect(example.en?.trim(), entry.id).not.toBe("");
      }

      expect(entry.starters.length, entry.id).toBeGreaterThan(0);
      for (const starter of entry.starters) {
        expect(starter.dev, entry.id).toMatch(DEVANAGARI);
        expect(starter.roman.trim(), entry.id).not.toBe("");
        expect(
          containsTargetWord(starter.dev, entry.elevated.dev) ||
            containsTargetWord(starter.roman, entry.elevated.roman),
          entry.id,
        ).toBe(true);
      }
    }
  });
});
