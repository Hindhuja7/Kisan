"use client";

import { useEffect, useState } from "react";
import GlassCard from "./ui/GlassCard";
import { Language } from "@/lib/types";
import { useFarmerCopy } from "@/lib/farmerCopy";
import { fetchNetworkInfo, NetworkInfo } from "@/lib/api";

interface Props {
  language: Language;
}

export default function AccessLinks({ language }: Props) {
  const t = useFarmerCopy(language);
  const [phoneUrl, setPhoneUrl] = useState("");
  const [laptopUrl, setLaptopUrl] = useState("");
  const [network, setNetwork] = useState<NetworkInfo | null>(null);
  const [copied, setCopied] = useState(false);
  const [port, setPort] = useState(3000);

  useEffect(() => {
    const origin = window.location.origin;
    const p = window.location.port ? parseInt(window.location.port, 10) : 3000;
    setPort(p);

    const onLocalhost =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1";

    if (onLocalhost) {
      setLaptopUrl(`${origin}/login`);
      fetchNetworkInfo().then((info) => {
        if (!info) return;
        setNetwork(info);
        const mobileLogin = info.phone_login_url.replace(":3000", `:${p}`);
        setPhoneUrl(mobileLogin);
      });
    } else {
      setPhoneUrl(`${origin}/login`);
      setLaptopUrl(`http://localhost:${p}/login`);
    }
  }, []);

  const displayUrl = phoneUrl || laptopUrl;

  async function copyLink() {
    const link = phoneUrl || laptopUrl;
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      /* fallback */
    }
  }

  const qrSrc = displayUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(phoneUrl || displayUrl)}&bgcolor=060a09&color=34d399`
    : "";

  return (
    <GlassCard className="p-6">
      <div className="text-center mb-5">
        <p className="text-emerald-400 font-semibold text-lg">📱 {t.openAppTitle}</p>
        <p className="text-gray-400 text-sm mt-2 leading-relaxed">{t.openAppSub}</p>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-6">
        {qrSrc && phoneUrl && (
          <div className="flex-shrink-0 text-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qrSrc}
              alt="QR code for phone"
              width={180}
              height={180}
              className="rounded-2xl border-2 border-emerald-500/40 mx-auto"
            />
            <p className="text-xs text-emerald-400/80 mt-2 font-medium">{t.scanQr}</p>
          </div>
        )}

        <div className="flex-1 w-full space-y-4">
          <div className="p-4 rounded-2xl bg-black/40 border border-emerald-500/20">
            <p className="text-xs text-gray-500 mb-1">{t.appLinkName}</p>
            <p className="text-xl font-bold text-emerald-300">{t.appName}</p>
          </div>

          {phoneUrl && (
            <div className="p-4 rounded-2xl bg-emerald-950/40 border-2 border-emerald-500/35">
              <p className="text-xs text-emerald-400 mb-2 font-semibold">📱 {t.phoneLink}</p>
              <a
                href={phoneUrl}
                className="text-emerald-300 font-mono text-base break-all hover:underline font-bold"
              >
                {phoneUrl}
              </a>
              {network && (
                <p className="text-xs text-gray-500 mt-2">
                  WiFi IP: {network.lan_ip} · Port: {port}
                </p>
              )}
            </div>
          )}

          {laptopUrl && typeof window !== "undefined" && window.location.hostname !== "localhost" && (
            <div className="p-3 rounded-xl bg-black/30 border border-white/10">
              <p className="text-xs text-gray-500 mb-1">💻 {t.laptopLink}</p>
              <p className="text-gray-400 font-mono text-sm break-all">{laptopUrl}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <a
              href={phoneUrl || displayUrl || "#"}
              className="py-3 px-4 rounded-2xl bg-emerald-600 text-white text-center font-semibold text-sm hover:bg-emerald-500"
            >
              📱 {t.openPhone}
            </a>
            <button
              type="button"
              onClick={copyLink}
              className="py-3 px-4 rounded-2xl bg-white/10 border border-white/15 text-white font-semibold text-sm hover:bg-white/15"
            >
              {copied ? `✓ ${t.linkCopied}` : `📋 ${t.copyLink}`}
            </button>
          </div>

          <div className="text-amber-300/90 text-xs leading-relaxed bg-amber-950/30 rounded-xl p-4 border border-amber-500/20 space-y-2">
            <p className="font-semibold text-amber-200">{t.mobileStepsTitle}</p>
            <p>1. {t.mobileStep1}</p>
            <p>2. {t.mobileStep2}</p>
            <p>3. {t.mobileStep3}</p>
          </div>
        </div>
      </div>
    </GlassCard>
  );
}
