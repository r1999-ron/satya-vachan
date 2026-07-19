"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navItems } from "@/lib/nav";
import { cn } from "@/lib/utils";

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-3 bottom-[calc(0.75rem+env(safe-area-inset-bottom))] z-40 rounded-2xl border border-zinc-900/8 bg-white/95 p-1.5 shadow-[0_12px_34px_rgba(24,20,16,0.14)] md:hidden dark:border-white/12 dark:bg-zinc-950/95"
      aria-label="Primary navigation"
    >
      <div className="grid grid-cols-3 gap-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          const primary = href === "/practice";

          return (
            <Link
              key={href}
              href={href}
              prefetch={false}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-xl px-1 text-[11px] font-semibold transition",
                "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500",
                active && !primary
                  ? "bg-zinc-900 text-white shadow-sm motion-safe:animate-savePop dark:bg-white dark:text-zinc-950"
                  : "text-zinc-600 hover:bg-black/5 active:scale-95 dark:text-zinc-300 dark:hover:bg-white/10",
                primary && "relative -top-5 font-bold text-zinc-900 dark:text-white",
              )}
            >
              <span
                className={cn(
                  primary && "grid size-14 place-items-center rounded-full border-4 border-[#f8f5ef] bg-zinc-900 text-white shadow-lg shadow-zinc-900/25 dark:border-zinc-950 dark:bg-white dark:text-zinc-950",
                  primary && active && "bg-amber-400 text-zinc-950 dark:bg-amber-300",
                )}
              >
                <Icon size={primary ? 24 : 18} aria-hidden="true" />
              </span>
              <span className="max-w-full truncate">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
