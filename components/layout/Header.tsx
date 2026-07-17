"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Home, Mic2, Sparkles } from "lucide-react";
import { ResilienceStatus } from "@/components/ui/ResilienceStatus";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/practice", label: "Practice", icon: Mic2 },
  { href: "/challenge", label: "Daily Challenge", icon: Sparkles },
  { href: "/learned", label: "Learned Words", icon: BookOpen },
];

export function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-30 hidden border-b border-white/35 bg-paper/55 backdrop-blur-2xl md:block dark:border-white/10 dark:bg-zinc-950/45">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-5 px-6 py-4">
        <Link
          href="/"
          className="group flex min-w-0 items-center gap-3 rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-500"
        >
          <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-amber-200/80 bg-white/60 shadow-glow dark:border-amber-300/20 dark:bg-white/10">
            <Sparkles size={20} className="text-amber-600" aria-hidden="true" />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-base font-bold text-ink dark:text-white">
              Satya-Vachan
            </span>
            <span className="block truncate text-xs text-zinc-600 dark:text-zinc-400">
              Hindi expression coach
            </span>
          </span>
        </Link>

        <nav className="flex items-center gap-1" aria-label="Primary navigation">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;

            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition",
                  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500",
                  active
                    ? "bg-white/75 text-amber-800 shadow-sm dark:bg-white/12 dark:text-amber-100"
                    : "text-zinc-700 hover:bg-white/50 active:scale-95 dark:text-zinc-200 dark:hover:bg-white/10",
                )}
              >
                <Icon size={16} aria-hidden="true" />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <ResilienceStatus />
          <StatusBadge tone="green">0 day streak</StatusBadge>
        </div>
      </div>
    </header>
  );
}
