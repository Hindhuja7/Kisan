"use client";

import { useState } from "react";
import { fetchApi } from "@/lib/api";
import { AgentResult, Language } from "@/lib/types";

const CROPS = ["Tomato", "Onion", "Chilli", "Cotton", "Paddy", "Maize"];

interface Props {
  title: string;
  icon: string;
  endpoint: string;
  description: string;
  showQuantity?: boolean;
  language: Language;
  onResult?: (r: AgentResult) => void;
}

export default function AgentPanel({
  title,
  icon,
  endpoint,
  description,
  showQuantity,
  language,
  onResult,
}: Props) {
  const [crop, setCrop] = useState("Tomato");
  const [quantity, setQuantity] = useState(5);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AgentResult | null>(null);
  const [error, setError] = useState("");

  async function run() {
    setLoading(true);
    setError("");
    try {
      const body: Record<string, unknown> = {
        farmer_id: "farmer-001",
        crop,
        language,
      };
      if (showQuantity) body.quantity_tons = quantity;

      const data = await fetchApi<AgentResult>(endpoint, {
        method: "POST",
        body: JSON.stringify(body),
      });
      setResult(data);
      onResult?.(data);
    } catch {
      setError("Backend unavailable — run: uvicorn main:app --reload");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <span className="text-3xl">{icon}</span>
        <div>
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <p className="text-sm text-gray-400">{description}</p>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <select
          value={crop}
          onChange={(e) => setCrop(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm"
        >
          {CROPS.map((c) => (
            <option key={c} value={c} className="bg-gray-900">{c}</option>
          ))}
        </select>
        {showQuantity && (
          <input
            type="number"
            min={0.5}
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
            className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm"
            placeholder="Tons"
          />
        )}
      </div>

      <button
        type="button"
        onClick={run}
        disabled={loading}
        className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm disabled:opacity-50"
      >
        {loading ? "CrewAI Agent Running..." : `Run ${title}`}
      </button>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      {result && (
        <div className="space-y-3 animate-fade-in">
          <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/20">
            <p className="text-xs text-emerald-400 mb-1">{result.agent} · {result.status}</p>
            <p className="text-white font-medium">{result.summary}</p>
          </div>
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <p className="text-xs text-gray-400 mb-2">Advisory</p>
            <p className="text-sm text-gray-200 leading-relaxed">{result.advisory}</p>
          </div>
          {Array.isArray(result.data.negotiation_log) && (
            <div className="space-y-2">
              <p className="text-xs text-gray-400">Negotiation Simulation</p>
              {(result.data.negotiation_log as { round: number; party: string; offer?: number; status?: string }[]).map(
                (r) => (
                  <div key={r.round} className="flex items-center gap-3 text-sm p-2 rounded-lg bg-white/5">
                    <span className="text-gray-500 font-mono">R{r.round}</span>
                    <span className={r.party === "agent" ? "text-emerald-400" : "text-amber-400"}>{r.party}</span>
                    {r.offer && <span className="text-white">₹{r.offer}/qtl</span>}
                    {r.status && <span className="text-emerald-400 ml-auto">{r.status}</span>}
                  </div>
                )
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
