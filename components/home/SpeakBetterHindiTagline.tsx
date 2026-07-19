"use client";

import { useEffect, useState } from "react";
import { SPEAK_BETTER_HINDI_TAGLINES } from "@/data/taglines";

export function SpeakBetterHindiTagline() {
  const [taglineIndex, setTaglineIndex] = useState(0);
  const [typedTagline, setTypedTagline] = useState({
    tagline: "",
    text: "",
  });
  const currentTagline = SPEAK_BETTER_HINDI_TAGLINES[taglineIndex];

  useEffect(() => {
    let characterIndex = 0;
    const characters = Array.from(currentTagline);

    const typewriter = window.setInterval(() => {
      characterIndex += 1;
      setTypedTagline({
        tagline: currentTagline,
        text: characters.slice(0, characterIndex).join(""),
      });

      if (characterIndex >= characters.length) {
        window.clearInterval(typewriter);
      }
    }, 55);

    return () => window.clearInterval(typewriter);
  }, [currentTagline]);

  useEffect(() => {
    const shuffleTagline = window.setInterval(() => {
      setTaglineIndex((currentIndex) => {
        const offset = Math.floor(Math.random() * (SPEAK_BETTER_HINDI_TAGLINES.length - 1)) + 1;
        return (currentIndex + offset) % SPEAK_BETTER_HINDI_TAGLINES.length;
      });
    }, 5_000);

    return () => window.clearInterval(shuffleTagline);
  }, []);

  return (
    <section className="animate-floatIn px-1 pt-1 sm:px-2" aria-label="Hindi speaking goal">
      <h1
        lang="hi"
        aria-label={currentTagline}
        className="rounded-2xl border border-amber-200/55 bg-gradient-to-r from-amber-100/70 via-orange-50/70 to-rose-100/60 px-4 py-3 text-balance font-hindi text-base font-semibold leading-[1.6] text-ink shadow-sm shadow-amber-900/5 sm:px-5 sm:text-lg dark:border-amber-200/10 dark:from-amber-300/10 dark:via-orange-300/8 dark:to-rose-300/10 dark:text-white"
      >
        {typedTagline.tagline === currentTagline ? typedTagline.text : ""}
        <span aria-hidden="true" className="ml-0.5 inline-block h-[0.95em] w-0.5 animate-pulse bg-amber-700 align-[-0.08em] dark:bg-amber-200" />
      </h1>
    </section>
  );
}
