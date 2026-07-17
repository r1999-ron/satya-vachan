"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Home, Mic2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/practice", label: "Practice", icon: Mic2 },
  { href: "/challenge", label: "Today", icon: Sparkles },
  { href: "/learned", label: "My Words", icon: BookOpen },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-3 bottom-[calc(0.75rem+env(safe-area-inset-bottom))] z-40 rounded-[1.2rem] border border-zinc-900/8 bg-white/88 p-1.5 shadow-[0_12px_34px_rgba(24,20,16,0.14)] backdrop-blur-2xl md:hidden dark:border-white/12 dark:bg-zinc-950/88"
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
                "flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-xl px-1 text-[11px] font-semibold transition",
                "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500",
                active
                  ? "bg-zinc-900 text-white shadow-sm motion-safe:animate-savePop dark:bg-white dark:text-zinc-950"
                  : "text-zinc-600 hover:bg-black/5 active:scale-95 dark:text-zinc-300 dark:hover:bg-white/10",
              )}
            >
              <Icon size={18} aria-hidden="true" />
              <span className="max-w-full truncate">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
