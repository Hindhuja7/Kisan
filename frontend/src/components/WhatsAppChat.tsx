"use client";

import { useEffect, useRef, useState } from "react";
import { fetchApi } from "@/lib/api";
import { Language, WhatsAppChatResponse, WhatsAppMessage } from "@/lib/types";

const QUICK_REPLIES = [
  { te: "మండి ధర ఎంత?", en: "What is mandi price?", hi: "मंडी भाव क्या है?" },
  { te: "పంట ఎప్పుడు కోయాలి?", en: "When to harvest?", hi: "कटाई कब करें?" },
  { te: "నా పంట అమ్మండి", en: "Sell my crop", hi: "फसल बेचो" },
];

interface Props {
  phone?: string;
  crop: string;
  language: Language;
}

export default function WhatsAppChat({ phone = "+919876543210", crop, language }: Props) {
  const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  async function loadHistory() {
    try {
      const data = await fetchApi<{ messages: WhatsAppMessage[] }>(
        `/api/whatsapp/messages?phone=${encodeURIComponent(phone)}`
      );
      setMessages(data.messages);
    } catch {
      setMessages([]);
    }
  }

  useEffect(() => {
    loadHistory();
  }, [phone]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage(text: string) {
    if (!text.trim() || loading) return;
    setLoading(true);
    setInput("");

    const optimistic: WhatsAppMessage = {
      phone,
      direction: "inbound",
      message: text,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);

    try {
      const res = await fetchApi<WhatsAppChatResponse>("/api/whatsapp/chat", {
        method: "POST",
        body: JSON.stringify({ phone, message: text, crop, language }),
      });
      setMessages((prev) => [
        ...prev,
        { phone, direction: "outbound", message: res.reply, intent: res.intent },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { phone, direction: "outbound", message: "⚠️ Backend offline. Start FastAPI on port 8000." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  const quick = QUICK_REPLIES.map((q) => q[language] || q.en);

  return (
    <div className="flex flex-col h-[480px] rounded-2xl overflow-hidden border border-white/10 bg-[#0b141a]">
      <div className="px-4 py-3 bg-[#1f2c34] border-b border-white/5 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center text-lg">🌱</div>
        <div>
          <p className="text-white font-medium text-sm">KisanMitra AI</p>
          <p className="text-emerald-400 text-xs">WhatsApp · GPT-4o powered</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+PHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjMGExMTE0Ii8+PGNpcmNsZSBjeD0iNSIgY3k9IjUiIHI9IjEiIGZpbGw9IiMxZTI5MmUiLz48L3N2Zz4=')]">
        {messages.length === 0 && (
          <p className="text-center text-gray-500 text-sm py-8">
            Send a message — try asking about mandi prices or harvest timing
          </p>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.direction === "inbound" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[80%] px-3 py-2 rounded-lg text-sm ${
                m.direction === "inbound"
                  ? "bg-[#005c4b] text-white rounded-br-none"
                  : "bg-[#1f2c34] text-gray-100 rounded-bl-none"
              }`}
            >
              {m.message}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="px-3 py-2 flex gap-2 overflow-x-auto border-t border-white/5 bg-[#1f2c34]">
        {quick.map((q) => (
          <button
            key={q}
            type="button"
            onClick={() => sendMessage(q)}
            className="text-xs whitespace-nowrap px-3 py-1 rounded-full bg-white/10 text-gray-300 hover:bg-emerald-600/30"
          >
            {q}
          </button>
        ))}
      </div>

      <form
        className="flex gap-2 p-3 bg-[#1f2c34]"
        onSubmit={(e) => {
          e.preventDefault();
          sendMessage(input);
        }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 bg-[#2a3942] rounded-full px-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none"
        />
        <button
          type="submit"
          disabled={loading}
          className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center text-white disabled:opacity-50"
        >
          ➤
        </button>
      </form>
    </div>
  );
}
