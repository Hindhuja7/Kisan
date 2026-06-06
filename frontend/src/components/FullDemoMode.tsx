"use client";

import { useState } from "react";
import { fetchApi } from "@/lib/api";
import { Language, WorkflowResult } from "@/lib/types";
import AgentWorkflow from "./AgentWorkflow";
import { cropLabel, formatReceiptNo, useFarmerCopy } from "@/lib/farmerCopy";

const CROPS = ["Tomato", "Onion", "Chilli"];

interface Props {
  language: Language;
  crop: string;
  onCropChange: (c: string) => void;
  onComplete: (result: WorkflowResult) => void;
}

export default function FullDemoMode({ language, crop, onCropChange, onComplete }: Props) {
  const t = useFarmerCopy(language);
  const [running, setRunning] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [result, setResult] = useState<WorkflowResult | null>(null);
  const [error, setError] = useState("");

  async function runFullWorkflow() {
    setRunning(true);
    setError("");
    setResult(null);
    setActiveIndex(0);

    const agentCount = 5;
    const stepInterval = setInterval(() => {
      setActiveIndex((prev) => (prev < agentCount - 1 ? prev + 1 : prev));
    }, 2200);

    try {
      const data = await fetchApi<WorkflowResult>("/api/workflow/run", {
        method: "POST",
        body: JSON.stringify({ farmer_id: "farmer-001", crop, quantity_tons: 5, language }),
      });
      clearInterval(stepInterval);
      setActiveIndex(agentCount);
      setResult(data);
      onComplete(data);
    } catch {
      setError(t.backendError);
      clearInterval(stepInterval);
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="relative overflow-hidden rounded-3xl border-2 border-emerald-500/40 bg-gradient-to-br from-emerald-950/60 to-green-950/30 p-6">
        <div className="relative flex flex-col gap-4">
          <div>
            <h3 className="text-xl sm:text-2xl font-bold text-white">{t.oneClickTitle}</h3>
            <p className="text-base text-gray-300 mt-2">{t.oneClickSub}</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <select
              value={crop}
              onChange={(e) => onCropChange(e.target.value)}
              disabled={running}
              className="flex-1 bg-black/40 border border-white/20 rounded-2xl px-4 py-4 text-white text-base"
            >
              {CROPS.map((c) => (
                <option key={c} value={c} className="bg-gray-900">{cropLabel(c, language)}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={runFullWorkflow}
              disabled={running}
              className="px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-500 text-white font-bold text-lg shadow-lg disabled:opacity-50 ai-glow min-h-[56px]"
            >
              {running ? `⏳ ${t.running}` : `▶ ${t.runAll}`}
            </button>
          </div>
        </div>

        {error && <p className="text-red-400 text-base mt-4 text-center">{error}</p>}

        {result && !running && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 animate-fade-in">
            {[
              { label: t.refNo, value: `#${formatReceiptNo(result.workflow_id)}` },
              { label: t.dealTotal, value: `₹${result.deal_value_inr?.toLocaleString("en-IN")}` },
              { label: t.youEarn, value: `₹${result.net_income_inr?.toLocaleString("en-IN")}` },
              { label: t.moreProfit, value: `+${result.income_uplift_pct}%` },
            ].map((item) => (
              <div key={item.label} className="p-4 rounded-2xl bg-black/30 border border-emerald-500/20 text-center">
                <p className="text-xs text-gray-400">{item.label}</p>
                <p className="text-base font-bold text-white mt-1">{item.value}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <AgentWorkflow
        steps={result?.steps || []}
        activeIndex={running ? activeIndex : result ? (result.steps?.length || 5) : -1}
        running={running}
        language={language}
      />
    </div>
  );
}
