import { DailyWordSection } from "@/components/home/DailyWordSection";
import { PuzzleCallout } from "@/components/home/PuzzleCallout";
import { RecapCallout } from "@/components/home/RecapCallout";
import { SpeakBetterHindiTagline } from "@/components/home/SpeakBetterHindiTagline";
import { StatsStrip } from "@/components/home/StatsStrip";
import { RevisionCallout } from "@/components/review/RevisionCallout";
import { getWordOfTheDay } from "@/data/words";
import { getTodayKey } from "@/lib/dates";

export default function HomePage() {
  const today = new Date();
  const todayWord = getWordOfTheDay(today);

  return (
    // Reads top-to-bottom as why → where you are → what's owed → today's word →
    // today's practice. Callouts are transient: each hides itself once its
    // moment has passed, so a fully-completed day reads calm.
    <div className="mx-auto max-w-3xl space-y-5 sm:space-y-6">
      <SpeakBetterHindiTagline />

      <StatsStrip />

      <RevisionCallout />

      <RecapCallout />

      <PuzzleCallout />

      <DailyWordSection initialDateKey={getTodayKey(today)} initialWord={todayWord} />
    </div>
  );
}
