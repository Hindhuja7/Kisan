"use client";

import { DashboardStats } from "@/lib/types";

interface Props {
  stats: DashboardStats | null;
}

export default function StatsBar({ stats }: Props) {
  const items = [
    { label: "Mandis", value: stats?.mandis_monitored ?? 6, suffix: "+" },
    { label: "Workflows", value: stats?.workflows_run ?? 0, suffix: "" },
    { label: "Deals Closed", value: stats?.deals_closed ?? 0, suffix: "" },
    { label: "Income Uplift", value: stats?.avg_income_uplift_pct ?? 40, suffix: "%" },
  ];

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {items.map((item) => (
          <div key={item.label} className="p-4 rounded-2xl bg-white/5 border border-white/10 text-center">
            <p className="text-2xl font-bold text-white">
              {item.value}<span className="text-emerald-400">{item.suffix}</span>
            </p>
            <p className="text-xs text-gray-400 mt-1">{item.label}</p>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-2 justify-center">
        <span className={`text-xs px-3 py-1 rounded-full border ${stats?.openai_enabled ? "border-emerald-500/40 text-emerald-400 bg-emerald-500/10" : "border-gray-600 text-gray-500"}`}>
          GPT-4o {stats?.openai_enabled ? "✓" : "(mock)"}
        </span>
        <span className={`text-xs px-3 py-1 rounded-full border ${stats?.supabase_enabled ? "border-blue-500/40 text-blue-400 bg-blue-500/10" : "border-gray-600 text-gray-500"}`}>
          Supabase {stats?.supabase_enabled ? "✓" : "(memory)"}
        </span>
        <span className="text-xs px-3 py-1 rounded-full border border-violet-500/40 text-violet-400 bg-violet-500/10">
          CrewAI ✓
        </span>
      </div>
    </div>
  );
}
