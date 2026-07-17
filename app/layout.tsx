import type { Metadata } from "next";
import { Noto_Sans, Noto_Sans_Mono } from "next/font/google";
import { AppShell } from "@/components/layout/AppShell";
import "./globals.css";

const notoSans = Noto_Sans({
  variable: "--font-noto-sans",
  subsets: ["latin"],
});

const notoSansMono = Noto_Sans_Mono({
  variable: "--font-noto-sans-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Satya-Vachan",
    template: "%s | Satya-Vachan",
  },
  description:
    "Thoughtful Hindi practice, one sentence at a time.",
  applicationName: "Satya-Vachan",
  metadataBase: new URL("https://satya-vachan.vercel.app"),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body className={`${notoSans.variable} ${notoSansMono.variable}`}>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
