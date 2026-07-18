import type { Metadata } from "next";
import { Martel, Noto_Sans, Noto_Sans_Mono } from "next/font/google";
import { headers } from "next/headers";
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

const description = "Thoughtful Hindi practice, one sentence at a time.";

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
    // Keep the stable public fallback for malformed proxy headers.
  }

  const socialImage = new URL("/og.png", metadataBase).toString();

  return {
    title: {
      default: "Satya-Vachan",
      template: "%s | Satya-Vachan",
    },
    description,
    applicationName: "Satya-Vachan",
    metadataBase,
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
}

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
