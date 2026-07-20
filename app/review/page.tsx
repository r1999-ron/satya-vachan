import type { Metadata } from "next";
import { ReviewSession } from "@/components/review/ReviewSession";

export const metadata: Metadata = {
  title: "Revision",
  description:
    "Bring your saved Hindi words back into speech on a widening schedule, one spoken sentence at a time.",
};

export default function ReviewPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-4 sm:space-y-5">
      <header className="px-1">
        <h1 className="text-2xl font-bold tracking-[-0.025em] text-ink sm:text-3xl dark:text-white">
          Revision
        </h1>
        <p className="mt-2 text-sm font-normal leading-7 text-zinc-600 dark:text-zinc-400">
          Words you have saved come back here on a widening schedule. Say a fresh
          sentence with each one so it moves from recognition into your own speech.
        </p>
      </header>

      <ReviewSession />
    </div>
  );
}
