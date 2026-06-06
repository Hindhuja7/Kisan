"use client";

import GlassCard from "./ui/GlassCard";
import { AgentStep, Language } from "@/lib/types";
import { useFarmerCopy } from "@/lib/farmerCopy";

interface Props {
  logisticsStep?: AgentStep | null;
  language: Language;
}

export default function LogisticsTracker({ logisticsStep, language }: Props) {
  const t = useFarmerCopy(language);
  const data = logisticsStep?.data;
  const vehicle = data?.vehicle as { eta_hours?: number; estimated_cost_inr?: number; tracking_id?: string; distance_km?: number } | undefined;

  const stages = [
    { label: t.stageFarm, icon: "🌾", location: "Warangal" },
    { label: t.stageCold, icon: "❄️", location: "Shamshabad" },
    { label: t.stageBuyer, icon: "🏭", location: "Hyderabad" },
    { label: t.stageMarket, icon: "🏪", location: "Gaddiannaram" },
  ];

  return (
    <GlassCard className="p-5">
      <div className="mb-4">
        <h3 className="text-lg font-bold text-white">🚛 {t.transportTitle}</h3>
        <p className="text-sm text-gray-400 mt-1">{t.transportSub}</p>
      </div>

      <div className="relative h-28 rounded-2xl bg-gradient-to-br from-slate-900 to-emerald-950/50 border border-white/10 mb-4 overflow-hidden">
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 120">
          <path d="M 40 80 Q 120 30, 200 60 T 360 40" fill="none" stroke="#10b981" strokeWidth="3" strokeDasharray="8 4" />
          <circle cx="40" cy="80" r="8" fill="#22c55e" />
          <circle cx="200" cy="60" r="6" fill="#06b6d4" />
          <circle cx="360" cy="40" r="8" fill="#f59e0b" />
        </svg>
        <div className="absolute top-6 left-1/3 text-2xl truck-animate">🚛</div>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-4 text-center">
        <div className="p-3 rounded-xl bg-white/5">
          <p className="text-xs text-gray-400">{t.arrivalTime}</p>
          <p className="text-lg font-bold text-white">{vehicle?.eta_hours || 6} {t.hours}</p>
        </div>
        <div className="p-3 rounded-xl bg-white/5">
          <p className="text-xs text-gray-400">{t.distance}</p>
          <p className="text-lg font-bold text-white">{vehicle?.distance_km || 142} {t.km}</p>
        </div>
        <div className="p-3 rounded-xl bg-white/5">
          <p className="text-xs text-gray-400">{t.transportCost}</p>
          <p className="text-lg font-bold text-white">₹{vehicle?.estimated_cost_inr?.toLocaleString("en-IN") || "2,840"}</p>
        </div>
      </div>

      <div className="space-y-2">
        {stages.map((s, i) => (
          <div key={s.label} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.04] border border-white/5">
            <span className="text-2xl">{s.icon}</span>
            <div className="flex-1">
              <p className="text-base text-white font-medium">{s.label}</p>
              <p className="text-xs text-gray-500">{s.location}</p>
            </div>
            <span className={`text-xs px-3 py-1 rounded-full font-medium ${
              i === 0 ? "bg-emerald-500/25 text-emerald-300" : "bg-white/10 text-gray-500"
            }`}>
              {i === 0 ? (logisticsStep ? t.active : t.ready) : t.pending}
            </span>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}
