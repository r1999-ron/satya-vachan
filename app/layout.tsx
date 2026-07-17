import type { Metadata } from "next";
import { Martel, Noto_Sans, Noto_Sans_Mono } from "next/font/google";
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

const martel = Martel({
  variable: "--font-martel",
  subsets: ["devanagari", "latin"],
  weight: ["200", "300", "400", "600", "700", "800", "900"],
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
      <body className={`${notoSans.variable} ${notoSansMono.variable} ${martel.variable}`}>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
