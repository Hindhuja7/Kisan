"use client";

import { useState } from "react";
import GlassCard from "./ui/GlassCard";
import AnimatedCounter from "./ui/AnimatedCounter";
import { fetchApi } from "@/lib/api";
import { AgentStep, Language } from "@/lib/types";
import { useFarmerCopy } from "@/lib/farmerCopy";

interface Props {
  crop: string;
  language: Language;
}

export default function NegotiationTheater({ crop, language }: Props) {
  const t = useFarmerCopy(language);
  const [result, setResult] = useState<AgentStep | null>(null);
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  async function run() {
    setLoading(true);
    setShowSuccess(false);
    try {
      const data = await fetchApi<AgentStep>("/api/agents/negotiate", {
        method: "POST",
        body: JSON.stringify({ crop, quantity_tons: 5, language }),
      });
      setResult(data);
      setTimeout(() => setShowSuccess(true), 800);
    } catch {
      setResult(null);
    } finally {
      setLoading(false);
    }
  }

  const log = (result?.data?.negotiation_log as { round: number; party: string; offer?: number; status?: string }[]) || [];
  const uplift = result?.data?.uplift_pct as number | undefined;
  const savings = result?.data?.savings_inr as number | undefined;

  return (
    <GlassCard className="p-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div>
          <h3 className="text-lg font-bold text-white">🤝 {t.negotiateTitle}</h3>
          <p className="text-sm text-gray-400 mt-1">{t.negotiateSub}</p>
        </div>
        <button
          type="button"
          onClick={run}
          disabled={loading}
          className="px-6 py-3 rounded-2xl bg-violet-600 hover:bg-violet-500 text-white text-base font-semibold disabled:opacity-50 min-h-[48px]"
        >
          {loading ? t.negotiating : t.startNegotiate}
        </button>
      </div>

      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((r) => <div key={r} className="h-20 rounded-2xl bg-white/5 animate-pulse" />)}
        </div>
      )}

      {result && !loading && (
        <div className="space-y-3 animate-fade-in">
          {log.map((round) => (
            <div
              key={round.round}
              className={`p-4 rounded-2xl border ${
                round.party === "agent" ? "bg-emerald-950/40 border-emerald-500/30 ml-2" : "bg-amber-950/30 border-amber-500/30 mr-2"
              }`}
            >
              <div className="flex justify-between mb-2">
                <span className="text-sm text-gray-400">{t.round} {round.round}</span>
                <span className={`text-sm font-medium ${round.party === "agent" ? "text-emerald-400" : "text-amber-400"}`}>
                  {round.party === "agent" ? `🌱 ${t.weTalk}` : `🏪 ${t.buyer}`}
                </span>
              </div>
              {round.offer && (
                <p className="text-2xl font-bold text-white">₹{round.offer} <span className="text-sm font-normal text-gray-400">/ {t.perQuintal}</span></p>
              )}
              {round.status && <p className="text-base text-emerald-400 font-semibold mt-2">✓ {t.dealDone}</p>}
            </div>
          ))}

          {showSuccess && uplift && (
            <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-600/25 to-green-600/15 border-2 border-emerald-500/40 text-center deal-success-pop">
              <p className="text-4xl font-bold text-emerald-300">+<AnimatedCounter value={uplift} suffix="%" /></p>
              <p className="text-base text-gray-200 mt-2">{t.moreThanTrader}</p>
              {savings && (
                <p className="text-sm text-amber-300 mt-2">{t.youSaved}: ₹<AnimatedCounter value={savings} /></p>
              )}
            </div>
          )}
        </div>
      )}

      {!result && !loading && (
        <p className="text-base text-gray-400 text-center py-10">{t.negotiateHint}</p>
      )}
    </GlassCard>
  );
}
