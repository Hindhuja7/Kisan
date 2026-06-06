"use client";

import { useEffect, useState } from "react";
import { fetchApi } from "@/lib/api";
import { MandiPrice } from "@/lib/types";

interface Props {
  crop: string;
}

export default function MandiPrices({ crop }: Props) {
  const [prices, setPrices] = useState<MandiPrice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchApi<{ prices: MandiPrice[] }>(`/api/mandi-prices/${crop}`)
      .then((d) => setPrices(d.prices))
      .catch(() => setPrices([]))
      .finally(() => setLoading(false));
  }, [crop]);

  if (loading) {
    return <div className="h-48 flex items-center justify-center text-gray-500">Loading mandi prices...</div>;
  }

  const trendIcon = (t: string) => (t === "rising" ? "↑" : t === "falling" ? "↓" : "→");
  const trendColor = (t: string) =>
    t === "rising" ? "text-emerald-400" : t === "falling" ? "text-red-400" : "text-gray-400";

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-gray-500 border-b border-white/10">
            <th className="pb-3 font-medium">Mandi</th>
            <th className="pb-3 font-medium">District</th>
            <th className="pb-3 font-medium text-right">₹/Quintal</th>
            <th className="pb-3 font-medium text-right">Trend</th>
          </tr>
        </thead>
        <tbody>
          {prices.map((p, i) => (
            <tr key={p.mandi_id} className="border-b border-white/5 hover:bg-white/5">
              <td className="py-3 text-white">
                {i === 0 && <span className="mr-1">🏆</span>}
                {p.mandi_name}
              </td>
              <td className="py-3 text-gray-400">{p.district}</td>
              <td className="py-3 text-right font-mono text-emerald-300">
                ₹{p.price_per_quintal_inr.toLocaleString("en-IN")}
              </td>
              <td className={`py-3 text-right ${trendColor(p.trend)}`}>
                {trendIcon(p.trend)} {p.trend}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
