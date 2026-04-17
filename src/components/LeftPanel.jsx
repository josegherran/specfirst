import { useState } from "react";

export default function LeftPanel({ phase, onSubmit }) {
  const [input, setInput] = useState("");

  if (phase !== "initial") return null; // chat state handled in step 5

  function handleSubmit(e) {
    e.preventDefault();
    if (input.trim().length === 0) return;
    onSubmit(input.trim());
  }

  return (
    <div className="flex flex-col h-full px-10 py-12">
      <div className="mb-8">
        <h1 className="text-xl font-semibold text-gray-900 tracking-tight">
          Specification-Driven Design
        </h1>
        <p className="text-sm text-gray-400 mt-1">Think before you build</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col flex-1">
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
