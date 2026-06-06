"use client";

import { Language } from "@/lib/types";
import { useFarmerCopy } from "@/lib/farmerCopy";
import { ensureMicPermission } from "@/lib/voice";
import { setMicConsent } from "@/lib/micConsent";

interface Props {
  open: boolean;
  language: Language;
  onClose: () => void;
  onGranted: () => void;
}

export default function MicConsentModal({ open, language, onClose, onGranted }: Props) {
  const t = useFarmerCopy(language);

  if (!open) return null;

  async function allowMic() {
    setMicConsent(true);
    await ensureMicPermission();
    onGranted();
    onClose();
  }

  function denyMic() {
    setMicConsent(false);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-3xl border border-emerald-500/30 bg-[#1a2420] p-6 shadow-2xl animate-fade-in">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto rounded-full bg-emerald-600/20 flex items-center justify-center text-3xl mb-4">🎤</div>
          <h3 className="text-lg font-bold text-white">{t.micConsentTitle}</h3>
          <p className="text-gray-300 text-sm mt-3 leading-relaxed">{t.micConsentBody}</p>
        </div>
        <div className="flex flex-col gap-3 mt-6">
          <button
            type="button"
            onClick={allowMic}
            className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-base"
          >
            {t.micConsentAllow}
          </button>
          <button
            type="button"
            onClick={denyMic}
            className="w-full py-3 rounded-2xl bg-white/5 text-gray-400 text-sm"
          >
            {t.micConsentLater}
          </button>
        </div>
      </div>
    </div>
  );
}
