import type { Metadata } from "next";
import { PuzzleSession } from "@/components/play/PuzzleSession";

export const metadata: Metadata = {
  title: "Play",
  description:
    "A small daily word game: complete elegant Hindi sentences by choosing the word that belongs in them.",
};

export default function PlayPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-4 sm:space-y-5">
      <header className="px-1">
        <h1 className="font-display text-2xl font-bold tracking-display sm:text-3xl">
          Daily word game
        </h1>
        <p className="mt-2 text-sm leading-7 text-content-muted">
          Five sentences, one missing word each. Choose the form that makes the
          sentence sing — the same five await everyone today.
        </p>
      </header>

      <PuzzleSession />
    </div>
  );
}
