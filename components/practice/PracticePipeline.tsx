import { Check, ChevronRight, Mic, Sparkles, Volume2 } from "lucide-react";
import { cn } from "@/lib/utils";

type PracticePipelineStatus =
  | "idle"
  | "recording"
  | "transcribing"
  | "transcriptReady"
  | "transforming"
  | "resultReady"
  | "ttsLoading"
  | "error";

type PracticePipelineProps = {
  status: PracticePipelineStatus;
};

const steps = [
  { label: "Record", icon: Mic },
  { label: "Transcribe", icon: Check },
  { label: "Enhance", icon: Sparkles },
  { label: "Listen", icon: Volume2 },
] as const;

function getProgress(status: PracticePipelineStatus) {
  switch (status) {
    case "recording":
      return 0;
    case "transcribing":
      return 1;
    case "transforming":
    case "transcriptReady":
      return 2;
    case "ttsLoading":
    case "resultReady":
      return 3;
    default:
      return 0;
  }
}

function getStateLabel(status: PracticePipelineStatus, index: number) {
  if (status === "recording" && index === 0) return "Listening";
  if (status === "transcribing" && index === 1) return "Writing";
  if (status === "transforming" && index === 2) return "Elevating";
  if (status === "ttsLoading" && index === 3) return "Preparing";
  return null;
}

function PulsingDots() {
  return (
    <span className="ml-1 inline-flex items-end gap-0.5" aria-hidden="true">
      {[0, 1, 2].map((dot) => (
        <span
          key={dot}
          className="size-1 rounded-full bg-current motion-safe:animate-pipelineDot"
          style={{ animationDelay: `${dot * 130}ms` }}
        />
      ))}
    </span>
  );
}

export function PracticePipeline({ status }: PracticePipelineProps) {
  const currentStep = getProgress(status);

  return (
    <ol aria-label="Practice pipeline" className="mb-6 flex items-start">
      {steps.map(({ icon: Icon, label }, index) => {
        const isCurrent = index === currentStep;
        const isComplete = index < currentStep || status === "resultReady";
        const stateLabel = isCurrent ? getStateLabel(status, index) : null;

        return (
          <li key={label} className="flex min-w-0 flex-1 items-start last:flex-none">
            <div className="min-w-0">
              <div
                className={cn(
                  "relative grid size-8 place-items-center overflow-hidden rounded-full border text-xs transition-colors",
                  isComplete
                    ? "border-sage/25 bg-sage/15 text-sage dark:border-sage/35 dark:bg-sage/20 dark:text-[#b9c9b0]"
                    : isCurrent
                      ? index === 2
                        ? "border-amber-300 bg-amber-100 text-amber-800 shadow-[0_0_20px_rgba(245,158,11,0.2)] dark:border-amber-300/35 dark:bg-amber-300/12 dark:text-amber-100"
                        : "border-ink/12 bg-white/65 text-ink dark:border-white/15 dark:bg-white/8 dark:text-white"
                      : "border-zinc-900/8 bg-white/35 text-zinc-400 dark:border-white/10 dark:bg-white/5 dark:text-zinc-500",
                )}
              >
                {isCurrent && index === 2 ? (
                  <span className="absolute inset-y-0 w-1/2 -translate-x-[220%] bg-gradient-to-r from-transparent via-white/75 to-transparent motion-safe:animate-shimmer" />
                ) : null}
                {isComplete ? <Check size={14} aria-hidden="true" /> : <Icon size={14} aria-hidden="true" />}
              </div>
              <div className="mt-1.5 whitespace-nowrap text-[10px] font-bold uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-400">
                {stateLabel ?? label}
                {status === "recording" && index === 0 ? <PulsingDots /> : null}
              </div>
            </div>
            {index < steps.length - 1 ? (
              <ChevronRight
                className={cn(
                  "mx-1 mt-2 shrink-0 sm:mx-2",
                  index < currentStep ? "text-sage" : "text-zinc-300 dark:text-zinc-700",
                )}
                size={14}
                aria-hidden="true"
              />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
