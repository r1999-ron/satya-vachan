import { DailyWordSection } from "@/components/home/DailyWordSection";
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
    // today's practice.
    <div className="mx-auto max-w-3xl space-y-5 sm:space-y-6">
      <SpeakBetterHindiTagline />

      <StatsStrip />

      <RevisionCallout />

      <DailyWordSection initialDateKey={getTodayKey(today)} initialWord={todayWord} />
    </div>
  );
}
