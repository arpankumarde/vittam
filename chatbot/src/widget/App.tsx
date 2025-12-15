import React, { useEffect, useRef, useState } from "react";
import { Routes, Route } from "react-router";
import ChatScreen from "./screens/ChatScreen";
import FormScreen from "./screens/FormScreen";
import FinalScreen from "./screens/FinalScreen";
import { Bot, X, Sparkles } from "lucide-react";


type Props = { botId?: string };

export default function App({ botId }: Props) {
  const [open, setOpen] = useState(false); // Chat opens ONLY by clicking launcher
  const [messages, setMessages] = useState<{ who: "bot" | "user"; text: string }[]>([
    { who: "bot", text: "Hi — I'm your assistant. How can I help?" },
  ]);

  const [text, setText] = useState("");
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 640);
  const messagesRef = useRef<HTMLDivElement | null>(null);

  // Detect mobile resize
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 640);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Scroll to bottom when messages update
  useEffect(() => {
    if (messagesRef.current) messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
  }, [messages]);

  // Support host → widget messages
  useEffect(() => {
    const host = document.querySelector('[id^="chat-widget-host-"]') as HTMLElement | null;
    const target = (host && (host.shadowRoot || host)) as any;

    function onHostSend(e: Event) {
      const d = (e as CustomEvent).detail;
      if (d?.message) addMessage("user", d.message);
    }

    target?.addEventListener?.("chatwidget:send", onHostSend as EventListener);
    return () => target?.removeEventListener?.("chatwidget:send", onHostSend as EventListener);
  }, []);

  function addMessage(who: "bot" | "user", text: string) {
    setMessages((prev) => [...prev, { who, text }]);
    if (!open) setOpen(true);
  }

  function sendMessageFromInput(input?: string) {
    const content = (input ?? text).trim();
    if (!content) return;
    addMessage("user", content);
    setText("");
    // fake reply (replace with fetch to backend)
    setTimeout(() => addMessage("bot", `Demo reply: ${content}`), 600);
  }

  function closePanel() {
    setOpen(false);
  }

  // Props to pass into routed screens
  const routedProps = {
    botId,
    messages,
    addMessage,
    sendMessage: sendMessageFromInput,
    closePanel,
    messagesRef,
    setText,
    text,
  };

return (
  <div className="w-full h-full">

    {!open && (
      <button
        onClick={() => setOpen(true)}
        className="
          fixed bottom-6 right-6 z-[9999999]
          w-16 h-16 rounded-2xl
          flex items-center justify-center
          shadow-xl hover:scale-105 transition
        "
        style={{
          background: "linear-gradient(135deg, var(--v-primary), #0f766e)",
          color: "white",
        }}
      >
        <div className="relative flex flex-col items-center">
          <Bot size={28} />
          <span className="absolute -top-1 -right-2 w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
        </div>
      </button>
    )}

    {open && (
      <div
        className={`
          fixed z-[9999999] pointer-events-auto
          ${isMobile ? "inset-0 w-full h-full" : "bottom-6 right-6 w-[360px] h-[520px] rounded-3xl"}
          flex flex-col overflow-hidden
        `}
        style={{
          backgroundColor: "var(--v-bg)",
          boxShadow: "0 25px 60px rgba(0,0,0,0.25)",
        }}
      >
        <div
          className="flex items-center justify-between px-4 py-3"
          style={{
            backgroundColor: "var(--v-card)",
            borderBottom: "1px solid var(--v-border)",
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: "var(--v-primary-soft)" }}
            >
              <Bot size={20} style={{ color: "var(--v-primary)" }} />
            </div>

            <div>
              <div className="text-sm font-semibold">Vittam Assistant</div>
              <div className="text-xs" style={{ color: "var(--v-muted)" }}>
                AI Loan Guide
              </div>
            </div>
          </div>

          <button
            onClick={() => closePanel()}
            className="w-9 h-9 rounded-full flex items-center justify-center hover:opacity-80 transition"
            style={{ backgroundColor: "var(--v-card)" }}
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-hidden">
          <Routes>
            <Route path="/" element={<ChatScreen {...routedProps} />} />
            <Route path="/form" element={<FormScreen {...routedProps} />} />
            <Route path="/final" element={<FinalScreen {...routedProps} />} />
          </Routes>
        </div>

        <div
          className="flex items-center justify-center gap-2 py-2 text-xs"
          style={{
            backgroundColor: "var(--v-bg)",
            borderTop: "1px solid var(--v-border)",
            color: "var(--v-muted)",
          }}
        >
          <Sparkles size={12} />
          Powered by Vittam AI
        </div>
      </div>
    )}
  </div>
);
}
