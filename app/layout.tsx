import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { AppShell } from "@/components/layout/AppShell";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Satya-Vachan",
    template: "%s | Satya-Vachan",
  },
  description:
    "An AI-powered Hindi expression coach for polished, graceful spoken Hindi.",
  applicationName: "Satya-Vachan",
  metadataBase: new URL("https://satya-vachan.vercel.app"),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={geistSans.variable}>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
