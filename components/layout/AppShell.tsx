import type { ReactNode } from "react";
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-paper text-ink dark:bg-zinc-950 dark:text-zinc-50">
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-24 top-[-12rem] h-[34rem] w-[34rem] rounded-full bg-amber-300/45 blur-3xl motion-safe:animate-aurora dark:bg-amber-500/18" />
        <div className="absolute right-[-12rem] top-20 h-[36rem] w-[36rem] rounded-full bg-sky-300/40 blur-3xl motion-safe:animate-aurora dark:bg-sky-500/14" />
        <div className="absolute bottom-[-14rem] left-1/4 h-[32rem] w-[32rem] rounded-full bg-rose-300/35 blur-3xl motion-safe:animate-aurora dark:bg-rose-500/14" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.75),transparent_40%),linear-gradient(135deg,rgba(255,255,255,0.62),rgba(255,250,240,0.2))] dark:bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.08),transparent_38%)]" />
      </div>
      <Header />
      <main className="mx-auto w-full max-w-6xl px-4 pb-28 pt-5 motion-safe:animate-pageIn sm:px-6 md:pb-12 md:pt-8">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
