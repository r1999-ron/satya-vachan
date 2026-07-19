"use client";

import { useState } from "react";
import { DailyChallenge } from "@/components/challenge/DailyChallenge";
import { DailyWordCard } from "@/components/home/DailyWordCard";
import { getWordOfTheDay } from "@/data/words";
import { dateFromKey, shiftDateKey } from "@/lib/dates";
import type { WordEntry } from "@/types";

export function DailyWordSection({
  initialDateKey,
  initialWord,
}: {
  initialDateKey: string;
  initialWord: WordEntry;
}) {
  const [selectedDateKey, setSelectedDateKey] = useState(initialDateKey);
  const isToday = selectedDateKey === initialDateKey;
  const word = isToday ? initialWord : getWordOfTheDay(dateFromKey(selectedDateKey));

  const goToPreviousDay = () => {
    setSelectedDateKey((current) => shiftDateKey(current, -1));
  };

  const goToNextDay = () => {
    setSelectedDateKey((current) =>
      current < initialDateKey ? shiftDateKey(current, 1) : current,
    );
  };

  return (
    <>
      <DailyWordCard
        isToday={isToday}
        onNextDay={goToNextDay}
        onPreviousDay={goToPreviousDay}
        selectedDateKey={selectedDateKey}
        word={word}
      />
      <DailyChallenge key={word.id} isToday={isToday} word={word} />
    </>
  );
}
