"use client";

import { ReactNode } from "react";

interface Props {
  children: ReactNode;
  className?: string;
  glow?: boolean;
  onClick?: () => void;
}

export default function GlassCard({ children, className = "", glow, onClick }: Props) {
  return (
    <div
      onClick={onClick}
      className={`rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-xl shadow-xl transition-all duration-300 hover:border-emerald-500/20 hover:bg-white/[0.06] ${glow ? "ai-glow" : ""} ${className}`}
    >
      {children}
    </div>
  );
}
