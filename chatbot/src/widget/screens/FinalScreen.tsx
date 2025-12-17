import { useLocation, useNavigate } from "react-router";

type ScreenProps = {
  botId?: string;
  messages?: { who: "bot" | "user"; text: string }[];
  addMessage?: (who: "bot" | "user", text: string) => void;
  sendMessage?: (text?: string) => void;
  closePanel?: () => void;
  messagesRef?: React.RefObject<HTMLDivElement>;
  text?: string;
  setText?: (s: string) => void;
  isLoading?: boolean;
  documentInputs?: any[];
  sessionId?: string | null;
};

export default function FinalScreen(props?: ScreenProps) {
  const { state } = useLocation();
  const nav = useNavigate();
  const name = state?.name || "Customer";

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
        className="px-4 py-3 flex items-center justify-center"
        style={{
          backgroundColor: "var(--v-card)",
          borderBottom: "1px solid var(--v-border)",
        }}
      >
        <h2 className="text-sm font-semibold">
          Application Status
        </h2>
      </div>

      {/* Center Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 text-center">
        {/* Success Icon */}
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center shadow-lg mb-5"
          style={{
            backgroundColor: "var(--v-primary)",
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="42"
            height="42"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              stroke="white"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>

        {/* Message Card */}
        <div
          className="rounded-2xl px-5 py-4 shadow-sm max-w-[280px]"
          style={{
            backgroundColor: "var(--v-card)",
            border: "1px solid var(--v-border)",
          }}
        >
          <h3 className="text-base font-semibold mb-2">
            Thank you, {name}!
          </h3>
          <p
            className="text-sm leading-relaxed"
            style={{ color: "var(--v-muted)" }}
          >
            Your application has been successfully submitted.
            Our team will review it and contact you shortly.
          </p>
        </div>
      </div>

      {/* Footer CTA */}
      <div
        className="px-4 py-3"
        style={{
          borderTop: "1px solid var(--v-border)",
          backgroundColor: "var(--v-bg)",
        }}
      >
        <button
          onClick={() => nav("/")}
          className="w-full h-12 rounded-full font-semibold transition"
          style={{
            backgroundColor: "var(--v-primary)",
            color: "#fff",
          }}
        >
          Back to Chat
        </button>
      </div>
    </div>
  );
}
