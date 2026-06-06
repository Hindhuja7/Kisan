"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AuthShell, { AuthLink } from "@/components/AuthShell";
import AccessLinks from "@/components/AccessLinks";
import { getSession, signup } from "@/lib/auth";
import { Language } from "@/lib/types";
import { useFarmerCopy } from "@/lib/farmerCopy";

export default function SignupPage() {
  const router = useRouter();
  const [language, setLanguage] = useState<Language>("te");
  const t = useFarmerCopy(language);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [village, setVillage] = useState("");
  const [district, setDistrict] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (getSession()) router.replace("/dashboard");
  }, [router]);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const result = signup({ name, phone, village, district }, password);
    setLoading(false);
    if (!result.ok) {
      setError(result.error === "exists" ? t.authExists : t.authError);
      return;
    }
    router.push("/dashboard");
  }

  return (
    <>
      <AuthShell
        language={language}
        onLanguageChange={setLanguage}
        title={t.signupTitle}
        subtitle={t.signupSub}
      >
        <form onSubmit={onSubmit} className="space-y-3">
          <label className="block">
            <span className="text-sm text-gray-400">{t.yourName}</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full bg-black/40 border border-white/15 rounded-2xl px-4 py-3 text-white text-base focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />
          </label>
          <label className="block">
            <span className="text-sm text-gray-400">{t.yourPhone}</span>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="9876543210"
              className="mt-1 w-full bg-black/40 border border-white/15 rounded-2xl px-4 py-3 text-white text-base focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-sm text-gray-400">{t.yourVillage}</span>
              <input
                value={village}
                onChange={(e) => setVillage(e.target.value)}
                className="mt-1 w-full bg-black/40 border border-white/15 rounded-2xl px-3 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </label>
            <label className="block">
              <span className="text-sm text-gray-400">{t.yourDistrict}</span>
              <input
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="mt-1 w-full bg-black/40 border border-white/15 rounded-2xl px-3 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </label>
          </div>
          <label className="block">
            <span className="text-sm text-gray-400">{t.password}</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full bg-black/40 border border-white/15 rounded-2xl px-4 py-3 text-white text-base focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
              minLength={4}
            />
          </label>
          {error && <p className="text-amber-300 text-sm text-center">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-lg disabled:opacity-50"
          >
            {t.signupBtn}
          </button>
          <p className="text-center text-gray-400 text-sm">
            {t.hasAccount}{" "}
            <AuthLink href="/login">{t.loginLink}</AuthLink>
          </p>
        </form>
      </AuthShell>
      <div className="max-w-md mx-auto px-4 pb-10 -mt-4 relative z-10">
        <AccessLinks language={language} />
      </div>
    </>
  );
}
