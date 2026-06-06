import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "KisanMitra AI — Autonomous Agri Supply Chain",
  description:
    "Multi-agent AI platform for Indian farmers — crop readiness, mandi prices, cold storage, buyer negotiation, logistics & finance. Team Nexora · HackArena 2.0",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "KisanMitra AI",
  },
};

export const viewport: Viewport = {
  themeColor: "#059669",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
