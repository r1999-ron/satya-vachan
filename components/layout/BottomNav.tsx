"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Home, Mic2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/practice", label: "Practice", icon: Mic2 },
  { href: "/challenge", label: "Challenge", icon: Sparkles },
  { href: "/learned", label: "Learned", icon: BookOpen },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-3 bottom-3 z-40 rounded-2xl border border-white/55 bg-white/70 p-1.5 shadow-glass backdrop-blur-2xl md:hidden dark:border-white/12 dark:bg-zinc-950/72"
      aria-label="Primary navigation"
    >
      <div className="grid grid-cols-4 gap-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl px-1 text-[11px] font-semibold transition",
                "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500",
                active
                  ? "bg-amber-500 text-white shadow-lg shadow-amber-500/25"
                  : "text-zinc-700 hover:bg-white/70 active:scale-95 dark:text-zinc-200 dark:hover:bg-white/10",
              )}
            >
              <Icon size={19} aria-hidden="true" />
              <span className="max-w-full truncate">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
