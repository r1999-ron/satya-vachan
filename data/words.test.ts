import { describe, expect, it } from "vitest";
import { wordCorpus } from "@/data/words";
import { getSentenceStarters } from "@/lib/challenge";
import { containsTargetWord } from "@/lib/word-match";

const DEVANAGARI = /[ऀ-ॿ]/u;

describe("bilingual word corpus", () => {
  it("provides authored Devanagari and clean romanization for every entry", () => {
    expect(wordCorpus).toHaveLength(100);

    for (const entry of wordCorpus) {
      expect(entry.id).toMatch(/^[1-9]\d*$/);

      const words = [entry.common, entry.elevated, ...entry.synonyms];
      const examples = [entry.simpleExample, entry.elevatedExample, entry.scholarExample];

      for (const word of words) {
        expect(word.dev, entry.id).toMatch(DEVANAGARI);
        expect(word.roman.trim(), entry.id).not.toBe("");
        expect(word.roman, entry.id).not.toMatch(DEVANAGARI);
      }

      for (const example of examples) {
        expect(example.dev, entry.id).toMatch(DEVANAGARI);
        expect(example.roman.trim(), entry.id).not.toBe("");
        expect(example.roman, entry.id).not.toMatch(DEVANAGARI);
      }

      expect(
        containsTargetWord(entry.elevatedExample.dev, entry.elevated.dev) ||
          containsTargetWord(entry.elevatedExample.roman, entry.elevated.roman),
        `${entry.id} improved sentence must use the transformed word`,
      ).toBe(true);
    }
  });

  it("derives sentence starters that never give the target word away", () => {
    for (const entry of wordCorpus) {
      for (const starter of getSentenceStarters(entry)) {
        expect(starter.trim(), entry.id).not.toBe("");
        expect(
          containsTargetWord(starter, entry.elevated.dev),
          `${entry.id} starter must not contain the target word`,
        ).toBe(false);
      }
    }
  });
});
