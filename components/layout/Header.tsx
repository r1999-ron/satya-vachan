"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Home, Mic2, Sparkles } from "lucide-react";
import { ResilienceStatus } from "@/components/ui/ResilienceStatus";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/practice", label: "Practice", icon: Mic2 },
  { href: "/challenge", label: "Today", icon: Sparkles },
  { href: "/learned", label: "My Words", icon: BookOpen },
];

export function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-30 hidden border-b border-zinc-900/5 bg-[#fbf8f2]/88 backdrop-blur-xl md:block dark:border-white/10 dark:bg-zinc-950/80">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-5 px-6 py-3">
        <Link
          href="/"
          className="group flex min-w-0 items-center gap-2.5 rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-500"
        >
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-amber-500 text-white shadow-sm shadow-amber-900/15">
            <Sparkles size={18} aria-hidden="true" />
          </span>
          <span className="truncate text-base font-bold tracking-tight text-ink dark:text-white">
            Satya-Vachan
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

        <ResilienceStatus />
      </div>
    </header>
  );
}
