"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { transitions } from "@/lib/motion";
import { navItems } from "@/lib/nav";
import { cn } from "@/lib/utils";

export function BottomNav() {
  const pathname = usePathname();

  return (
    <motion.nav
      initial={{ y: 32, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ ...transitions.soft, delay: 0.1 }}
      className="fixed inset-x-3 bottom-[calc(0.75rem+env(safe-area-inset-bottom))] z-40 rounded-card border-theme-card border-line bg-surface p-1.5 shadow-card md:hidden"
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
                "relative flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-btn px-1 text-[11px] font-semibold transition-colors",
                primary
                  ? "-top-5 font-bold text-content"
                  : active
                    ? "text-content-invert"
                    : "text-content-muted",
              )}
            >
              {/* The raised Practice action is its own visual anchor, so the
                  sliding pill only tracks the flat tabs. */}
              {active && !primary ? (
                <motion.span
                  layoutId="bottom-nav-pill"
                  transition={transitions.snappy}
                  aria-hidden="true"
                  className="absolute inset-0 rounded-btn border-theme border-line bg-content"
                />
              ) : null}

              <motion.span
                whileTap={{ scale: 0.9 }}
                transition={transitions.snappy}
                className={cn(
                  "relative",
                  primary &&
                    "grid size-14 place-items-center rounded-full border-4 border-canvas bg-content text-content-invert shadow-btn",
                  primary && active && "bg-accent text-accent-fg",
                )}
              >
                <Icon size={primary ? 24 : 18} aria-hidden="true" />
              </motion.span>
              <span className="relative max-w-full truncate">{label}</span>
            </Link>
          );
        })}
      </div>
    </motion.nav>
  );
}
