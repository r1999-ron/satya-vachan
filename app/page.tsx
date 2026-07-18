import { DailyChallenge } from "@/components/challenge/DailyChallenge";
import { DailyWordCard } from "@/components/home/DailyWordCard";
import { HindiText } from "@/components/hindi/HindiText";
import { SpeakBetterHindiTagline } from "@/components/home/SpeakBetterHindiTagline";
import { GlassCard } from "@/components/ui/GlassCard";
import { getWordOfTheDay } from "@/data/words";
import { getTodayKey } from "@/lib/dates";
import { cn } from "@/lib/utils";

export const revalidate = 3600;

export default function HomePage() {
  const today = new Date();
  const todayWord = getWordOfTheDay(today);

  return (
    <div className="mx-auto max-w-4xl space-y-4 sm:space-y-5">
      <SpeakBetterHindiTagline />

      <DailyWordCard initialDateKey={getTodayKey(today)} initialWord={todayWord} />

      <GlassCard className="p-4 sm:p-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <Detail label="Synonyms">
            <div className="flex flex-wrap gap-2">
              {todayWord.synonyms.map((synonym) => (
                <span
                  key={synonym.roman}
                  className="rounded-full bg-amber-100 px-3 py-1.5 text-xs font-semibold text-amber-950 dark:bg-amber-300/10 dark:text-amber-100"
                >
                  <HindiText text={synonym} kind="inline" />
                </span>
              ))}
            </div>
          </Detail>
          <Detail label="Usage note">
            <p className="text-sm font-normal leading-6 text-zinc-700 dark:text-zinc-300">
              {todayWord.usageNote}
            </p>
          </Detail>
        </div>
      </GlassCard>

      <DailyChallenge word={todayWord} />
    </div>
  );
}

function Detail({
  children,
  featured = false,
  label,
}: {
  children: React.ReactNode;
  featured?: boolean;
  label: string;
}) {
  return (
    <div className="min-w-0">
      <p
        className={cn(
          "mb-2 text-xs font-bold uppercase tracking-[0.14em]",
          featured
            ? "text-amber-800 dark:text-amber-200"
            : "text-zinc-500 dark:text-zinc-400",
        )}
      >
        {label}
      </p>
      {children}
    </div>
  );
}
