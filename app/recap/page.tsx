import type { Metadata } from "next";
import { RecapView } from "@/components/recap/RecapView";

export const metadata: Metadata = {
  title: "Monthly recap",
  description:
    "A calm, once-a-month look back at the Hindi you practiced, played, and made your own.",
};

export default function RecapPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <RecapView />
    </div>
  );
}
