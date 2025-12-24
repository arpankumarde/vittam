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
  uploadDocument,
  verifySessionDocuments,
  getDocIdFromName,
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

  // Update host element size based on open state
  useEffect(() => {
    const host = document.querySelector(
      '[id^="chat-widget-host-"]'
    ) as HTMLElement | null;
    if (!host) return;

    const isHostMobile = (host as any).__chatWidgetIsMobile;
    const dimensions = (host as any).__chatWidgetDimensions;

    if (isHostMobile || isMobile) {
      // Mobile: full screen when open, minimal when closed
      if (open) {
        host.style.inset = "0";
        host.style.width = "100dvw";
        host.style.height = "100dvh";
        host.style.right = "";
        host.style.bottom = "";
        host.style.borderRadius = "0";
      } else {
        host.style.inset = "";
        host.style.width = "auto";
        host.style.height = "auto";
        host.style.right = "1.25rem";
        host.style.bottom = "1.25rem";
        host.style.borderRadius = "";
      }
    } else if (dimensions) {
      // Desktop: fixed size when open, minimal when closed
      if (open) {
        host.style.width = `${dimensions.width}px`;
        host.style.height = `${dimensions.height}px`;
      } else {
        host.style.width = "auto";
        host.style.height = "auto";
      }
    }
  }, [open, isMobile]);

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

    // Upload all documents to the server
    async function uploadAllDocuments() {
      try {
        setIsLoading(true);
        const uploadPromises: Promise<void>[] = [];
        const documentIds: string[] = [];

        // Upload each document
        for (const input of documentInputs) {
          const uploadedDoc = uploadedDocuments.get(input.name);
          if (!uploadedDoc) continue;

          // Get doc_id from input (backend should always provide this)
          // Fallback to name mapping if doc_id is missing
          let docId = input.doc_id || getDocIdFromName(input.name);
          if (!docId) {
            console.error(`Could not determine doc_id for document: ${input.name}. Backend should provide doc_id in inputs array.`);
            // Generate fallback doc_id as last resort
            docId = input.name.toLowerCase().replace(/[^a-z0-9]+/g, '_');
            if (!docId) {
              console.error(`Could not generate fallback doc_id for: ${input.name}`);
              continue;
            }
            console.warn(`Using generated fallback doc_id: ${docId}`);
          }

          // Upload document
          const uploadPromise = uploadDocument(
            sessionId!,
            docId,
            uploadedDoc.file
          )
            .then((response) => {
              documentIds.push(response.document_id);
            })
            .catch((error) => {
              console.error(`Failed to upload ${input.name}:`, error);
              throw error;
            });

          uploadPromises.push(uploadPromise);
        }

        // Wait for all uploads to complete
        await Promise.all(uploadPromises);

        // Show success message
        addMessage("user", `${documentInputs.length} documents uploaded`);

        // STEP 1: Automatically verify all uploaded documents
        try {
          const verificationResult = await verifySessionDocuments(sessionId!);
          
          if (verificationResult.all_verified) {
            // All documents verified successfully
            addMessage("bot", `✅ Great! All ${verificationResult.verified_count} documents have been verified successfully. Your documents are ready!`);
            
            // Now send message to backend to proceed with loan process
            const docIdsMessage = `Documents uploaded and verified. Document IDs: ${documentIds.join(", ")}`;
            await sendMessageFromInput(docIdsMessage);
            
            // Clear document inputs and uploaded documents
            setDocumentInputs([]);
            setUploadedDocuments(new Map());
            hasSubmittedDocumentsRef.current = false;
          } else {
            // Some documents were rejected - need to reupload
            const rejectedDocs = verificationResult.results.filter(r => !r.verified);
            let rejectionMessage = `⚠️ Document verification completed:\n`;
            rejectionMessage += `✅ Verified: ${verificationResult.verified_count} documents\n`;
            rejectionMessage += `❌ Rejected: ${verificationResult.rejected_count} documents\n\n`;
            rejectionMessage += `Please reupload the following documents:\n`;
            
            rejectedDocs.forEach(doc => {
              rejectionMessage += `- ${doc.doc_name}: ${doc.feedback || 'Document verification failed'}\n`;
            });
            
            addMessage("bot", rejectionMessage);
            
            // Clear only the rejected documents from uploadedDocuments
            // Keep verified ones, remove rejected ones so user can reupload
            setUploadedDocuments((prev) => {
              const newMap = new Map(prev);
              rejectedDocs.forEach(rejected => {
                // Find the document input by doc_id
                const input = documentInputs.find(inp => {
                  const docId = inp.doc_id || getDocIdFromName(inp.name);
                  return docId === rejected.doc_id;
                });
                if (input) {
                  newMap.delete(input.name);
                }
              });
              return newMap;
            });
            
            // Don't send message to backend yet - wait for reupload
            hasSubmittedDocumentsRef.current = false;
          }
        } catch (error) {
          console.error("Failed to verify documents:", error);
          addMessage("bot", "I'm sorry, there was an error verifying your documents. Please try uploading them again.");
          hasSubmittedDocumentsRef.current = false;
        }
      } catch (error) {
        console.error("Failed to upload documents:", error);
        addMessage(
          "bot",
          "I'm sorry, there was an error uploading your documents. Please try again."
        );
        hasSubmittedDocumentsRef.current = false;
      } finally {
        setIsLoading(false);
      }
    }

    uploadAllDocuments();
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
            pointerEvents: "auto",
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

              <div className="select-none">
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
