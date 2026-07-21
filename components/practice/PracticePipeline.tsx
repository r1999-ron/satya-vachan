"use client";

import { Check, Mic, Sparkles, Volume2 } from "lucide-react";
import { motion } from "motion/react";
import { transitions } from "@/lib/motion";
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
        <motion.span
          key={dot}
          className="size-1 rounded-full bg-current"
          animate={{ y: [0, -3, 0], opacity: [0.32, 1, 0.32] }}
          transition={{
            duration: 0.9,
            repeat: Infinity,
            ease: "easeInOut",
            delay: dot * 0.13,
          }}
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
              <motion.div
                animate={{ scale: isCurrent ? 1.08 : 1 }}
                transition={transitions.snappy}
                className={cn(
                  "relative grid size-8 place-items-center overflow-hidden rounded-full border-theme text-xs transition-colors",
                  isComplete
                    ? "border-success/50 bg-success-soft text-success"
                    : isCurrent
                      ? "border-accent bg-accent-soft text-accent"
                      : "border-line bg-surface-2 text-content-subtle",
                )}
              >
                {isComplete ? (
                  <Check size={14} aria-hidden="true" />
                ) : (
                  <Icon size={14} aria-hidden="true" />
                )}
              </motion.div>
              <div className="eyebrow mt-1.5 whitespace-nowrap text-[10px]">
                {stateLabel ?? label}
                {status === "recording" && index === 0 ? <PulsingDots /> : null}
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
