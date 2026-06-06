"use client";

import { useEffect, useState } from "react";
import { fetchApi } from "@/lib/api";
import { MandiPrice, Language } from "@/lib/types";
import { useFarmerCopy } from "@/lib/farmerCopy";

interface Props {
  crop: string;
  language: Language;
}

export default function MandiPrices({ crop, language }: Props) {
  const t = useFarmerCopy(language);
  const [prices, setPrices] = useState<MandiPrice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchApi<{ prices: MandiPrice[] }>(`/api/mandi-prices/${crop}`)
      .then((d) => setPrices(d.prices))
      .catch(() => setPrices([]))
      .finally(() => setLoading(false));
  }, [crop]);

  const trendLabel = (tr: string) => {
    if (tr === "rising") return `↑ ${t.rising}`;
    if (tr === "falling") return `↓ ${t.falling}`;
    return `→ ${t.stable}`;
  };

  if (loading) {
    return <div className="h-40 flex items-center justify-center text-gray-400 text-base">{t.loading}</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-base">
        <thead>
          <tr className="text-left text-gray-400 border-b border-white/10">
            <th className="pb-3 font-medium">{t.mandi}</th>
            <th className="pb-3 font-medium">{t.district}</th>
            <th className="pb-3 font-medium text-right">{t.price}</th>
            <th className="pb-3 font-medium text-right">{t.trend}</th>
          </tr>
        </thead>
        <tbody>
          {prices.map((p, i) => (
            <tr key={p.mandi_id} className="border-b border-white/5">
              <td className="py-4 text-white font-medium">
                {i === 0 && <span className="mr-1">🏆</span>}
                {p.mandi_name}
              </td>
              <td className="py-4 text-gray-400">{p.district}</td>
              <td className="py-4 text-right text-xl font-bold text-emerald-300">
                ₹{p.price_per_quintal_inr.toLocaleString("en-IN")}
              </td>
              <td className={`py-4 text-right text-sm ${p.trend === "rising" ? "text-emerald-400" : p.trend === "falling" ? "text-red-400" : "text-gray-400"}`}>
                {trendLabel(p.trend)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
