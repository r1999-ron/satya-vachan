import type { ReactNode } from "react";
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f8f5ef] text-ink dark:bg-zinc-950 dark:text-zinc-50">
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-40 top-[-18rem] h-[38rem] w-[38rem] rounded-full bg-amber-200/40 blur-3xl dark:bg-amber-500/12" />
        <div className="absolute right-[-16rem] top-1/3 h-[34rem] w-[34rem] rounded-full bg-sky-200/28 blur-3xl dark:bg-sky-500/10" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.8),transparent_48%)] dark:bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.06),transparent_42%)]" />
      </div>
      <Header />
      <main className="mx-auto w-full max-w-6xl px-4 pb-[calc(5.75rem+env(safe-area-inset-bottom))] pt-4 motion-safe:animate-pageIn sm:px-6 md:pb-16 md:pt-9">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
