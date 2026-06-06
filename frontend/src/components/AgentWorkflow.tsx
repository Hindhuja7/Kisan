"use client";

import { useEffect, useState } from "react";
import GlassCard from "./ui/GlassCard";
import { AgentStep, Language } from "@/lib/types";
import { AGENT_KEYS, useFarmerCopy } from "@/lib/farmerCopy";

const AGENT_ICONS = ["🌾", "📈", "❄️", "🤝", "🚛"];
const AGENT_COLORS = [
  "from-emerald-500 to-green-600",
  "from-amber-500 to-orange-600",
  "from-cyan-500 to-blue-600",
  "from-violet-500 to-purple-600",
  "from-slate-500 to-gray-600",
];

interface Props {
  steps: AgentStep[];
  activeIndex: number;
  running: boolean;
  language: Language;
}

export default function AgentWorkflow({ steps, activeIndex, running, language }: Props) {
  const t = useFarmerCopy(language);
  const [visibleSteps, setVisibleSteps] = useState<Record<number, number>>({});

  useEffect(() => {
    if (!running || activeIndex < 0) return;
    const key = AGENT_KEYS[activeIndex];
    const stepLines = t.agentSteps[key];
    let i = 0;
    const timer = setInterval(() => {
      setVisibleSteps((prev) => ({ ...prev, [activeIndex]: i + 1 }));
      i++;
      if (i >= stepLines.length) clearInterval(timer);
    }, 700);
    return () => clearInterval(timer);
  }, [activeIndex, running, language, t.agentSteps]);

  const displayCount = 5;

  return (
    <GlassCard className="p-5">
      <div className="flex items-center gap-3 mb-5">
        <span className={`w-3 h-3 rounded-full ${running ? "bg-emerald-500 animate-pulse" : "bg-gray-600"}`} />
        <h3 className="text-lg font-semibold text-white">{t.pipelineTitle}</h3>
        {running && <span className="text-sm text-emerald-400 ml-auto">{t.working}</span>}
      </div>

      <div className="space-y-3">
        {Array.from({ length: displayCount }).map((_, i) => {
          const key = AGENT_KEYS[i];
          const label = t.agents[key];
          const isActive = i === activeIndex && running;
          const isDone = (steps.length > 0 && i < activeIndex) || (steps.length > 0 && !running && i < steps.length);
          const isPending = i > activeIndex && running;
          const step = steps[i];
          const lines = t.agentSteps[key];
          const visible = visibleSteps[i] || (isDone ? lines.length : 0);

          return (
            <div
              key={key}
              className={`flex gap-4 p-4 rounded-2xl border transition-all ${
                isActive ? "bg-emerald-500/10 border-emerald-500/40 ai-glow" : "border-white/5 bg-white/[0.02]"
              } ${isPending ? "opacity-40" : ""}`}
            >
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${AGENT_COLORS[i]} flex items-center justify-center text-2xl flex-shrink-0`}>
                {AGENT_ICONS[i]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-base font-semibold text-white">{label}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    isDone ? "bg-emerald-500/25 text-emerald-300" : isActive ? "bg-amber-500/25 text-amber-300" : "bg-white/10 text-gray-500"
                  }`}>
                    {isDone ? `✓ ${t.done}` : isActive ? t.working : t.waiting}
                  </span>
                </div>
                {isDone && (
                  <p className="text-sm text-gray-300 mt-2 leading-relaxed">{lines[lines.length - 1]}</p>
                )}
                {!step && isActive && (
                  <div className="mt-2 space-y-1.5">
                    {lines.slice(0, visible).map((line, li) => (
                      <p key={li} className="text-sm text-emerald-300/90 flex gap-2">
                        <span>•</span> {line}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </GlassCard>
  );
}
