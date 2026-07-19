import { DailyWordSection } from "@/components/home/DailyWordSection";
import { SpeakBetterHindiTagline } from "@/components/home/SpeakBetterHindiTagline";
import { getWordOfTheDay } from "@/data/words";
import { getTodayKey } from "@/lib/dates";

export default function HomePage() {
  const today = new Date();
  const todayWord = getWordOfTheDay(today);

  return (
    <div className="mx-auto max-w-4xl space-y-4 sm:space-y-5">
      <SpeakBetterHindiTagline />

      <DailyWordSection initialDateKey={getTodayKey(today)} initialWord={todayWord} />
    </div>
  );
}
