"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { fetchApi, checkBackendHealth } from "@/lib/api";
import { DashboardStats, FarmerOverview, FarmerProfile, Language, WorkflowResult } from "@/lib/types";
import { cropLabel, useFarmerCopy } from "@/lib/farmerCopy";
import { getSession, logout, FarmerUser } from "@/lib/auth";
import { preloadVoices } from "@/lib/voice";
import KPICards from "@/components/KPICards";
import FarmerDashboard from "@/components/FarmerDashboard";
import FullDemoMode from "@/components/FullDemoMode";
import NegotiationTheater from "@/components/NegotiationTheater";
import LogisticsTracker from "@/components/LogisticsTracker";
import WhatsAppChat from "@/components/WhatsAppChat";
import MandiPrices from "@/components/MandiPrices";
import AccessLinks from "@/components/AccessLinks";
import GlassCard from "@/components/ui/GlassCard";

const CROP_OPTIONS = ["Tomato", "Onion", "Chilli", "Cotton", "Paddy", "Maize"];

export default function DashboardPage() {
  const router = useRouter();
  const [language, setLanguage] = useState<Language>("te");
  const t = useFarmerCopy(language);
  const [user, setUser] = useState<FarmerUser | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [overview, setOverview] = useState<FarmerOverview | null>(null);
  const [farmer, setFarmer] = useState<FarmerProfile | null>(null);
  const [crop, setCrop] = useState("Tomato");
  const [workflowResult, setWorkflowResult] = useState<WorkflowResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null);

  useEffect(() => {
    const session = getSession();
    if (!session) {
      router.replace("/login");
      return;
    }
    setUser(session);
    preloadVoices();
  }, [router]);

  const refresh = useCallback(() => {
    fetchApi<DashboardStats>("/api/dashboard/stats").then(setStats).catch(() => {});
    fetchApi<FarmerOverview>(`/api/dashboard/overview?crop=${crop}`).then(setOverview).catch(() => {});
  }, [crop]);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    checkBackendHealth().then(setBackendOnline);
    refresh();
    fetchApi<FarmerProfile>("/api/farmer/farmer-001").then(setFarmer).catch(() => {});
    setLoading(false);
  }, [refresh, user]);

  const logisticsStep = workflowResult?.steps?.find((s) => s.agent.includes("Logistics"));
  const chatPhone = user?.phone || farmer?.phone;

  function handleLogout() {
    logout();
    router.push("/login");
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#060a09] flex items-center justify-center text-gray-400">
        {t.loading}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#060a09]">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-emerald-600/8 rounded-full blur-[100px]" />
      </div>

      <header className="border-b border-white/5 bg-black/70 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-green-700 flex items-center justify-center text-2xl border border-emerald-500/30 flex-shrink-0">🌱</div>
            <div className="min-w-0">
              <h1 className="font-bold text-white text-lg truncate">{t.appName}</h1>
              <p className="text-xs text-emerald-400 truncate">👨‍🌾 {user.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap justify-end">
            {backendOnline !== null && (
              <span className={`text-xs px-2 py-1 rounded-full ${backendOnline ? "text-emerald-400 bg-emerald-500/10" : "text-amber-400 bg-amber-500/10"}`}>
                {backendOnline ? `● ${t.systemOk}` : t.systemDown}
              </span>
            )}
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as Language)}
              className="bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-sm text-white font-medium"
            >
              <option value="te" className="bg-gray-900">తెలుగు</option>
              <option value="hi" className="bg-gray-900">हिंदी</option>
              <option value="en" className="bg-gray-900">English</option>
            </select>
            <select
              value={crop}
              onChange={(e) => setCrop(e.target.value)}
              aria-label={t.selectCrop}
              className="bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-sm text-white font-medium"
            >
              {CROP_OPTIONS.map((c) => (
                <option key={c} value={c} className="bg-gray-900">{cropLabel(c, language)}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={handleLogout}
              className="text-xs px-3 py-2 rounded-xl bg-white/5 border border-white/15 text-gray-300 hover:bg-white/10"
            >
              {t.logoutBtn}
            </button>
          </div>
        </div>
      </header>

      <main className="relative max-w-6xl mx-auto px-4 py-6 space-y-8">
        <section className="text-center py-3">
          <h2 className="text-2xl sm:text-4xl font-bold text-white leading-tight">
            {t.heroTitle}{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-green-400">
              {t.heroHighlight}
            </span>
          </h2>
          <p className="text-base text-gray-300 mt-3 max-w-md mx-auto leading-relaxed">{t.heroSub}</p>
        </section>

        <KPICards stats={stats} loading={loading} language={language} />

        <FarmerDashboard overview={overview} loading={loading} language={language} workflowResult={workflowResult} />

        <FullDemoMode
          language={language}
          crop={crop}
          onCropChange={setCrop}
          onComplete={(r) => { setWorkflowResult(r); refresh(); }}
        />

        <div className="grid lg:grid-cols-2 gap-5">
          <NegotiationTheater crop={crop} language={language} />
          <LogisticsTracker logisticsStep={logisticsStep} language={language} />
        </div>

        <div className="grid lg:grid-cols-2 gap-5">
          <div>
            <GlassCard className="p-4 mb-3">
              <h3 className="text-lg font-bold text-white">💬 {t.whatsappTitle}</h3>
              <p className="text-sm text-gray-400 mt-1">{t.whatsappSub}</p>
            </GlassCard>
            <WhatsAppChat phone={chatPhone} crop={crop} language={language} />
          </div>
          <GlassCard className="p-5">
            <h3 className="text-lg font-bold text-white">📊 {t.mandiTitle}</h3>
            <p className="text-sm text-gray-400 mt-1 mb-4">{t.mandiSub}</p>
            <MandiPrices crop={crop} language={language} />
          </GlassCard>
        </div>

        <GlassCard className="p-6">
          <p className="text-base text-emerald-400 font-semibold mb-4 text-center">{t.storyTitle}</p>
          <div className="flex flex-wrap justify-center gap-2">
            {t.storySteps.map((step, i, arr) => (
              <div key={step} className="flex items-center gap-2">
                <span className="px-4 py-2 rounded-full bg-emerald-500/15 border border-emerald-500/25 text-emerald-100 text-sm font-medium">{step}</span>
                {i < arr.length - 1 && <span className="text-gray-600 text-lg">→</span>}
              </div>
            ))}
          </div>
        </GlassCard>

        <AccessLinks language={language} />
      </main>

      <footer className="text-center py-8 text-gray-500 text-sm border-t border-white/5">
        <p>{t.footer}</p>
      </footer>
    </div>
  );
}
