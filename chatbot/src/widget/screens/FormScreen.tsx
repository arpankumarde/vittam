import React, { useState } from "react";
import { useNavigate } from "react-router";

export default function FormScreen() {
  const nav = useNavigate();
  const [name, setName] = useState("");

  return (
    <div
      className="w-full h-full min-h-full flex flex-col"
      style={{
        backgroundColor: "var(--v-bg)",
        color: "var(--v-text)",
      }}
    >
      {/* Header */}
      <div
        className="px-4 py-3 flex items-center"
        style={{
          backgroundColor: "var(--v-card)",
          borderBottom: "1px solid var(--v-border)",
        }}
      >
        <div className="font-semibold text-sm">
          Loan Application
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-auto px-4 py-6">
        {/* Intro Card */}
        <div
          className="rounded-2xl p-4 mb-6 shadow-sm"
          style={{
            backgroundColor: "var(--v-card)",
            border: "1px solid var(--v-border)",
          }}
        >
          <p
            className="text-sm leading-relaxed"
            style={{ color: "var(--v-muted)" }}
          >
            Please provide a few details to help us start your loan application.
            This will only take a minute.
          </p>
        </div>

        {/* Name Field */}
        <div className="mb-6">
          <label
            className="block mb-2 text-sm font-medium"
            style={{ color: "var(--v-text)" }}
          >
            Your Full Name
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your name"
            className="w-full px-4 py-3 rounded-xl outline-none text-sm"
            style={{
              backgroundColor: "var(--v-card)",
              border: "1px solid var(--v-border)",
            }}
          />
        </div>

        {/* Continue */}
        <button
          disabled={!name.trim()}
          onClick={() => nav("/final", { state: { name } })}
          className="w-full h-12 rounded-full font-semibold transition"
          style={{
            backgroundColor: name.trim()
              ? "var(--v-primary)"
              : "var(--v-primary-soft)",
            color: name.trim() ? "#fff" : "var(--v-muted)",
          }}
        >
          Continue →
        </button>
      </div>

      {/* Footer / Back */}
      <div
        className="px-4 py-3"
        style={{
          borderTop: "1px solid var(--v-border)",
          backgroundColor: "var(--v-bg)",
        }}
      >
        <button
          onClick={() => nav("/")}
          className="w-full h-11 rounded-full text-sm transition"
          style={{
            backgroundColor: "var(--v-card)",
            border: "1px solid var(--v-border)",
            color: "var(--v-text)",
          }}
        >
          ← Back to Chat
        </button>
      </div>
    </div>
  );
}
