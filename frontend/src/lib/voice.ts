import { Language } from "./types";
import { getApiBase } from "./api";

export function speechLang(language: Language): string {
  if (language === "te") return "te-IN";
  if (language === "hi") return "hi-IN";
  return "en-IN";
}

export function recognitionLangCandidates(language: Language): string[] {
  const primary = speechLang(language);
  const pool = [primary, "en-IN", "hi-IN", "te-IN", "en-US"];
  return Array.from(new Set(pool));
}

/** Pick Telugu / Hindi / English from the actual message text. */
export function detectTextLanguage(text: string, fallback: Language = "en"): Language {
  let te = 0;
  let hi = 0;
  let en = 0;

  for (const ch of text) {
    const code = ch.charCodeAt(0);
    if (code >= 0x0c00 && code <= 0x0c7f) te++;
    else if (code >= 0x0900 && code <= 0x097f) hi++;
    else if (/[a-zA-Z]/.test(ch)) en++;
  }

  if (te === 0 && hi === 0 && en === 0) return fallback;
  if (te >= hi && te >= en && te > 0) return "te";
  if (hi >= te && hi >= en && hi > 0) return "hi";
  return en > 0 ? "en" : fallback;
}

export function stripForSpeech(text: string): string {
  return text
    .replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, "")
    .replace(/⚠️/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

let voicesCache: SpeechSynthesisVoice[] | null = null;

function loadVoices(): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      resolve([]);
      return;
    }
    const synth = window.speechSynthesis;
    const existing = synth.getVoices();
    if (existing.length > 0) {
      voicesCache = existing;
      resolve(existing);
      return;
    }
    const onVoices = () => {
      voicesCache = synth.getVoices();
      synth.removeEventListener("voiceschanged", onVoices);
      resolve(voicesCache);
    };
    synth.addEventListener("voiceschanged", onVoices);
    setTimeout(() => {
      voicesCache = synth.getVoices();
      resolve(voicesCache);
    }, 500);
  });
}

function pickVoice(voices: SpeechSynthesisVoice[], lang: string): SpeechSynthesisVoice | undefined {
  const code = lang.toLowerCase();
  const langPrefix = code.split("-")[0];
  const ranked = voices
    .map((v) => {
      const vl = v.lang.toLowerCase();
      const name = v.name.toLowerCase();
      let score = 0;
      if (vl === code) score = 100;
      else if (vl.startsWith(langPrefix)) score = 85;
      if (langPrefix === "te" && /telugu|te-in|rama|mohan|heera/i.test(name)) score += 25;
      if (langPrefix === "hi" && /hindi|hi-in|madhur|hemant/i.test(name)) score += 25;
      if (/google|microsoft|natural|neural|online/i.test(name)) score += 8;
      if (v.default && score < 50) score = 20;
      return { v, score };
    })
    .sort((a, b) => b.score - a.score);

  const best = ranked[0];
  if (!best || best.score < 50) return undefined;
  return best.v;
}

function splitTextSegments(text: string, fallback: Language): { lang: Language; text: string }[] {
  const segments: { lang: Language; text: string }[] = [];
  let buffer = "";
  let current: Language | null = null;

  const flush = () => {
    const chunk = buffer.trim();
    if (chunk) segments.push({ lang: current || fallback, text: chunk });
    buffer = "";
  };

  for (const ch of text) {
    const code = ch.charCodeAt(0);
    let lang: Language | null = null;
    if (code >= 0x0c00 && code <= 0x0c7f) lang = "te";
    else if (code >= 0x0900 && code <= 0x097f) lang = "hi";
    else if (/[a-zA-Z]/.test(ch)) lang = "en";

    if (lang) {
      if (current && lang !== current) flush();
      current = lang;
      buffer += ch;
    } else {
      buffer += ch;
    }
  }
  flush();

  if (!segments.length) return [{ lang: fallback, text }];
  return segments;
}

function speakSegment(text: string, lang: Language, voices: SpeechSynthesisVoice[]): Promise<void> {
  const bcp47 = speechLang(lang);
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = bcp47;
  const voice = pickVoice(voices, bcp47);
  if (voice) utter.voice = voice;
  utter.rate = lang === "en" ? 0.95 : 0.88;
  utter.pitch = 1;

  return new Promise((resolve) => {
    utter.onend = () => resolve();
    utter.onerror = () => resolve();
    window.speechSynthesis.speak(utter);
  });
}

export function preloadVoices(): void {
  if (typeof window !== "undefined") void loadVoices();
}

export async function speakText(text: string, fallbackLanguage: Language = "en"): Promise<void> {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  const clean = stripForSpeech(text);
  if (!clean) return;

  const fallback = detectTextLanguage(clean, fallbackLanguage);
  const segments = splitTextSegments(clean, fallback);

  window.speechSynthesis.cancel();
  const voices = voicesCache?.length ? voicesCache : await loadVoices();

  for (const segment of segments) {
    await speakSegment(segment.text, segment.lang, voices);
  }
}

export function stopSpeaking(): void {
  if (typeof window !== "undefined" && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SpeechRecognitionInstance = any;
type SpeechRecognitionCtor = new () => SpeechRecognitionInstance;

export function getSpeechRecognition(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as Window & {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

export function isSpeechSupported(): boolean {
  return Boolean(getSpeechRecognition());
}

export function isTTSSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

export function isRecorderSupported(): boolean {
  return typeof window !== "undefined" && Boolean(navigator.mediaDevices?.getUserMedia);
}

export type MicPermissionResult =
  | { ok: true }
  | { ok: false; reason: "denied" | "no-device" | "no-api" | "unknown" };

export async function ensureMicPermission(): Promise<MicPermissionResult> {
  if (!navigator.mediaDevices?.getUserMedia) {
    return { ok: false, reason: "no-api" };
  }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach((track) => track.stop());
    return { ok: true };
  } catch (err) {
    const name = err instanceof DOMException ? err.name : "";
    if (name === "NotAllowedError" || name === "PermissionDeniedError") {
      return { ok: false, reason: "denied" };
    }
    if (name === "NotFoundError" || name === "DevicesNotFoundError") {
      return { ok: false, reason: "no-device" };
    }
    return { ok: false, reason: "unknown" };
  }
}

function recorderMimeType(): string {
  if (typeof MediaRecorder === "undefined") return "";
  const types = ["audio/webm;codecs=opus", "audio/webm", "audio/ogg;codecs=opus", "audio/mp4"];
  return types.find((t) => MediaRecorder.isTypeSupported(t)) || "";
}

export class HoldAudioRecorder {
  private recorder: MediaRecorder | null = null;
  private stream: MediaStream | null = null;
  private chunks: Blob[] = [];

  async start(): Promise<void> {
    this.chunks = [];
    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true },
    });
    const mime = recorderMimeType();
    this.recorder = mime
      ? new MediaRecorder(this.stream, { mimeType: mime })
      : new MediaRecorder(this.stream);

    this.recorder.ondataavailable = (e) => {
      if (e.data.size > 0) this.chunks.push(e.data);
    };
    this.recorder.start(200);
  }

  stop(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!this.recorder || this.recorder.state === "inactive") {
        this.cleanup();
        reject(new Error("not-recording"));
        return;
      }
      this.recorder.onstop = () => {
        const type = this.recorder?.mimeType || "audio/webm";
        const blob = new Blob(this.chunks, { type });
        this.cleanup();
        resolve(blob);
      };
      this.recorder.onerror = () => {
        this.cleanup();
        reject(new Error("recorder-error"));
      };
      this.recorder.stop();
    });
  }

  abort(): void {
    try {
      if (this.recorder && this.recorder.state !== "inactive") {
        this.recorder.stop();
      }
    } catch {
      /* ignore */
    }
    this.cleanup();
  }

  private cleanup(): void {
    this.stream?.getTracks().forEach((t) => t.stop());
    this.stream = null;
    this.recorder = null;
    this.chunks = [];
  }
}

export async function transcribeAudioBlob(blob: Blob, language: Language): Promise<string> {
  const form = new FormData();
  const ext = blob.type.includes("ogg") ? "ogg" : blob.type.includes("mp4") ? "m4a" : "webm";
  form.append("audio", blob, `voice.${ext}`);
  form.append("language", language);

  const res = await fetch(`${getApiBase()}/api/voice/transcribe`, {
    method: "POST",
    body: form,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || `Transcribe failed (${res.status})`);
  }

  const data = (await res.json()) as { text: string };
  return (data.text || "").trim();
}

export type SpeechErrorKind =
  | "denied"
  | "network"
  | "language"
  | "no-speech"
  | "unsupported"
  | "unknown";

export function mapSpeechError(error: string): SpeechErrorKind {
  if (error === "not-allowed" || error === "service-not-allowed") return "denied";
  if (error === "network") return "network";
  if (error === "language-not-supported") return "language";
  if (error === "no-speech") return "no-speech";
  if (error === "audio-capture") return "denied";
  return "unknown";
}
