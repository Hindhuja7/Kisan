"use client";

import { useEffect, useState } from "react";
import { fetchApi } from "@/lib/api";
import { DashboardStats, FarmerProfile, Language } from "@/lib/types";
import StatsBar from "@/components/StatsBar";
import AgentPanel from "@/components/AgentPanel";
import MandiPrices from "@/components/MandiPrices";
import WhatsAppChat from "@/components/WhatsAppChat";
import DemoWorkflow from "@/components/DemoWorkflow";

type Tab = "crop" | "price" | "negotiate" | "whatsapp";

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "crop", label: "Crop Readiness", icon: "🌾" },
  { id: "price", label: "Mandi Prices", icon: "📈" },
  { id: "negotiate", label: "Buyer Deal", icon: "🤝" },
  { id: "whatsapp", label: "WhatsApp", icon: "💬" },
];

export default function Home() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [farmer, setFarmer] = useState<FarmerProfile | null>(null);
  const [tab, setTab] = useState<Tab>("crop");
  const [language, setLanguage] = useState<Language>("te");
  const [crop, setCrop] = useState("Tomato");

  function refresh() {
    fetchApi<DashboardStats>("/api/dashboard/stats").then(setStats).catch(() => {});
  }

  useEffect(() => {
    refresh();
    fetchApi<FarmerProfile>("/api/farmer/farmer-001").then(setFarmer).catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0f0d]">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
      </div>

      <header className="relative border-b border-white/10 bg-black/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center text-xl">🌱</div>
            <div>
              <h1 className="font-bold text-white">KisanMitra AI</h1>
              <p className="text-xs text-emerald-400/80">CrewAI · GPT-4o · Supabase</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as Language)}
              className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-white"
            >
              <option value="te" className="bg-gray-900">తెలుగు</option>
              <option value="hi" className="bg-gray-900">हिंदी</option>
              <option value="en" className="bg-gray-900">English</option>
            </select>
            {farmer && (
              <div className="text-right hidden sm:block">
                <p className="text-sm text-white">{farmer.name}</p>
                <p className="text-xs text-gray-500">{farmer.district}</p>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="relative max-w-5xl mx-auto px-4 py-8 space-y-6">
        <section className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold text-white">
            Autonomous Agri Supply Chain{" "}
            <span className="text-emerald-400">MVP</span>
          </h2>
          <p className="text-gray-400 text-sm max-w-xl mx-auto">
            Crop readiness · Mandi intelligence · Buyer negotiation · WhatsApp farmer UX
          </p>
        </section>

        <StatsBar stats={stats} />
        <DemoWorkflow language={language} onComplete={refresh} />

        <div className="flex gap-1 p-1 bg-white/5 rounded-2xl border border-white/10 overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`flex-1 min-w-[100px] px-3 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                tab === t.id ? "bg-emerald-600 text-white" : "text-gray-400 hover:text-white"
              }`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        <section className="p-6 rounded-3xl bg-white/5 border border-white/10">
          {tab === "crop" && (
            <AgentPanel
              title="Crop Readiness Agent"
              icon="🌾"
              endpoint="/api/agents/crop-readiness"
              description="IoT sensors + Sentinel-2 NDVI → harvest window prediction via CrewAI"
              language={language}
              onResult={refresh}
            />
          )}

          {tab === "price" && (
            <div className="space-y-6">
              <AgentPanel
                title="Price Intelligence Agent"
                icon="📈"
                endpoint="/api/agents/price-intelligence"
                description="Scans 120+ mandis, forecasts trends, recommends best market"
                language={language}
                onResult={refresh}
              />
              <div className="border-t border-white/10 pt-6">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-white font-medium">Live Mandi Board</h4>
                  <select
                    value={crop}
                    onChange={(e) => setCrop(e.target.value)}
                    className="bg-white/5 border border-white/10 rounded-lg px-3 py-1 text-sm text-white"
                  >
                    {["Tomato", "Onion", "Chilli", "Cotton", "Paddy", "Maize"].map((c) => (
                      <option key={c} value={c} className="bg-gray-900">{c}</option>
                    ))}
                  </select>
                </div>
                <MandiPrices crop={crop} />
              </div>
            </div>
          )}

          {tab === "negotiate" && (
            <AgentPanel
              title="Buyer Negotiation Agent"
              icon="🤝"
              endpoint="/api/agents/negotiate"
              description="AI simulates multi-round negotiation with verified buyers"
              showQuantity
              language={language}
              onResult={refresh}
            />
          )}

          {tab === "whatsapp" && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-white">Farmer WhatsApp Interface</h3>
                <p className="text-sm text-gray-400">
                  GPT-4o replies in Telugu/Hindi/English · messages stored in Supabase
                </p>
              </div>
              <WhatsAppChat phone={farmer?.phone} crop={crop} language={language} />
            </div>
          )}
        </section>
      </main>

      <footer className="text-center py-8 text-gray-600 text-xs">
        KisanMitra AI · Team Nexora · HackArena 2.0
      </footer>
    </div>
  );
}
