import { useEffect, useRef, useState } from "react";
import { Routes, Route } from "react-router";
import ChatScreen from "./screens/ChatScreen";
import FormScreen from "./screens/FormScreen";
import FinalScreen from "./screens/FinalScreen";
import { RiCustomerService2Fill } from "react-icons/ri";
import { IoClose } from "react-icons/io5";
import { BsStars } from "react-icons/bs";

import {
  createSession,
  sendChatMessage,
  getSessionHistory,
  type InputSpec,
} from "../services/api";

type Props = { botId?: string };

type UploadedDocument = {
  name: string;
  fileName: string;
  file: File;
};

export default function App({ botId }: Props) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<
    { who: "bot" | "user"; text: string }[]
  >([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [documentInputs, setDocumentInputs] = useState<InputSpec[]>([]);
  const [uploadedDocuments, setUploadedDocuments] = useState<
    Map<string, UploadedDocument>
  >(new Map());
  const [text, setText] = useState("");
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 640);
  const messagesRef = useRef<HTMLDivElement | null>(null);
  const hasSubmittedDocumentsRef = useRef(false);

  // Detect mobile resize
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 640);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Initialize session on mount
  useEffect(() => {
    async function initializeSession() {
      try {
        setIsLoading(true);
        const response = await createSession();
        setSessionId(response.session_id);
        // Add welcome message from server
        setMessages([{ who: "bot", text: response.message }]);
      } catch (error) {
        console.error("Failed to create session:", error);
        setMessages([
          {
            who: "bot",
            text: "Hi — I'm your assistant. How can I help? (Note: Unable to connect to server)",
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    }

    initializeSession();
  }, []);

  // Scroll to bottom when messages update
  useEffect(() => {
    if (messagesRef.current)
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
  }, [messages]);

  // Support host → widget messages
  useEffect(() => {
    const host = document.querySelector(
      '[id^="chat-widget-host-"]'
    ) as HTMLElement | null;
    const target = (host && (host.shadowRoot || host)) as any;

    async function onHostSend(e: Event) {
      const d = (e as CustomEvent).detail;
      if (d?.message && sessionId) {
        await sendMessageFromInput(d.message);
      }
    }

    target?.addEventListener?.("chatwidget:send", onHostSend as EventListener);
    return () =>
      target?.removeEventListener?.(
        "chatwidget:send",
        onHostSend as EventListener
      );
  }, [sessionId]);

  function addMessage(who: "bot" | "user", text: string) {
    setMessages((prev) => [...prev, { who, text }]);
    if (!open) setOpen(true);
  }

  async function sendMessageFromInput(input?: string) {
    const content = (input ?? text).trim();
    if (!content || !sessionId || isLoading) return;

    // Add user message immediately
    addMessage("user", content);
    setText("");
    setIsLoading(true);
    setDocumentInputs([]);

    try {
      // Send message to server
      const response = await sendChatMessage(content, sessionId);

      // Add bot response
      addMessage("bot", response.message);

      // Handle document upload requirements
      if (response.inputs && response.inputs.length > 0) {
        setDocumentInputs(response.inputs);
      }
    } catch (error) {
      console.error("Failed to send message:", error);
      addMessage("bot", "I'm sorry, I encountered an error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  function closePanel() {
    setOpen(false);
  }

  function handleDocumentUpload(docName: string, file: File) {
    setUploadedDocuments((prev) => {
      const newMap = new Map(prev);
      newMap.set(docName, {
        name: docName,
        fileName: file.name,
        file,
      });
      return newMap;
    });
  }

  // Auto-submit when all documents are uploaded
  useEffect(() => {
    if (
      documentInputs.length === 0 ||
      !sessionId ||
      uploadedDocuments.size === 0
    ) {
      hasSubmittedDocumentsRef.current = false;
      return;
    }

    // Check if all documents are uploaded
    const allUploaded = documentInputs.every((input) =>
      uploadedDocuments.has(input.name)
    );
    if (!allUploaded || hasSubmittedDocumentsRef.current) return;

    // Mark as submitted to prevent duplicate submissions
    hasSubmittedDocumentsRef.current = true;

    // Create structured data message
    const structuredData = `Name: Rajesh Kumar
rajesh.kumar@email.com
Address: 123, MG Road, Mumbai - 400001
Phone: 9876543210
Rajesh Kumar	ABCDE1234F
DOB: 15/5/1992`;

    // Show user message about all documents being submitted
    addMessage("user", `${documentInputs.length} documents sent`);

    // Small delay to show the message first
    const timeoutId = setTimeout(() => {
      // Send structured data to backend
      sendMessageFromInput(structuredData);

      // Clear document inputs and uploaded documents
      setDocumentInputs([]);
      setUploadedDocuments(new Map());
      hasSubmittedDocumentsRef.current = false;
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [uploadedDocuments, documentInputs, sessionId]);

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
    isLoading,
    documentInputs,
    sessionId,
    uploadedDocuments,
    onDocumentUpload: handleDocumentUpload,
  };

  return (
    <div className="w-full h-full">
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-[9999999] w-14 md:w-16 h-14 md:h-16 rounded-2xl flex items-center justify-center shadow-xl hover:scale-105 transition text-white"
          style={{
            background: "linear-gradient(135deg, var(--v-primary), #0f766e)",
          }}
        >
          <div className="relative flex flex-col items-center">
            <RiCustomerService2Fill size={28} />
            <span className="absolute -top-1 -right-2 w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
          </div>
        </button>
      )}

      {open && (
        <div
          className="w-full h-full flex flex-col overflow-hidden"
          style={{
            backgroundColor: "var(--v-bg)",
            boxShadow: "0 25px 60px rgba(0,0,0,0.25)",
            borderRadius: isMobile ? "0px" : "24px",
          }}
        >
          <div
            className="flex items-center justify-between px-4 py-3"
            style={{
              backgroundColor: "var(--v-primary)",
              borderBottom: "none",
            }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: "rgba(255,255,255,0.2)" }}
              >
                <RiCustomerService2Fill size={20} style={{ color: "white" }} />
              </div>

              <div>
                <div className="text-sm font-semibold text-white">
                  Vittam Assistant
                </div>
                <div className="text-xs text-white">Your Loan Guide</div>
              </div>
            </div>

            <button
              onClick={() => closePanel()}
              className="w-9 h-9 rounded-full flex items-center justify-center hover:opacity-80 transition"
              style={{ backgroundColor: "var(--v-card)" }}
            >
              <IoClose size={18} />
            </button>
          </div>

          <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
            <Routes>
              <Route path="/" element={<ChatScreen {...routedProps} />} />
              <Route path="/form" element={<FormScreen {...routedProps} />} />
              <Route path="/final" element={<FinalScreen {...routedProps} />} />
            </Routes>
          </div>

          <div
            className="hidden md:flex items-center justify-center gap-2 py-2 text-xs"
            style={{
              backgroundColor: "var(--v-primary)",
              borderTop: "1px solid var(--v-border)",
              color: "white",
            }}
          >
            <BsStars size={12} />
            Powered by Vittam AI
          </div>
        </div>
      )}
    </div>
  );
}
