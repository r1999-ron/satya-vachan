import type { Metadata } from "next";
import { Martel, Noto_Sans } from "next/font/google";
import { AppShell } from "@/components/layout/AppShell";
import "./globals.css";

const notoSans = Noto_Sans({
  variable: "--font-noto-sans",
  subsets: ["latin"],
  display: "optional",
});

const martel = Martel({
  variable: "--font-martel",
  subsets: ["devanagari"],
  weight: ["400", "700"],
  display: "optional",
});

const description = "Thoughtful Hindi practice, one sentence at a time.";
const socialImage = "/og.png";

export const metadata: Metadata = {
  title: {
    default: "Satya-Vachan",
    template: "%s | Satya-Vachan",
  },
  description,
  applicationName: "Satya-Vachan",
  metadataBase: new URL("https://satya-vachan.vercel.app"),
  icons: {
    icon: "/logo.svg",
    shortcut: "/logo.svg",
    apple: "/logo.svg",
  },
  openGraph: {
    type: "website",
    title: "Satya-Vachan",
    description,
    images: [
      {
        url: socialImage,
        width: 1728,
        height: 909,
        alt: "Satya-Vachan Hindi expression coach",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Satya-Vachan",
    description,
    images: [socialImage],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body className={`${notoSans.variable} ${martel.variable}`}>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
