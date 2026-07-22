import { describe, expect, it } from "vitest";
import { fallbackWordEntry } from "@/data/words";
import { TWISTS, evaluateTwistLocally, getTodaysTwist } from "@/lib/twists";
import type { WordEntry } from "@/types";

const word: WordEntry = fallbackWordEntry; // elevated: कार्य / karya

function twist(id: string) {
  const found = TWISTS.find((definition) => definition.id === id);
  if (!found) {
    throw new Error(`Unknown twist: ${id}`);
  }
  return found;
}

describe("twists", () => {
  it("rotates deterministically through every twist", () => {
    expect(getTodaysTwist("2026-07-18")).toBe(getTodaysTwist("2026-07-18"));

    const cycle = ["2026-07-18", "2026-07-19", "2026-07-20", "2026-07-21"].map(
      (dateKey) => getTodaysTwist(dateKey).id,
    );
    expect(new Set(cycle).size).toBe(TWISTS.length);

    expect(getTodaysTwist("2026-07-18")).toBe(getTodaysTwist("2026-07-22"));
  });

  it("recognises question sentences in either script", () => {
    const question = twist("question");

    expect(question.localCheck("आपका कार्य पूरा हुआ?", word)).toBe(true);
    expect(question.localCheck("kya aapka karya poora hua", word)).toBe(true);
    expect(question.localCheck("mera karya poora hua.", word)).toBe(false);
    // "kabhi" must not read as the question word "kab".
    expect(question.localCheck("main kabhi karya karta hoon.", word)).toBe(false);
  });

  it("counts words for the short twist", () => {
    const short = twist("short");

    expect(short.localCheck("यह कार्य सरल है।", word)).toBe(true);
    expect(
      short.localCheck("यह कार्य बहुत ही अधिक लंबा और विस्तृत वाक्य बन गया है।", word),
    ).toBe(false);
  });

  it("counts repeated target words for the twice twist", () => {
    const twice = twist("twice");

    expect(twice.localCheck("कार्य ही कार्य है।", word)).toBe(true);
    expect(twice.localCheck("karya hi karya hai", word)).toBe(true);
    expect(twice.localCheck("बस एक कार्य बचा है।", word)).toBe(false);
  });

  it("evaluates a full local twist attempt", () => {
    const question = twist("question");

    expect(evaluateTwistLocally("क्या यह कार्य आज होगा?", word, question)).toEqual({
      acceptable: true,
      unverified: false,
    });
    expect(evaluateTwistLocally("यह कार्य आज होगा।", word, question)).toEqual({
      acceptable: false,
      unverified: false,
    });
    // Missing target word fails before the twist is even considered.
    expect(evaluateTwistLocally("क्या यह आज होगा?", word, question)).toEqual({
      acceptable: false,
      unverified: false,
    });

    const aboutToday = twist("about-today");
    expect(evaluateTwistLocally("आज मेरा कार्य अच्छा रहा।", word, aboutToday)).toEqual({
      acceptable: true,
      unverified: true,
    });
  });
});
