"use client";

import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { SPEAK_BETTER_HINDI_TAGLINES } from "@/data/taglines";
import { fadeUp, stagger } from "@/lib/motion";

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
    <motion.section
      variants={stagger()}
      initial="hidden"
      animate="visible"
      className="px-1 pt-1 sm:px-2"
      aria-label="Hindi speaking goal"
    >
      <motion.p variants={fadeUp} className="eyebrow">
        Speak better Hindi
      </motion.p>
      <motion.h1
        variants={fadeUp}
        lang="hi"
        aria-label={currentTagline}
        // The typed text is decorative churn; aria-label above carries the real
        // sentence so screen readers are not fed it one character at a time.
        className="mt-2 text-balance font-hindi text-2xl font-bold leading-[1.5] tracking-display sm:text-3xl"
      >
        <span aria-hidden="true">
          {typedTagline.tagline === currentTagline ? typedTagline.text : ""}
        </span>
        <motion.span
          aria-hidden="true"
          animate={{ opacity: [1, 0.15, 1] }}
          transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
          className="ml-1 inline-block h-[0.9em] w-[3px] rounded-sm bg-accent align-[-0.08em]"
        />
      </motion.h1>
    </motion.section>
  );
}
