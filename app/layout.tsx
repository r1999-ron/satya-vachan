import type { Metadata } from "next";
import { Martel, Noto_Sans, Noto_Sans_Mono } from "next/font/google";
import { headers } from "next/headers";
import { AppShell } from "@/components/layout/AppShell";
import "./globals.css";

const notoSans = Noto_Sans({
  variable: "--font-noto-sans",
  subsets: ["latin"],
  display: "optional",
});

const notoSansMono = Noto_Sans_Mono({
  variable: "--font-noto-sans-mono",
  subsets: ["latin"],
  display: "optional",
});

const martel = Martel({
  variable: "--font-martel",
  subsets: ["devanagari", "latin"],
  weight: ["200", "300", "400", "600", "700", "800", "900"],
  display: "optional",
});

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

  const socialImage = new URL("/application-banner.png", metadataBase).toString();

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
    <html lang="en" data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var theme=localStorage.getItem('satya-vachan-theme');var isDark=theme?theme==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;document.documentElement.classList.toggle('dark',isDark);document.documentElement.style.colorScheme=isDark?'dark':'light'}catch(e){}})()`,
          }}
        />
      </head>
      <body className={`${notoSans.variable} ${notoSansMono.variable} ${martel.variable}`}>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
