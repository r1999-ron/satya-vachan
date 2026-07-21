import type { ReactNode } from "react";
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";
import { MotionProvider } from "@/components/layout/MotionProvider";

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="relative min-h-screen bg-canvas text-content">
      <div className="app-backdrop" aria-hidden="true" />
      <Header />
      <main className="mx-auto w-full max-w-5xl px-3 pb-[calc(6.25rem+env(safe-area-inset-bottom))] pt-4 sm:px-6 sm:pt-6 md:pb-16 md:pt-10">
        <MotionProvider>{children}</MotionProvider>
      </main>
      <BottomNav />
    </div>
  );
}
