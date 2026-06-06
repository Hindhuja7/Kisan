"use client";

import { useState } from "react";
import { fetchApi } from "@/lib/api";
import { Language, WorkflowResult } from "@/lib/types";

interface Props {
  language: Language;
  onComplete?: () => void;
}

export default function DemoWorkflow({ language, onComplete }: Props) {
  const [crop, setCrop] = useState("Tomato");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<WorkflowResult | null>(null);

  async function run() {
    setLoading(true);
    try {
      const data = await fetchApi<WorkflowResult>("/api/workflow/run", {
        method: "POST",
        body: JSON.stringify({
          farmer_id: "farmer-001",
          crop,
          quantity_tons: 5,
          language,
        }),
      });
      setResult(data);
      onComplete?.();
    } catch {
      setResult(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-900/30 to-green-900/10 border border-emerald-500/20">
      <h3 className="text-white font-semibold mb-1">One-Click Demo</h3>
      <p className="text-xs text-gray-400 mb-4">Runs all 3 CrewAI agents: Crop → Price → Negotiation</p>
      <div className="flex gap-2">
        <select
          value={crop}
          onChange={(e) => setCrop(e.target.value)}
          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm"
        >
          {["Tomato", "Onion", "Chilli"].map((c) => (
            <option key={c} value={c} className="bg-gray-900">{c}</option>
          ))}
        </select>
        <button
          type="button"
          onClick={run}
          disabled={loading}
          className="px-5 py-2 rounded-xl bg-emerald-500 text-white font-medium text-sm disabled:opacity-50"
        >
          {loading ? "..." : "▶ Demo"}
        </button>
      </div>
      {result && (
        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          <div className="p-2 rounded-lg bg-black/30">
            <p className="text-xs text-gray-400">Workflow</p>
            <p className="text-sm font-mono text-white">{result.workflow_id}</p>
          </div>
          <div className="p-2 rounded-lg bg-black/30">
            <p className="text-xs text-gray-400">Deal Value</p>
            <p className="text-sm font-bold text-emerald-300">₹{result.deal_value_inr?.toLocaleString("en-IN")}</p>
          </div>
          <div className="p-2 rounded-lg bg-black/30">
            <p className="text-xs text-gray-400">Uplift</p>
            <p className="text-sm font-bold text-amber-300">+{result.income_uplift_pct}%</p>
          </div>
        </div>
      )}
    </div>
  );
}
