"use client";

import GlassCard from "./ui/GlassCard";
import { Language } from "@/lib/types";
import { useFarmerCopy } from "@/lib/farmerCopy";

function healthColor(v: number): string {
  if (v > 0.75) return "bg-emerald-500";
  if (v > 0.65) return "bg-green-500";
  if (v > 0.55) return "bg-lime-500";
  if (v > 0.45) return "bg-yellow-500";
  return "bg-orange-500";
}

interface Props {
  grid: number[][];
  ndvi: number;
  healthScore: number;
  language: Language;
}

export default function NDVIHeatmap({ grid, healthScore, language }: Props) {
  const t = useFarmerCopy(language);

  return (
    <GlassCard className="p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm text-emerald-400 font-medium">🛰️ {t.cropHealthMap}</p>
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold text-emerald-300">{healthScore}</p>
          <p className="text-xs text-gray-400">{t.healthGood}</p>
        </div>
      </div>
      <div className="grid gap-1 mb-4" style={{ gridTemplateColumns: `repeat(${grid[0]?.length || 8}, 1fr)` }}>
        {grid.flat().map((v, i) => (
          <div key={i} className={`aspect-square rounded-md ${healthColor(v)} opacity-85`} />
        ))}
      </div>
      <div className="flex justify-between text-xs text-gray-400">
        <span>😟 {t.weakCrop}</span>
        <span>😊 {t.strongCrop}</span>
      </div>
    </GlassCard>
  );
}
