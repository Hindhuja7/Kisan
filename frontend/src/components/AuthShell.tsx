"use client";

import Link from "next/link";
import { Language } from "@/lib/types";
import { useFarmerCopy } from "@/lib/farmerCopy";

interface Props {
  children: React.ReactNode;
  language: Language;
  onLanguageChange: (l: Language) => void;
  title: string;
  subtitle: string;
}

export default function AuthShell({ children, language, onLanguageChange, title, subtitle }: Props) {
  const t = useFarmerCopy(language);

  return (
    <div className="min-h-screen bg-[#060a09] flex flex-col">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-emerald-600/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-green-700/10 rounded-full blur-[80px]" />
      </div>

      <header className="relative z-10 border-b border-white/5 bg-black/60 backdrop-blur-xl">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-400 to-green-700 flex items-center justify-center text-xl">🌱</div>
            <div>
              <p className="font-bold text-white">{t.appName}</p>
              <p className="text-xs text-emerald-400">{t.appTagline}</p>
            </div>
          </div>
          <select
            value={language}
            onChange={(e) => onLanguageChange(e.target.value as Language)}
            className="bg-white/10 border border-white/20 rounded-xl px-2 py-1.5 text-sm text-white"
          >
            <option value="te" className="bg-gray-900">తెలుగు</option>
            <option value="hi" className="bg-gray-900">हिंदी</option>
            <option value="en" className="bg-gray-900">English</option>
          </select>
        </div>
      </header>

      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-white">{title}</h1>
            <p className="text-gray-400 mt-2 text-base leading-relaxed">{subtitle}</p>
          </div>
          <div className="rounded-3xl border border-emerald-500/25 bg-white/[0.04] backdrop-blur p-6 shadow-xl">
            {children}
          </div>
          <p className="text-center text-gray-500 text-sm mt-6">{t.footer}</p>
        </div>
      </main>
    </div>
  );
}

export function AuthLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="text-emerald-400 font-semibold hover:text-emerald-300 underline-offset-2 hover:underline">
      {children}
    </Link>
  );
}
