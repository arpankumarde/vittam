import React from "react";
import { useNavigate } from "react-router";
import { User, Upload, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import type { InputSpec } from "../../services/api";
import { IoSend } from "react-icons/io5";

import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { RiCustomerService2Fill } from "react-icons/ri";

type UploadedDocument = {
  name: string;
  fileName: string;
  file: File;
};

type ScreenProps = {
  botId?: string;
  messages: { who: "bot" | "user"; text: string }[];
  addMessage: (who: "bot" | "user", text: string) => void;
  sendMessage: (text?: string) => void;
  closePanel: () => void;
  messagesRef?: React.RefObject<HTMLDivElement>;
  text?: string;
  setText?: (s: string) => void;
  isLoading?: boolean;
  documentInputs?: InputSpec[];
  sessionId?: string | null;
  uploadedDocuments?: Map<string, UploadedDocument>;
  onDocumentUpload?: (docName: string, file: File) => void;
};
export default function ChatScreen(props: ScreenProps) {
  const nav = useNavigate();
  const {
    messages,
    addMessage,
    sendMessage,
    messagesRef,
    text,
    setText,
    isLoading,
    documentInputs = [],
    uploadedDocuments = new Map(),
    onDocumentUpload,
  } = props;

  const quickButtons = [
    "Apply for loan",
    "Get Insured",
    "Pre-Approved Personal Loan",
    "Self-Service",
    "Check Status",
    "Talk to Agent",
  ];

  function onQuickClick(label: string) {
    sendMessage(label);
  }

  function handleFileUpload(docName: string) {
    // Create a file input element
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*,.pdf";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        // Validate file size (1MB = 1048576 bytes)
        const MAX_FILE_SIZE = 1048576;
        if (file.size > MAX_FILE_SIZE) {
          alert(
            `File size exceeds 1MB limit. Current size: ${(
              file.size /
              1024 /
              1024
            ).toFixed(2)}MB`
          );
          return;
        }

        if (file.size === 0) {
          alert("File is empty. Please select a valid file.");
          return;
        }

        // Store the uploaded document
        onDocumentUpload?.(docName, file);
      }
    };
    input.click();
  }

  return (
    <div
      className="w-full h-full min-h-0 flex flex-col"
      style={{ backgroundColor: "var(--v-bg)", color: "var(--v-text)" }}
    >
      {/* Messages Area */}
      <div
        ref={messagesRef}
        className="flex-1 overflow-y-auto px-4 py-4"
        style={{ maxHeight: "100%" }}
      >
        {/* Show messages */}
        {messages.length === 0 ? (
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
              I'll guide you from application to sanction using Vittam's
              AI-powered sales agents.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-3 ${
                  msg.who === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {msg.who === "bot" && (
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: "var(--v-primary-soft)" }}
                  >
                    <RiCustomerService2Fill
                      size={16}
                      style={{ color: "var(--v-primary)" }}
                    />
                  </div>
                )}
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                    msg.who === "user" ? "rounded-tr-sm" : "rounded-tl-sm"
                  }`}
                  style={{
                    backgroundColor:
                      msg.who === "user" ? "var(--v-primary)" : "var(--v-card)",
                    color: msg.who === "user" ? "white" : "var(--v-text)",
                    border:
                      msg.who === "bot" ? "1px solid var(--v-border)" : "none",
                  }}
                >
                  {msg.who === "bot" ? (
                    <div className="text-sm leading-relaxed prose prose-sm max-w-none">
                      <ReactMarkdown
                        components={{
                          p: ({ children }) => (
                            <p
                              className="mb-2 last:mb-0"
                              style={{ color: "var(--v-text)" }}
                            >
                              {children}
                            </p>
                          ),
                          strong: ({ children }) => (
                            <strong
                              style={{
                                color: "var(--v-text)",
                                fontWeight: 600,
                              }}
                            >
                              {children}
                            </strong>
                          ),
                          em: ({ children }) => (
                            <em style={{ color: "var(--v-text)" }}>
                              {children}
                            </em>
                          ),
                          ul: ({ children }) => (
                            <ul
                              className="list-disc list-inside mb-2 space-y-1"
                              style={{ color: "var(--v-text)" }}
                            >
                              {children}
                            </ul>
                          ),
                          ol: ({ children }) => (
                            <ol
                              className="list-decimal list-inside mb-2 space-y-1"
                              style={{ color: "var(--v-text)" }}
                            >
                              {children}
                            </ol>
                          ),
                          li: ({ children }) => (
                            <li style={{ color: "var(--v-text)" }}>
                              {children}
                            </li>
                          ),
                          code: ({ children, className }) => {
                            const isInline = !className;
                            return isInline ? (
                              <code
                                className="px-1.5 py-0.5 rounded text-xs"
                                style={{
                                  backgroundColor: "var(--v-primary-soft)",
                                  color: "var(--v-primary)",
                                }}
                              >
                                {children}
                              </code>
                            ) : (
                              <code
                                className="block p-2 rounded text-xs overflow-x-auto"
                                style={{
                                  backgroundColor: "var(--v-primary-soft)",
                                  color: "var(--v-primary)",
                                }}
                              >
                                {children}
                              </code>
                            );
                          },
                          pre: ({ children }) => (
                            <pre className="mb-2 overflow-x-auto">
                              {children}
                            </pre>
                          ),
                          blockquote: ({ children }) => (
                            <blockquote
                              className="border-l-4 pl-3 my-2 italic"
                              style={{
                                borderColor: "var(--v-primary)",
                                color: "var(--v-muted)",
                              }}
                            >
                              {children}
                            </blockquote>
                          ),
                          a: ({ children, href }) => (
                            <a
                              href={href}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="underline"
                              style={{ color: "var(--v-primary)" }}
                            >
                              {children}
                            </a>
                          ),
                          h1: ({ children }) => (
                            <h1
                              className="text-base font-semibold mb-2 mt-3 first:mt-0"
                              style={{ color: "var(--v-text)" }}
                            >
                              {children}
                            </h1>
                          ),
                          h2: ({ children }) => (
                            <h2
                              className="text-sm font-semibold mb-2 mt-3 first:mt-0"
                              style={{ color: "var(--v-text)" }}
                            >
                              {children}
                            </h2>
                          ),
                          h3: ({ children }) => (
                            <h3
                              className="text-sm font-semibold mb-1 mt-2 first:mt-0"
                              style={{ color: "var(--v-text)" }}
                            >
                              {children}
                            </h3>
                          ),
                          hr: () => (
                            <hr
                              className="my-2"
                              style={{ borderColor: "var(--v-border)" }}
                            />
                          ),
                        }}
                      >
                        {msg.text}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                      {msg.text}
                    </p>
                  )}
                </div>
                {msg.who === "user" && (
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: "var(--v-primary-soft)" }}
                  >
                    <User size={16} style={{ color: "var(--v-primary)" }} />
                  </div>
                )}
              </div>
            ))}

            {/* Loading indicator */}
            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: "var(--v-primary-soft)" }}
                >
                  <RiCustomerService2Fill
                    size={16}
                    style={{ color: "var(--v-primary)" }}
                  />
                </div>
                <div
                  className="rounded-2xl rounded-tl-sm px-4 py-2.5"
                  style={{
                    backgroundColor: "var(--v-card)",
                    border: "1px solid var(--v-border)",
                  }}
                >
                  <Loader2
                    size={16}
                    className="animate-spin"
                    style={{ color: "var(--v-primary)" }}
                  />
                </div>
              </div>
            )}

            {/* Document upload requirements */}
            {documentInputs.length > 0 && (
              <div
                className="rounded-2xl p-4 space-y-3"
                style={{
                  backgroundColor: "var(--v-card)",
                  border: "1px solid var(--v-border)",
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <p
                    className="text-sm font-semibold"
                    style={{ color: "var(--v-text)" }}
                  >
                    Documents Required:
                  </p>
                  <p
                    className="text-xs font-medium"
                    style={{ color: "var(--v-primary)" }}
                  >
                    {uploadedDocuments.size} of {documentInputs.length} uploaded
                  </p>
                </div>
                {documentInputs.map((input, idx) => {
                  const isUploaded = uploadedDocuments.has(input.name);
                  const uploadedDoc = uploadedDocuments.get(input.name);
                  return (
                    <div
                      key={idx}
                      className={`w-full flex items-center justify-between p-3 rounded-xl transition ${
                        isUploaded ? "opacity-75" : "hover:opacity-80"
                      }`}
                      style={{
                        backgroundColor: isUploaded
                          ? "var(--v-bg)"
                          : "var(--v-primary-soft)",
                        border: `1px solid ${
                          isUploaded ? "var(--v-primary)" : "var(--v-border)"
                        }`,
                      }}
                    >
                      <div className="flex-1 text-left">
                        <div className="flex items-center gap-2">
                          <p
                            className="text-sm font-medium"
                            style={{ color: "var(--v-text)" }}
                          >
                            {input.name}
                          </p>
                          {isUploaded && (
                            <span
                              className="text-xs px-2 py-0.5 rounded"
                              style={{
                                backgroundColor: "var(--v-primary)",
                                color: "white",
                              }}
                            >
                              ✓
                            </span>
                          )}
                        </div>
                        {isUploaded ? (
                          <p
                            className="text-xs mt-1"
                            style={{ color: "var(--v-primary)" }}
                          >
                            {uploadedDoc?.fileName}
                          </p>
                        ) : (
                          <p
                            className="text-xs mt-1"
                            style={{ color: "var(--v-muted)" }}
                          >
                            {input.description}
                          </p>
                        )}
                      </div>
                      {!isUploaded && (
                        <button
                          onClick={() => handleFileUpload(input.name)}
                          className="ml-2"
                        >
                          <Upload
                            size={18}
                            style={{ color: "var(--v-primary)" }}
                          />
                        </button>
                      )}
                    </div>
                  );
                })}
                {uploadedDocuments.size === documentInputs.length &&
                  documentInputs.length > 0 && (
                    <div className="pt-2">
                      <p
                        className="text-xs text-center"
                        style={{ color: "var(--v-muted)" }}
                      >
                        All documents uploaded. Submitting...
                      </p>
                    </div>
                  )}
              </div>
            )}

            {/* Quick action buttons (show when no messages or few messages) */}
            {messages.length <= 2 && (
              <div className="grid grid-cols-2 gap-3 mt-4">
                {quickButtons.slice(0, 4).map((label) => (
                  <button
                    key={label}
                    onClick={() => onQuickClick(label)}
                    className="rounded-xl px-3 py-2.5 text-xs font-medium transition hover:opacity-80 select-none"
                    style={{
                      backgroundColor: "var(--v-card)",
                      border: "1px solid var(--v-border)",
                      color: "var(--v-text)",
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Input bar */}
      <div
        className="px-3 py-3 flex items-center"
        style={{
          borderTop: "1px solid var(--v-border)",
          backgroundColor: "var(--v-bg)",
        }}
      >
        {/* Input */}
        <div
          className="flex-1 flex items-center rounded-full overflow-hidden "
          style={{
            backgroundColor: "var(--v-card)",
            border: "1px solid var(--v-border)",
          }}
        >
          <input
            value={text || ""}
            onChange={(e) => setText?.(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage?.();
              }
            }}
            placeholder="Type your message..."
            disabled={isLoading}
            className="flex-1 bg-transparent outline-none pl-4 pr-2 py-2 text-sm"
            style={{ color: "var(--v-text)" }}
          />
          <button
            onClick={() => sendMessage?.()}
            disabled={isLoading || !text?.trim()}
            className="
    h-10 w-10
    rounded-full
    flex items-center justify-center
    transition
    disabled:opacity-50
    disabled:cursor-not-allowed
    hover:scale-105
    active:scale-95
  "
            style={{
              backgroundColor: "var(--v-primary)",
            }}
          >
            {isLoading ? (
              <AiOutlineLoading3Quarters
                size={18}
                className="animate-spin text-white"
              />
            ) : (
              <IoSend size={18} className="text-white ml-[1px]" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
