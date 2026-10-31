import type { Metadata, Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = {
  themeColor: "#050505",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "Cavrix Bot Control Panel • Server 1528401268354056293",
  description:
    "Dedicated Discord Bot Management, Real-time Queue Dispatch, and Staff Activity Telemetry for Server 1528401268354056293.",
  keywords: [
    "Cavrix Cloud",
    "Discord Bot",
    "Staff Tracking",
    "Ticket Management",
    "Bot Control Panel",
  ],
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
