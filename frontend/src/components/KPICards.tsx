"use client";

import GlassCard from "./ui/GlassCard";
import AnimatedCounter from "./ui/AnimatedCounter";
import { DashboardStats, Language } from "@/lib/types";
import { useFarmerCopy } from "@/lib/farmerCopy";

interface Props {
  stats: DashboardStats | null;
  loading?: boolean;
  language: Language;
}

export default function KPICards({ stats, loading, language }: Props) {
  const t = useFarmerCopy(language);
  const kpis = [
    { key: "avg_income_uplift_pct", label: t.kpiIncome, suffix: "%", icon: "📈" },
    { key: "crop_loss_prevented_pct", label: t.kpiLossSaved, suffix: "%", icon: "🛡️" },
    { key: "ai_confidence_score", label: t.kpiTrust, suffix: "%", icon: "✅" },
    { key: "deal_success_rate", label: t.kpiDeals, suffix: "%", icon: "🤝" },
    { key: "logistics_efficiency_pct", label: t.kpiTransport, suffix: "%", icon: "🚛" },
    { key: "farmers_assisted", label: t.kpiFarmers, suffix: "+", icon: "👨‍🌾" },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
      {kpis.map((kpi, i) => (
        <GlassCard key={kpi.key} className={`p-4 text-center ${i === 0 ? "ai-glow" : ""}`} glow={i === 0}>
          <div className="text-2xl mb-2">{kpi.icon}</div>
          {loading || !stats ? (
            <div className="h-9 bg-white/10 rounded animate-pulse mx-auto w-20" />
          ) : (
            <p className="text-2xl sm:text-3xl font-bold text-emerald-300">
              <AnimatedCounter value={stats[kpi.key as keyof DashboardStats] as number} suffix={kpi.suffix} />
            </p>
          )}
          <p className="text-xs sm:text-sm text-gray-300 mt-2 leading-snug font-medium">{kpi.label}</p>
        </GlassCard>
      ))}
    </div>
  );
}
