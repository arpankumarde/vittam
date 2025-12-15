import React from "react";
import { useNavigate } from "react-router";

type ScreenProps = {
  botId?: string;
  messages: { who: "bot" | "user"; text: string }[];
  addMessage: (who: "bot" | "user", text: string) => void;
  sendMessage: (text?: string) => void;
  closePanel: () => void;
  messagesRef?: React.RefObject<HTMLDivElement>;
  text?: string;
  setText?: (s: string) => void;
};
export default function ChatScreen(props: ScreenProps) {
  const nav = useNavigate();

  const quickButtons = [
    "Apply for loan",
    "Get Insured",
    "Pre-Approved Personal Loan",
    "Self-Service",
    "Check Status",
    "Talk to Agent",
  ];

  function onQuickClick(label: string) {
    props.addMessage("user", label);
    setTimeout(() => {
      props.addMessage("bot", `Sure — I can help you with ${label.toLowerCase()}.`);
    }, 500);
  }

  return (
    <div
      className="w-full h-full flex flex-col"
      style={{ backgroundColor: "var(--v-bg)", color: "var(--v-text)" }}
    >
      {/* Content */}
      <div className="flex-1 overflow-auto px-4 pt-6 pb-4">
        {/* Intro card */}
        <div
          className="rounded-2xl p-4 mb-6 shadow-sm"
          style={{
            backgroundColor: "var(--v-card)",
            border: "1px solid var(--v-border)",
          }}
        >
          <p className="text-sm leading-relaxed" style={{ color: "var(--v-muted)" }}>
            I’ll guide you from application to sanction using Vittam’s AI-powered
            sales agents.
          </p>
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-2 gap-4">
          {quickButtons.map((label) => (
            <button
              key={label}
              onClick={() => onQuickClick(label)}
              className="rounded-2xl px-4 py-4 text-sm font-medium transition"
              style={{
                backgroundColor: "var(--v-card)",
                border: "1px solid var(--v-border)",
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Continue */}
        <button
          onClick={() => nav("/form")}
          className="mt-6 w-full h-12 rounded-full font-semibold transition"
          style={{
            backgroundColor: "var(--v-primary)",
            color: "white",
          }}
        >
          Continue →
        </button>
      </div>

      {/* Input bar */}
      <div
        className="px-3 py-3 flex items-center gap-2"
        style={{ borderTop: "1px solid var(--v-border)" }}
      >
        {/* Menu */}
        <button
          className="h-11 w-11 rounded-full flex items-center justify-center"
          style={{ backgroundColor: "var(--v-primary-soft)" }}
        >
          ☰
        </button>

        {/* Input */}
        <div
          className="flex-1 flex items-center rounded-full px-3"
          style={{
            backgroundColor: "var(--v-card)",
            border: "1px solid var(--v-border)",
          }}
        >
          <input
            value={props.text || ""}
            onChange={(e) => props.setText?.(e.target.value)}
            placeholder="How may I help you?"
            className="flex-1 bg-transparent outline-none py-2 text-sm"
          />
          <button
            onClick={() => props.sendMessage?.()}
            className="h-9 w-9 rounded-full flex items-center justify-center"
            style={{
              backgroundColor: "var(--v-primary)",
              color: "white",
            }}
          >
            ➤
          </button>
        </div>

        {/* Language */}
        <button
          className="h-11 w-11 rounded-full text-sm"
          style={{
            backgroundColor: "var(--v-card)",
            border: "1px solid var(--v-border)",
          }}
        >
          अ
        </button>
      </div>
    </div>
  );
}
