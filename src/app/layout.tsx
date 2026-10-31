import type { Metadata, Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = {
  themeColor: "#0B0F19",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "Cavrix Cloud • Enterprise Cloud VPS & Discord Bot Automation",
  description:
    "High-performance AMD EPYC™ and Ryzen 9 KVM VPS with instant provisioning, 2.5+ Tbps Path.net Anti-DDoS, and 24/7 AI-augmented Discord management.",
  keywords: [
    "Cavrix Cloud",
    "Cloud VPS",
    "KVM VPS",
    "Discord Bot",
    "Game Server Hosting",
    "DDoS Protected VPS",
    "AMD EPYC",
    "Frankfurt VPS",
    "NVMe Hosting",
  ],
  authors: [{ name: "Cavrix Cloud Infrastructure Inc." }],
  openGraph: {
    title: "Cavrix Cloud • Enterprise Cloud VPS & Discord Bot Automation",
    description:
      "Deploy dedicated AMD EPYC™ & Ryzen 9 KVM instances in seconds. Integrated 24/7 Discord Bot gateway & Web Console.",
    url: "https://cavrix.cloud",
    siteName: "Cavrix Cloud",
    locale: "en_US",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark scroll-smooth">
      <body className="bg-background text-foreground antialiased selection:bg-accent selection:text-black">
        {children}
      </body>
    </html>
  );
}
