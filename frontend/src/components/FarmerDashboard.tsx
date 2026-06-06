"use client";

import GlassCard from "./ui/GlassCard";
import NDVIHeatmap from "./NDVIHeatmap";
import Skeleton from "./ui/Skeleton";
import AnimatedCounter from "./ui/AnimatedCounter";
import { FarmerOverview, Language } from "@/lib/types";
import { cropLabel, useFarmerCopy } from "@/lib/farmerCopy";

interface Props {
  overview: FarmerOverview | null;
  loading?: boolean;
  language: Language;
  workflowResult?: { net_income_inr?: number; income_uplift_pct?: number } | null;
}

export default function FarmerDashboard({ overview, loading, language, workflowResult }: Props) {
  const t = useFarmerCopy(language);

  if (loading || !overview) {
    return (
      <div className="grid gap-4">
        <Skeleton className="h-36" />
        <div className="grid sm:grid-cols-2 gap-3">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
      </div>
    );
  }

  const { farmer, crop, harvest_window, days_to_harvest, best_mandi, weather, iot } = overview;
  const cropName = cropLabel(crop, language);
  const uplift = workflowResult?.income_uplift_pct ?? overview.expected_uplift_pct;
  const moisture = (iot as { soil_moisture_pct?: number }).soil_moisture_pct;

  return (
    <div className="space-y-4">
      <GlassCard className="p-5 ai-glow" glow>
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-500/30 to-emerald-600/30 border-2 border-emerald-500/40 flex items-center justify-center text-4xl">
            👨‍🌾
          </div>
          <div className="flex-1">
            <p className="text-emerald-400 text-sm font-medium">{t.aiHelper}</p>
            <h2 className="text-2xl font-bold text-white">{farmer.name}</h2>
            <p className="text-base text-gray-300 mt-1">
              {farmer.village}, {farmer.district} · {farmer.land_acres} {t.acres}
            </p>
          </div>
          <div className="flex gap-3">
            <div className="text-center px-5 py-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30">
              <p className="text-2xl font-bold text-emerald-300">+{uplift}%</p>
              <p className="text-xs text-gray-300 mt-1">{t.profitMore}</p>
            </div>
            {workflowResult?.net_income_inr && (
              <div className="text-center px-5 py-3 rounded-2xl bg-amber-500/15 border border-amber-500/30">
                <p className="text-2xl font-bold text-amber-300">₹<AnimatedCounter value={workflowResult.net_income_inr} /></p>
                <p className="text-xs text-gray-300 mt-1">{t.yourEarnings}</p>
              </div>
            )}
          </div>
        </div>
      </GlassCard>

      <p className="text-sm text-emerald-400/90 font-medium px-1">{t.yourField}</p>

      <div className="grid sm:grid-cols-2 gap-3">
        <GlassCard className="p-4">
          <p className="text-sm text-gray-400">{t.yourCrop}</p>
          <p className="text-xl font-bold text-white mt-1">{cropName}</p>
          <p className="text-sm text-emerald-400 mt-2">{t.soilWet}: {moisture}%</p>
        </GlassCard>
        <GlassCard className="p-4">
          <p className="text-sm text-gray-400">{t.whenHarvest}</p>
          <p className="text-xl font-bold text-white mt-1">{days_to_harvest} {t.daysLeft}</p>
          <p className="text-sm text-gray-400 mt-2">{harvest_window.start} — {harvest_window.end}</p>
        </GlassCard>
        <GlassCard className="p-4">
          <p className="text-sm text-gray-400">{t.bestMarket}</p>
          <p className="text-xl font-bold text-white mt-1">{best_mandi.mandi_name}</p>
          <p className="text-sm text-emerald-400 mt-2">₹{best_mandi.price_per_quintal_inr} / {t.perQuintal}</p>
        </GlassCard>
        <GlassCard className="p-4">
          <p className="text-sm text-gray-400">{t.weatherNews}</p>
          <p className="text-base font-semibold text-white mt-1 leading-snug">{weather.alert}</p>
          <p className={`text-sm mt-2 ${weather.risk_level === "high" ? "text-red-400" : "text-emerald-400"}`}>
            {weather.temp_c}°C
          </p>
        </GlassCard>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <NDVIHeatmap grid={overview.ndvi_grid} ndvi={overview.ndvi} healthScore={overview.health_score} language={language} />
        <GlassCard className="p-5">
          <p className="text-sm text-amber-400 font-medium mb-3">💡 {t.aiAdvice}</p>
          <p className="text-base text-gray-100 leading-relaxed">
            {t.adviceTemplate(cropName, harvest_window.start, harvest_window.end, best_mandi.mandi_name)}
          </p>
          <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
            <div className="p-3 rounded-xl bg-white/5 text-center border border-white/10">
              <p className="text-gray-400">❄️ {t.coldStorage}</p>
              <p className="text-emerald-400 font-medium mt-1">{t.statusReady}</p>
            </div>
            <div className="p-3 rounded-xl bg-white/5 text-center border border-white/10">
              <p className="text-gray-400">🚛 {t.transport}</p>
              <p className="text-blue-400 font-medium mt-1">{t.statusWaiting}</p>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
