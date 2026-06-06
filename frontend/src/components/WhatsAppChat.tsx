"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { fetchApi, checkBackendHealth } from "@/lib/api";
import { Language, WhatsAppChatResponse, WhatsAppMessage } from "@/lib/types";
import { useFarmerCopy } from "@/lib/farmerCopy";
import {
  detectTextLanguage,
  getSpeechRecognition,
  HoldAudioRecorder,
  isRecorderSupported,
  isSpeechSupported,
  isTTSSupported,
  mapSpeechError,
  recognitionLangCandidates,
  speakText,
  speechLang,
  stopSpeaking,
  transcribeAudioBlob,
} from "@/lib/voice";
import { hasMicConsent } from "@/lib/micConsent";
import MicConsentModal from "./MicConsentModal";

interface Props {
  phone?: string;
  crop: string;
  language: Language;
}

type VoiceMode = "browser" | "recorder";

const MIN_HOLD_MS = 450;

export default function WhatsAppChat({ phone = "+919876543210", crop, language }: Props) {
  const t = useFarmerCopy(language);
  const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [typing, setTyping] = useState(false);
  const [listening, setListening] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [voiceOn, setVoiceOn] = useState(true);
  const [micError, setMicError] = useState("");
  const [voiceMode, setVoiceMode] = useState<VoiceMode>("browser");
  const [whisperAvailable, setWhisperAvailable] = useState(false);
  const [showMicConsent, setShowMicConsent] = useState(false);
  const pendingHoldRef = useRef(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const recorderRef = useRef<HoldAudioRecorder | null>(null);
  const accumulatedRef = useRef("");
  const liveTranscriptRef = useRef("");
  const sendOnEndRef = useRef(true);
  const holdingRef = useRef(false);
  const holdStartRef = useRef(0);
  const langTryIndexRef = useRef(0);
  const activePointerRef = useRef<number | null>(null);

  const quickReplies =
    language === "te"
      ? ["మండి ధర ఎంత?", "పంట ఎప్పుడు కోయాలి?", "నా పంట అమ్మండి"]
      : language === "hi"
      ? ["मंडी भाव क्या है?", "कटाई कब करें?", "फसल बेचो"]
      : ["What is mandi price?", "When to harvest?", "Sell my crop"];

  const speechOk = isSpeechSupported();
  const recorderOk = isRecorderSupported();
  const ttsOk = isTTSSupported();
  const voiceFeatureOk = speechOk || (recorderOk && whisperAvailable);

  useEffect(() => {
    fetchApi<{ messages: WhatsAppMessage[] }>(`/api/whatsapp/messages?phone=${encodeURIComponent(phone)}`)
      .then((d) => setMessages(d.messages))
      .catch(() => {});
  }, [phone]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing, listening, transcribing]);

  useEffect(() => {
    const saved = sessionStorage.getItem("kisan-voice-on");
    if (saved !== null) setVoiceOn(saved === "1");
  }, []);

  useEffect(() => {
    sessionStorage.setItem("kisan-voice-on", voiceOn ? "1" : "0");
  }, [voiceOn]);

  useEffect(() => {
    let cancelled = false;

    async function initVoice() {
      const health = await checkBackendHealth().catch(() => false);
      if (cancelled) return;

      let openai = false;
      if (health) {
        try {
          const stats = await fetchApi<{ openai_enabled?: boolean }>("/api/dashboard/stats");
          openai = Boolean(stats.openai_enabled);
        } catch {
          openai = false;
        }
      }
      if (cancelled) return;

      setWhisperAvailable(openai);

      if (!speechOk && openai && recorderOk) {
        setVoiceMode("recorder");
      } else if (speechOk) {
        setVoiceMode("browser");
      } else if (openai && recorderOk) {
        setVoiceMode("recorder");
      }

    }

    initVoice();
    return () => {
      cancelled = true;
      stopSpeaking();
      recognitionRef.current?.abort();
      recorderRef.current?.abort();
    };
  }, [speechOk, recorderOk]);

  const playReply = useCallback(async (text: string) => {
    if (!ttsOk || !voiceOn) return;
    setSpeaking(true);
    try {
      await speakText(text, language);
    } finally {
      setSpeaking(false);
    }
  }, [language, ttsOk, voiceOn]);

  const showMicError = useCallback((kind: ReturnType<typeof mapSpeechError> | "denied" | "no-device" | "unsupported") => {
    if (kind === "denied") setMicError(t.waMicDenied);
    else if (kind === "network") setMicError(t.waNeedInternet);
    else if (kind === "no-speech") setMicError(t.waNoSpeech);
    else if (kind === "unsupported") setMicError(t.waUseChrome);
    else if (kind === "no-device") setMicError(t.waNoMic);
    else setMicError(t.waNoMic);
  }, [t]);

  async function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    setLoading(true);
    setInput("");
    setMicError("");
    stopSpeaking();

    const messageLang = detectTextLanguage(trimmed, language);

    setMessages((prev) => [...prev, { phone, direction: "inbound", message: trimmed }]);
    setTyping(true);
    await new Promise((r) => setTimeout(r, 800));

    try {
      const res = await fetchApi<WhatsAppChatResponse>("/api/whatsapp/chat", {
        method: "POST",
        body: JSON.stringify({ phone, message: trimmed, crop, language: messageLang }),
      });
      setTyping(false);
      setMessages((prev) => [...prev, { phone, direction: "outbound", message: res.reply }]);
      if (voiceOn) await playReply(res.reply);
    } catch {
      setTyping(false);
      const errMsg = `⚠️ ${t.backendError}`;
      setMessages((prev) => [...prev, { phone, direction: "outbound", message: errMsg }]);
      if (voiceOn) await speakText(errMsg, language);
    } finally {
      setLoading(false);
    }
  }

  function cleanupRecognition() {
    try {
      recognitionRef.current?.abort();
    } catch {
      /* ignore */
    }
    recognitionRef.current = null;
  }

  function stopBrowserListening(send = true) {
    sendOnEndRef.current = send;
    try {
      recognitionRef.current?.stop();
    } catch {
      cleanupRecognition();
      setListening(false);
      holdingRef.current = false;
    }
  }

  function startBrowserListening() {
    const SR = getSpeechRecognition();
    if (!SR) {
      if (whisperAvailable && recorderOk) {
        setVoiceMode("recorder");
        return startRecorderListening();
      }
      showMicError("unsupported");
      return;
    }

    cleanupRecognition();
    accumulatedRef.current = "";
    liveTranscriptRef.current = "";

    const langs = recognitionLangCandidates(language);
    const langIndex = langTryIndexRef.current;
    const rec = new SR();
    recognitionRef.current = rec;
    rec.lang = langs[langIndex] || speechLang(language);
    rec.continuous = true;
    rec.interimResults = true;
    rec.maxAlternatives = 1;

    rec.onresult = (e: { resultIndex: number; results: { length: number; [i: number]: { isFinal: boolean; 0: { transcript: string } } } }) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const chunk = e.results[i][0]?.transcript || "";
        if (e.results[i].isFinal) accumulatedRef.current += chunk;
        else interim += chunk;
      }
      const display = (accumulatedRef.current + interim).trim();
      liveTranscriptRef.current = display;
      setInput(display);
    };

    rec.onerror = (e: { error: string }) => {
      const kind = mapSpeechError(e.error);
      if (kind === "language" && langTryIndexRef.current < langs.length - 1) {
        langTryIndexRef.current += 1;
        cleanupRecognition();
        startBrowserListening();
        return;
      }
      if (kind === "network" || kind === "unknown") {
        if (whisperAvailable && recorderOk) {
          setVoiceMode("recorder");
          cleanupRecognition();
          startRecorderListening();
          return;
        }
        if (kind === "network") showMicError("network");
      } else if (kind !== "no-speech" && e.error !== "aborted") {
        showMicError(kind);
      }
      setListening(false);
      holdingRef.current = false;
    };

    rec.onend = () => {
      setListening(false);
      holdingRef.current = false;
      recognitionRef.current = null;

      if (!sendOnEndRef.current) {
        sendOnEndRef.current = true;
        return;
      }

      const heldMs = Date.now() - holdStartRef.current;
      const finalText = liveTranscriptRef.current.trim();
      accumulatedRef.current = "";
      liveTranscriptRef.current = "";

      if (finalText) {
        sendMessage(finalText);
      } else if (heldMs < MIN_HOLD_MS) {
        setMicError(t.waHoldLonger);
      } else {
        setMicError(t.waNoSpeech);
      }
    };

    try {
      rec.start();
      setListening(true);
    } catch {
      cleanupRecognition();
      if (whisperAvailable && recorderOk) {
        setVoiceMode("recorder");
        startRecorderListening();
      } else {
        showMicError("unsupported");
        holdingRef.current = false;
      }
    }
  }

  async function startRecorderListening() {
    if (!recorderOk) {
      showMicError("unsupported");
      holdingRef.current = false;
      return;
    }

    if (!whisperAvailable) {
      showMicError("unsupported");
      holdingRef.current = false;
      return;
    }

    try {
      recorderRef.current?.abort();
      const rec = new HoldAudioRecorder();
      recorderRef.current = rec;
      await rec.start();
      setListening(true);
      setMicError("");
    } catch (err) {
      const name = err instanceof DOMException ? err.name : "";
      if (name === "NotAllowedError") showMicError("denied");
      else showMicError("no-device");
      holdingRef.current = false;
    }
  }

  async function stopRecorderListening() {
    const rec = recorderRef.current;
    if (!rec) {
      setListening(false);
      holdingRef.current = false;
      return;
    }

    const heldMs = Date.now() - holdStartRef.current;
    setListening(false);
    holdingRef.current = false;

    if (heldMs < MIN_HOLD_MS) {
      rec.abort();
      recorderRef.current = null;
      setMicError(t.waHoldLonger);
      return;
    }

    setTranscribing(true);
    setMicError("");

    try {
      const blob = await rec.stop();
      recorderRef.current = null;
      if (blob.size < 800) {
        setMicError(t.waNoSpeech);
        return;
      }
      const text = await transcribeAudioBlob(blob, language);
      if (text) {
        setInput(text);
        await sendMessage(text);
      } else {
        setMicError(t.waNoSpeech);
      }
    } catch {
      setMicError(t.backendError);
    } finally {
      setTranscribing(false);
    }
  }

  function beginHold(pointerId: number) {
    if (loading || listening || transcribing || holdingRef.current) return;

    holdingRef.current = true;
    holdStartRef.current = Date.now();
    activePointerRef.current = pointerId;
    sendOnEndRef.current = true;
    langTryIndexRef.current = 0;
    setMicError("");
    stopSpeaking();
    setInput("");

    if (voiceMode === "recorder") {
      void startRecorderListening();
    } else {
      startBrowserListening();
    }
  }

  function finishHold() {
    if (!holdingRef.current && !listening) return;

    const heldMs = Date.now() - holdStartRef.current;
    holdingRef.current = false;
    activePointerRef.current = null;

    if (voiceMode === "recorder") {
      void stopRecorderListening();
      return;
    }

    if (listening) {
      if (heldMs < MIN_HOLD_MS) {
        sendOnEndRef.current = false;
        stopBrowserListening(false);
        setMicError(t.waHoldLonger);
      } else {
        stopBrowserListening(true);
      }
    }
  }

  function onMicHoldStart(e: React.PointerEvent<HTMLButtonElement>) {
    e.preventDefault();
    if (e.button !== 0) return;

    if (!hasMicConsent()) {
      pendingHoldRef.current = true;
      setShowMicConsent(true);
      return;
    }

    const btn = e.currentTarget;
    btn.setPointerCapture(e.pointerId);

    const onGlobalEnd = (ev: PointerEvent) => {
      if (activePointerRef.current !== null && ev.pointerId !== activePointerRef.current) return;
      document.removeEventListener("pointerup", onGlobalEnd);
      document.removeEventListener("pointercancel", onGlobalEnd);
      try {
        btn.releasePointerCapture(ev.pointerId);
      } catch {
        /* ignore */
      }
      finishHold();
    };

    document.addEventListener("pointerup", onGlobalEnd);
    document.addEventListener("pointercancel", onGlobalEnd);

    beginHold(e.pointerId);
  }

  const statusText = transcribing
    ? t.waTranscribing
    : speaking
    ? t.waSpeaking
    : listening
    ? t.waListening
    : typing
    ? t.waTyping
    : `● ${t.waOnline}`;

  return (
    <>
    <MicConsentModal
      open={showMicConsent}
      language={language}
      onClose={() => { setShowMicConsent(false); pendingHoldRef.current = false; }}
      onGranted={() => {
        if (pendingHoldRef.current) {
          pendingHoldRef.current = false;
          setMicError("");
        }
      }}
    />
    <div className="flex flex-col h-[560px] rounded-2xl overflow-hidden border-2 border-emerald-600/30 bg-[#0b141a] shadow-2xl">
      <div className="px-4 py-3 bg-[#1f2c34] flex items-center gap-3 border-b border-white/5">
        <div className="w-12 h-12 rounded-full bg-emerald-600 flex items-center justify-center text-2xl flex-shrink-0">🌱</div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-bold text-base truncate">{t.appName}</p>
          <p className="text-emerald-400 text-sm">{statusText}</p>
        </div>
        {ttsOk && (
          <button
            type="button"
            onClick={() => {
              if (voiceOn) stopSpeaking();
              setVoiceOn((v) => !v);
            }}
            className={`flex-shrink-0 px-3 py-2 rounded-xl text-xs font-semibold border transition-colors ${
              voiceOn
                ? "bg-emerald-600/25 border-emerald-500/40 text-emerald-200"
                : "bg-white/5 border-white/15 text-gray-400"
            }`}
            title={voiceOn ? t.waVoiceOff : t.waVoiceOn}
          >
            {voiceOn ? `🔊 ${t.waVoiceOn}` : `🔇 ${t.waVoiceOff}`}
          </button>
        )}
      </div>

      {(listening || transcribing) && (
        <div className="px-4 py-3 bg-red-950/40 border-b border-red-500/20 flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-red-500/30 flex items-center justify-center text-2xl mic-listening flex-shrink-0">
            {transcribing ? "🧠" : "🎤"}
          </div>
          <div className="flex-1">
            <p className="text-red-200 font-semibold text-sm">
              {transcribing ? t.waTranscribing : t.waListening}
            </p>
            <p className="text-gray-400 text-xs mt-0.5">{t.waReleaseToSend}</p>
            <p className="text-gray-300 text-sm mt-1 truncate">{input || "..."}</p>
          </div>
          <div className="flex items-end gap-1 h-6 flex-shrink-0">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="voice-bar" style={{ animationDelay: `${i * 0.15}s` }} />
            ))}
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && !listening && !transcribing && (
          <div className="text-center py-8 px-4">
            <p className="text-gray-400 text-base leading-relaxed">{t.waHint}</p>
            {voiceFeatureOk && (
              <p className="text-emerald-400/90 text-sm mt-4 font-medium">{t.waMicHint}</p>
            )}
            {!speechOk && !whisperAvailable && (
              <p className="text-amber-400/90 text-sm mt-2">{t.waUseChrome}</p>
            )}
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.direction === "inbound" ? "justify-end" : "justify-start"} gap-2 items-end`}>
            {m.direction === "outbound" && ttsOk && (
              <button
                type="button"
                onClick={() => playReply(m.message)}
                disabled={speaking}
                className="w-9 h-9 rounded-full bg-emerald-600/20 border border-emerald-500/30 text-sm flex-shrink-0 hover:bg-emerald-600/40 disabled:opacity-40"
                title={t.waListenAgain}
              >
                🔊
              </button>
            )}
            <div className={`max-w-[82%] px-4 py-3 rounded-2xl text-base leading-relaxed ${
              m.direction === "inbound"
                ? "bg-[#005c4b] text-white rounded-br-sm"
                : "bg-[#1f2c34] text-gray-100 rounded-bl-sm"
            }`}>
              {m.message}
            </div>
          </div>
        ))}
        {typing && (
          <div className="flex justify-start">
            <div className="px-4 py-3 rounded-2xl bg-[#1f2c34] flex gap-1.5">
              <span className="w-2.5 h-2.5 bg-gray-400 rounded-full typing-dot" />
              <span className="w-2.5 h-2.5 bg-gray-400 rounded-full typing-dot" style={{ animationDelay: "0.2s" }} />
              <span className="w-2.5 h-2.5 bg-gray-400 rounded-full typing-dot" style={{ animationDelay: "0.4s" }} />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="px-3 py-3 flex gap-2 overflow-x-auto border-t border-white/10 bg-[#1f2c34]">
        {quickReplies.map((q) => (
          <button
            key={q}
            type="button"
            onClick={() => sendMessage(q)}
            disabled={loading || listening || transcribing}
            className="text-sm whitespace-nowrap px-4 py-2 rounded-full bg-emerald-600/20 text-emerald-200 border border-emerald-500/30 hover:bg-emerald-600/40 disabled:opacity-40"
          >
            {q}
          </button>
        ))}
      </div>

      {micError && (
        <p className="px-4 py-2 text-amber-300 text-sm bg-amber-950/30 border-t border-amber-500/20">{micError}</p>
      )}

      <form
        className="flex gap-2 p-3 bg-[#1f2c34] border-t border-white/5"
        onSubmit={(e) => { e.preventDefault(); if (!listening && !transcribing) sendMessage(input); }}
      >
        <button
          type="button"
          disabled={loading || transcribing}
          onPointerDown={onMicHoldStart}
          onContextMenu={(e) => e.preventDefault()}
          style={{ touchAction: "none" }}
          className={`min-w-[64px] h-14 rounded-2xl flex flex-col items-center justify-center gap-0.5 flex-shrink-0 transition-colors select-none ${
            listening
              ? "bg-red-500/40 border-2 border-red-400 mic-listening"
              : "bg-emerald-600/25 border-2 border-emerald-500/40 hover:bg-emerald-600/40 active:bg-red-500/30 active:border-red-400"
          }`}
          title={t.waHoldToTalk}
        >
          <span className="text-xl leading-none">🎤</span>
          <span className="text-[10px] font-bold text-emerald-100 leading-none px-1 text-center">
            {listening ? t.waReleaseToSend : t.waHoldToTalk}
          </span>
        </button>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={listening ? t.waListening : t.waPlaceholder}
          readOnly={listening || transcribing}
          className="flex-1 bg-[#2a3942] rounded-2xl px-5 py-3 text-base text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
        <button
          type="submit"
          disabled={loading || listening || transcribing || !input.trim()}
          className="w-14 h-14 rounded-2xl bg-emerald-600 flex items-center justify-center text-white text-lg disabled:opacity-40 flex-shrink-0"
        >
          ➤
        </button>
      </form>
    </div>
    </>
  );
}
