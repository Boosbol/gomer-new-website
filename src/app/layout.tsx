import type { Metadata, Viewport } from "next";
import { Red_Hat_Display, Red_Hat_Text, Rubik_Dirt } from "next/font/google";
import type { ReactNode } from "react";
import { site } from "@/config/site";
import "./globals.css";

const display = Red_Hat_Display({ subsets: ["latin"], variable: "--font-redhat-display", display: "swap" });
const sans = Red_Hat_Text({ subsets: ["latin"], variable: "--font-redhat-text", display: "swap" });
const stamp = Rubik_Dirt({ subsets: ["latin"], weight: "400", variable: "--font-rubik-dirt", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: `${site.name} — Music`, template: `%s | ${site.name}` },
  description: site.description,
  applicationName: site.name,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: site.name,
    locale: "en_AU",
    url: site.url,
    title: `${site.name} — Music`,
    description: site.description,
  },
  twitter: { card: "summary_large_image", title: `${site.name} — Music`, description: site.description },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#1b1b1b",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable} ${stamp.variable}`}>
      <body className="flex min-h-dvh flex-col">
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
