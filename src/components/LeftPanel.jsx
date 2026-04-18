import { useState, useEffect, useRef } from "react";
import ThinkingIndicator from "./ThinkingIndicator.jsx";

export default function LeftPanel({ phase, messages, streamingText, onSubmit, onPreview }) {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);
  const chatInputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (phase === "clarifying" || phase === "complete") {
      chatInputRef.current?.focus();
    }
  }, [phase, messages.length]);

  // ── Initial state ──────────────────────────────────────────────────────────
  if (phase === "initial") {
    function handleInitialSubmit(e) {
      e.preventDefault();
      if (input.trim().length === 0) return;
      onSubmit(input.trim());
      setInput("");
    }

    return (
      <div className="flex flex-col h-full px-10 py-12">
        <div className="mb-8">
          <h1 className="text-xl font-semibold text-gray-900 tracking-tight">
            Specification-Driven Design
          </h1>
          <p className="text-sm text-gray-400 mt-1">Think before you build</p>
        </div>

        <form onSubmit={handleInitialSubmit} className="flex flex-col flex-1">
          <p className="text-base text-gray-700 mb-1">
            Describe the system you&apos;re about to design.
          </p>
          <p className="text-sm text-gray-400 mb-4">
            Messy is fine. Assumptions are okay. We&apos;ll refine together.
          </p>

          <textarea
            className="w-full border border-gray-200 rounded-md p-3 text-sm text-gray-900 placeholder-gray-300 resize-none focus:outline-none focus:ring-1 focus:ring-gray-400"
            rows={6}
            autoFocus
            placeholder='e.g. "We need a system that handles user onboarding and risk checks for a fintech product…"'
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />

          <button
            type="submit"
            disabled={input.length === 0}
            className="mt-4 self-start px-5 py-2 bg-gray-900 text-white text-sm rounded-md disabled:opacity-30 disabled:cursor-not-allowed transition-opacity"
          >
            Start shaping the spec →
          </button>
        </form>
      </div>
    );
  }

  // ── Chat state (thinking / clarifying / complete / preview) ───────────────
  const userMessages = messages.filter((m) => m.role === "user");
  const originalInput = userMessages[0]?.content ?? "";

  const isInputDisabled = phase === "thinking" || phase === "preview";
  const placeholder =
    messages.length <= 1
      ? "Type your answer…"
      : "Answer in any order. Short answers are fine.";

  function handleChatSubmit(e) {
    e.preventDefault();
    if (input.trim().length === 0 || isInputDisabled) return;
    onSubmit(input.trim());
    setInput("");
  }

  // Build display messages from history (skip the first user message — shown as bubble)
  const chatMessages = messages.slice(1);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-8 pt-8 pb-4 border-b border-gray-100 shrink-0">
        <h1 className="text-base font-semibold text-gray-900 tracking-tight">
          Specification-Driven Design
        </h1>
        <p className="text-xs text-gray-400 mt-0.5">Think before you build</p>
      </div>

      {/* Scrollable message area */}
      <div className="flex-1 overflow-y-auto min-h-0 px-8 py-4 space-y-4">
        {/* Original input bubble */}
        <div>
          <p className="text-xs text-gray-400 mb-1 uppercase tracking-wide">Your input</p>
          <div className="bg-gray-50 border border-gray-200 rounded-md p-3 text-sm text-gray-700 whitespace-pre-wrap">
            {originalInput}
          </div>
        </div>

        {/* Chat history (all messages after the first user message) */}
        {chatMessages.map((msg, idx) => (
          <div key={idx} className={msg.role === "user" ? "flex justify-end" : ""}>
            {msg.role === "user" ? (
              <div className="bg-gray-900 text-white rounded-md px-3 py-2 text-sm max-w-xs whitespace-pre-wrap">
                {msg.content}
              </div>
            ) : (
              <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                {msg.content}
              </div>
            )}
          </div>
        ))}

        {/* ThinkingIndicator and live stream — always at the bottom, after history */}
        {phase === 'thinking' && !streamingText && <ThinkingIndicator phase={phase} />}
        {phase === 'thinking' && streamingText && (
          <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
            {streamingText}
          </div>
        )}

        {/* Preview button — appears after exit message in complete phase */}
        {phase === "complete" && (
          <button
            onClick={onPreview}
            className="text-sm text-gray-500 underline underline-offset-2 hover:text-gray-800 transition-colors mt-2"
          >
            Preview final specification →
          </button>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Bottom-anchored chat input */}
      {phase !== "preview" && (
        <form
          onSubmit={handleChatSubmit}
          className="shrink-0 px-8 py-4 border-t border-gray-100 bg-white"
        >
          <div className="flex gap-2">
            <input
              ref={chatInputRef}
              type="text"
              className="flex-1 border border-gray-200 rounded-md px-3 py-2 text-sm text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-400 disabled:opacity-40"
              placeholder={isInputDisabled ? "" : placeholder}
              value={input}
              disabled={isInputDisabled}
              onChange={(e) => setInput(e.target.value)}
            />
            <button
              type="submit"
              disabled={isInputDisabled || input.length === 0}
              className="px-4 py-2 bg-gray-900 text-white text-sm rounded-md disabled:opacity-30 disabled:cursor-not-allowed transition-opacity"
            >
              Send
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
