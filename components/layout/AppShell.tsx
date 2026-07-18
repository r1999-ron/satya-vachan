import type { ReactNode } from "react";
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="relative min-h-screen bg-[#f8f5ef] text-ink dark:bg-zinc-950 dark:text-zinc-50">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_-5%_-10%,rgba(253,230,138,0.5),transparent_36%),radial-gradient(circle_at_105%_45%,rgba(254,243,199,0.48),transparent_32%),radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.8),transparent_48%)] dark:bg-[radial-gradient(circle_at_-5%_-10%,rgba(245,158,11,0.12),transparent_36%),radial-gradient(circle_at_105%_45%,rgba(245,158,11,0.08),transparent_32%),radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.06),transparent_42%)]" />
      <Header />
      <main className="mx-auto w-full max-w-6xl px-4 pb-[calc(6.75rem+env(safe-area-inset-bottom))] pt-4 sm:px-6 md:pb-16 md:pt-9">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
