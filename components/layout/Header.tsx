"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useRef, useState } from "react";
import { Flame, Languages, Leaf } from "lucide-react";
import { AccountMenu } from "@/components/auth/AccountMenu";
import { ThemeSwitcher } from "@/components/layout/ThemeSwitcher";
import { ResilienceStatus } from "@/components/ui/ResilienceStatus";
import { useDismissOnOutside } from "@/hooks/useDismissOnOutside";
import { getTodayKey, shiftDateKey } from "@/lib/dates";
import { scaleIn, transitions } from "@/lib/motion";
import { navItems } from "@/lib/nav";
import { useScriptPreference, useStreak } from "@/lib/storage";
import { cn } from "@/lib/utils";
import type { ScriptPreference, StreakState } from "@/types";

const scriptOptions: {
  value: ScriptPreference;
  label: string;
  language?: string;
}[] = [
  { value: "dev", label: "देव", language: "hi" },
  { value: "roman", label: "Roman", language: "hi-Latn" },
  { value: "both", label: "Both" },
];

export function Header() {
  const pathname = usePathname();
  const { preference, setScriptPreference } = useScriptPreference();
  const { streak } = useStreak();

  return (
    <header className="sticky top-0 z-30 border-b border-line/70 bg-canvas/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:gap-5 sm:px-6">
        <Link
          href="/"
          prefetch={false}
          className="group flex min-w-0 items-center gap-2.5 rounded-btn"
        >
          <motion.span
            whileHover={{ rotate: -6, scale: 1.06 }}
            transition={transitions.bouncy}
            className="shrink-0"
          >
            <Image
              src="/logo.svg"
              alt=""
              aria-hidden="true"
              width={45}
              height={40}
              priority
              className="h-10 w-[45px] object-contain"
            />
          </motion.span>
          <span className="min-w-0 leading-normal">
            <span
              lang="hi"
              className="block truncate font-hindi text-lg font-bold leading-tight tracking-display"
            >
              सत्य-वचन
            </span>
            <span
              lang="hi"
              className="mt-0.5 block truncate font-hindi text-[9px] font-semibold leading-[1.45] tracking-[0.02em] text-accent"
            >
              शुद्ध हिंदी बोलना सीखें
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary navigation">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;

            return (
              <Link
                key={href}
                href={href}
                prefetch={false}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative inline-flex items-center gap-2 rounded-btn px-3.5 py-2 text-sm font-semibold transition-colors",
                  active ? "text-content-invert" : "text-content-muted hover:text-content",
                )}
              >
                {active ? (
                  <motion.span
                    layoutId="header-nav-pill"
                    transition={transitions.snappy}
                    aria-hidden="true"
                    className="absolute inset-0 rounded-btn border-theme border-line bg-content shadow-btn"
                  />
                ) : null}
                <span className="relative inline-flex items-center gap-2">
                  <Icon size={16} aria-hidden="true" />
                  {label}
                </span>
              </Link>
            );
          })}
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <StreakChip streak={streak} />
          <div className="hidden sm:block">
            <ScriptPreferenceControl
              preference={preference}
              onChange={setScriptPreference}
            />
          </div>
          <MobileScriptPreferenceControl
            preference={preference}
            onChange={setScriptPreference}
          />
          <ThemeSwitcher />
          <AccountMenu />
          <span className="hidden lg:block">
            <ResilienceStatus />
          </span>
        </div>
      </div>
    </header>
  );
}

function StreakChip({ streak }: { streak: StreakState }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const count = streak.currentStreak;
  const dayLabel = count === 1 ? "day" : "days";
  const yesterdayKey = shiftDateKey(getTodayKey(), -1);
  const restDayJustUsed = streak.restDaysUsed.includes(yesterdayKey);

  const close = useCallback(() => setIsOpen(false), []);
  useDismissOnOutside(containerRef, isOpen, close);

  return (
    <div ref={containerRef} className="relative">
      <motion.button
        type="button"
        aria-expanded={isOpen}
        aria-label={`View ${count} ${dayLabel} streak`}
        onClick={() => setIsOpen((open) => !open)}
        whileTap={{ scale: 0.94 }}
        transition={transitions.snappy}
        className="inline-flex min-h-9 items-center gap-1.5 rounded-chip border-theme border-line bg-accent-soft px-2.5 text-sm font-bold text-content"
      >
        <motion.span
          aria-hidden="true"
          // A live streak breathes; a zeroed one sits still.
          animate={count > 0 ? { scale: [1, 1.14, 1] } : undefined}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          className="text-accent"
        >
          <Flame size={15} />
        </motion.span>
        {count}
      </motion.button>

      <AnimatePresence>
        {isOpen ? (
          <motion.div
            variants={scaleIn}
            initial="hidden"
            animate="visible"
            exit="exit"
            style={{ transformOrigin: "top right" }}
            className="popover absolute right-0 top-full z-50 mt-2 w-56 p-3 text-right"
          >
            <p className="eyebrow">Current streak</p>
            <p className="mt-1 text-sm font-semibold">
              {count} {dayLabel}
            </p>
            {streak.longestStreak > count ? (
              <p className="mt-0.5 text-xs text-content-muted">
                Longest: {streak.longestStreak} days
              </p>
            ) : null}

            <div className="mt-2 border-t border-line/60 pt-2">
              <p className="flex items-center justify-end gap-1.5 text-xs font-semibold text-success">
                <Leaf size={13} aria-hidden="true" />
                <span lang="hi" className="font-hindi">
                  विश्राम दिन
                </span>
                : {streak.restDayBank}
              </p>
              {restDayJustUsed ? (
                <p className="mt-1 text-[11px] leading-4 text-content-muted">
                  <span lang="hi" className="font-hindi">
                    कल विश्राम दिन था — आपकी streak सुरक्षित रही।
                  </span>
                </p>
              ) : (
                <p className="mt-1 text-[11px] leading-4 text-content-muted">
                  <span lang="hi" className="font-hindi">
                    हर 7 दिन पर 1 विश्राम दिन
                  </span>{" "}
                  — it quietly covers one missed day.
                </p>
              )}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function ScriptPreferenceControl({
  onChange,
  preference,
}: {
  onChange: (preference: ScriptPreference) => void;
  preference: ScriptPreference;
}) {
  return (
    <div
      className="flex rounded-btn bg-content/5 p-1"
      role="group"
      aria-label="Hindi script preference"
    >
      {scriptOptions.map((option) => {
        const active = preference === option.value;

        return (
          <button
            key={option.value}
            type="button"
            lang={option.language}
            onClick={() => onChange(option.value)}
            aria-pressed={active}
            className={cn(
              "relative rounded-chip px-2.5 py-1.5 text-[11px] font-bold transition-colors",
              option.value === "dev" && "font-hindi",
              active ? "text-content" : "text-content-subtle hover:text-content",
            )}
          >
            {active ? (
              <motion.span
                layoutId="script-preference-pill"
                transition={transitions.snappy}
                aria-hidden="true"
                className="absolute inset-0 rounded-chip border-theme border-line bg-surface shadow-btn"
              />
            ) : null}
            <span className="relative">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function MobileScriptPreferenceControl({
  onChange,
  preference,
}: {
  onChange: (preference: ScriptPreference) => void;
  preference: ScriptPreference;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const close = useCallback(() => setOpen(false), []);
  useDismissOnOutside(containerRef, open, close);

  return (
    <div ref={containerRef} className="relative sm:hidden">
      <motion.button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Choose Hindi script"
        whileTap={{ scale: 0.92 }}
        transition={transitions.snappy}
        className="icon-btn size-9"
      >
        <Languages size={16} aria-hidden="true" />
      </motion.button>

      <AnimatePresence>
        {open ? (
          <motion.div
            role="menu"
            aria-label="Hindi script preference"
            variants={scaleIn}
            initial="hidden"
            animate="visible"
            exit="exit"
            style={{ transformOrigin: "top right" }}
            className="popover absolute right-0 top-11 z-50 min-w-36 p-1.5"
          >
            {scriptOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                role="menuitemradio"
                lang={option.language}
                aria-checked={preference === option.value}
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full rounded-chip px-3 py-2 text-left text-xs font-semibold transition",
                  option.value === "dev" && "font-hindi",
                  preference === option.value
                    ? "bg-accent-soft text-content"
                    : "text-content-muted hover:bg-content/5",
                )}
              >
                {option.label}
              </button>
            ))}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
