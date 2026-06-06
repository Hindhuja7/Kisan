import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "KisanMitra AI — Autonomous Agri OS for Indian Farmers",
  description: "AI-powered supply chain manager: crop readiness, mandi intelligence, buyer negotiation, logistics & WhatsApp — Team Nexora",
  manifest: "/manifest.json",
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
