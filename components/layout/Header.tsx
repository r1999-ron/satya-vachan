"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Languages } from "lucide-react";
import { ResilienceStatus } from "@/components/ui/ResilienceStatus";
import { navItems } from "@/lib/nav";
import { useScriptPreference, useStreak } from "@/lib/storage";
import { cn } from "@/lib/utils";
import type { ScriptPreference } from "@/types";

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
    <header className="sticky top-0 z-30 border-b border-zinc-900/5 bg-[#fbf8f2]/88 backdrop-blur-xl dark:border-white/10 dark:bg-zinc-950/80">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:gap-5 sm:px-6">
        <Link
          href="/"
          prefetch={false}
          className="group flex min-w-0 items-center gap-2.5 rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-500"
        >
          <Image
            src="/logo.svg"
            alt=""
            aria-hidden="true"
            width={45}
            height={40}
            priority
            className="h-10 w-[45px] shrink-0 object-contain"
          />
          <span className="min-w-0 leading-normal">
            <span lang="hi" className="block truncate font-hindi text-lg font-bold leading-tight tracking-tight text-ink dark:text-white">
              सत्य-वचन
            </span>
            <span lang="hi" className="mt-0.5 hidden truncate font-hindi text-[9px] font-semibold leading-[1.6] tracking-[0.02em] text-[#d97706] sm:block dark:text-amber-300">
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
                className={cn(
                  "inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold transition",
                  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500",
                  active
                    ? "bg-zinc-900 text-white shadow-sm dark:bg-white dark:text-zinc-950"
                    : "text-zinc-600 hover:bg-black/5 hover:text-zinc-950 active:scale-95 dark:text-zinc-300 dark:hover:bg-white/10 dark:hover:text-white",
                )}
              >
                <Icon size={16} aria-hidden="true" />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="flex shrink-0 items-center gap-3">
          <StreakChip count={streak.currentStreak} />
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
          <span className="hidden lg:block"><ResilienceStatus /></span>
        </div>
      </div>
    </header>
  );
}

function StreakChip({ count }: { count: number }) {
  const [isOpen, setIsOpen] = useState(false);
  const dayLabel = count === 1 ? "day" : "days";

  return (
    <div className="relative">
      <button
        type="button"
        aria-expanded={isOpen}
        aria-label={`View ${count} ${dayLabel} streak`}
        onClick={() => setIsOpen((open) => !open)}
        className="inline-flex min-h-9 items-center gap-1 rounded-full bg-amber-100 px-3 text-sm font-bold text-amber-900 transition hover:bg-amber-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/55 focus-visible:ring-offset-2 focus-visible:ring-offset-[#f8f5ef] dark:bg-amber-300/12 dark:text-amber-100 dark:hover:bg-amber-300/20 dark:focus-visible:ring-offset-zinc-950"
      >
        <span aria-hidden="true">🔥</span>
        {count}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-2 w-40 rounded-xl border border-amber-200 bg-[#fdfbf7] p-3 text-right shadow-lg shadow-zinc-900/10 dark:border-amber-300/20 dark:bg-zinc-900 dark:shadow-black/20">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-amber-800 dark:text-amber-200">
            Current streak
          </p>
          <p className="mt-1 text-sm font-semibold text-zinc-700 dark:text-zinc-200">
            {count} {dayLabel}
          </p>
        </div>
      )}
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
      className="flex rounded-xl bg-zinc-900/[0.055] p-1 dark:bg-white/10"
      role="group"
      aria-label="Hindi script preference"
    >
      {scriptOptions.map((option) => (
        <button
          key={option.value}
          type="button"
          lang={option.language}
          onClick={() => onChange(option.value)}
          aria-pressed={preference === option.value}
          className={cn(
            "rounded-lg px-2.5 py-1.5 text-[11px] font-bold transition",
            option.value === "dev" && "font-hindi",
            preference === option.value
              ? "bg-white text-zinc-950 shadow-sm dark:bg-zinc-800 dark:text-white"
              : "text-zinc-500 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white",
          )}
        >
          {option.label}
        </button>
      ))}
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

  useEffect(() => {
    if (!open) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative sm:hidden">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Choose Hindi script"
        className="inline-flex size-9 items-center justify-center gap-1 rounded-xl bg-zinc-900/[0.055] text-xs font-bold text-zinc-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/55 dark:bg-white/10 dark:text-zinc-200"
      >
        <Languages size={15} aria-hidden="true" />
        <span className="sr-only">Aa</span>
      </button>
      {open ? (
        <div
          role="menu"
          aria-label="Hindi script preference"
          className="absolute right-0 top-11 z-50 min-w-36 rounded-xl border border-zinc-900/8 bg-[#fffdf8] p-1.5 shadow-xl dark:border-white/10 dark:bg-zinc-900"
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
                "flex w-full rounded-xl px-3 py-2 text-left text-xs font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/55",
                option.value === "dev" && "font-hindi",
                preference === option.value
                  ? "bg-amber-100 text-amber-950 dark:bg-amber-300/15 dark:text-amber-100"
                  : "text-zinc-600 hover:bg-zinc-900/5 dark:text-zinc-300 dark:hover:bg-white/8",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
