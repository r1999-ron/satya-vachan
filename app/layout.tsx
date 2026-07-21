import type { Metadata } from "next";
import {
  Anek_Devanagari,
  Fraunces,
  Inter,
  JetBrains_Mono,
  Martel,
  Space_Grotesk,
} from "next/font/google";
import { headers } from "next/headers";
import { AppShell } from "@/components/layout/AppShell";
import { THEME_BOOTSTRAP_SCRIPT } from "@/lib/theme";
import "./globals.css";

/*
 * Typography is theme-owned: `globals.css` points --font-display/-ui/-hindi at
 * one of these families per theme. Classic pairs a warm old-style serif with a
 * neutral UI sans; Neo Brutal runs a single tight grotesque throughout.
 */

// Classic — Latin display. Optical-size axis keeps large headings elegant
// without the body text turning spindly.
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  weight: ["400", "600", "700", "900"],
  display: "swap",
});

// Classic — Latin UI/body.
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

// Neo Brutal — Latin display and UI.
const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  display: "swap",
});

// Classic — Devanagari. Chosen over the more calligraphic Tiro Devanagari
// Hindi because that family ships weight 400 only, which cannot carry the
// large display word on the home card.
const martel = Martel({
  variable: "--font-martel",
  subsets: ["devanagari", "latin"],
  weight: ["200", "300", "400", "600", "700", "800", "900"],
  display: "swap",
});

// Neo Brutal — Devanagari. Variable to 800, which the theme leans on hard.
const anekDevanagari = Anek_Devanagari({
  variable: "--font-anek",
  subsets: ["devanagari", "latin"],
  display: "swap",
});

const jetBrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

const fontVariables = [
  fraunces.variable,
  inter.variable,
  spaceGrotesk.variable,
  martel.variable,
  anekDevanagari.variable,
  jetBrainsMono.variable,
].join(" ");

const brandName = "सत्य-वचन";
const description = "शुद्ध हिंदी बोलना सीखें। Thoughtful Hindi practice, one sentence at a time.";

export async function generateMetadata(): Promise<Metadata> {
  const incomingHeaders = await headers();
  const host =
    incomingHeaders.get("x-forwarded-host") ??
    incomingHeaders.get("host") ??
    "satya-vachan.vercel.app";
  const protocol =
    incomingHeaders.get("x-forwarded-proto") ??
    (host.startsWith("localhost") ? "http" : "https");
  let metadataBase = new URL("https://satya-vachan.vercel.app");

  try {
    metadataBase = new URL(`${protocol}://${host}`);
  } catch {
    // Retain the stable public fallback for malformed proxy headers.
  }

  const socialImage = new URL("/application-banner.jpg", metadataBase).toString();

  return {
    title: { default: brandName, template: `%s | ${brandName}` },
    description,
    applicationName: brandName,
    metadataBase,
    icons: {
      icon: "/logo.svg",
      shortcut: "/logo.svg",
      apple: "/logo.svg",
    },
    openGraph: {
      type: "website",
      title: brandName,
      description,
      images: [
        {
          url: socialImage,
          width: 1728,
          height: 909,
          alt: "सत्य-वचन Hindi expression coach",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: brandName,
      description,
      images: [socialImage],
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // The font variables must live on <html>, the same element the theme blocks
    // in globals.css are scoped to: those blocks resolve `--font-ui:
    // var(--font-space-grotesk)`, and a var() only sees custom properties
    // declared on that element or an ancestor. Declaring them on <body> would
    // leave `--font-ui` invalid and silently drop every font to the default.
    <html
      lang="en"
      data-theme="classic"
      data-scroll-behavior="smooth"
      className={fontVariables}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP_SCRIPT }} />
      </head>
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
