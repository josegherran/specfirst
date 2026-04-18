import { useEffect, useState } from "react";
import SpecSection from "./SpecSection.jsx";

const SECTION_ORDER = [
  "problem",
  "constraints",
  "systemBoundaries",
  "stakeholders",
  "openQuestions",
];

async function getSystemName(problemContent) {
  try {
    const res = await fetch('/anthropic-api/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': import.meta.env.VITE_ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 20,
        messages: [{ role: 'user', content: `Give me a 2-4 word name for this system. Reply with only the name, no punctuation:\n\n${problemContent}` }],
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.content?.[0]?.text?.trim() || null;
  } catch {
    return null;
  }
}

export default function RightPanel({ spec, phase }) {
  const isPreview = phase === "preview";
  const isIdle = phase === "initial";
  const isThinking = phase === "thinking";
  const [systemName, setSystemName] = useState("Untitled System");

  useEffect(() => {
    if (!isPreview) return;
    const problemContent = spec.problem.content;
    if (!problemContent) return;

    getSystemName(problemContent).then((name) => {
      if (name) setSystemName(name);
    });
  }, [isPreview, spec.problem.content]);

  return (
    <div className="h-full flex flex-col">
      {/* Idle placeholder */}
      <div className={`px-8 pt-8 pb-4 border-b border-gray-100 transition-opacity duration-300 ${isIdle ? "opacity-100" : "opacity-0 h-0 overflow-hidden pb-0 border-0"}`}>
        <p className="text-sm text-gray-400">Specification (draft) / Waiting for input…</p>
      </div>

      {/* Preview document title */}
      {isPreview && (
        <div className="px-8 pt-8 pb-6 border-b border-gray-200">
          <p className="text-xs uppercase tracking-widest text-gray-400 mb-1">Specification</p>
          <h2 className="text-xl font-semibold text-gray-900">{systemName}</h2>
        </div>
      )}

      {/* Section content */}
      {(isThinking || !isIdle) && (
        <div className={`flex-1 overflow-y-auto px-8 py-6 transition-opacity duration-500 ${isThinking ? "opacity-60" : "opacity-100"}`}>
          {SECTION_ORDER.map((key) => {
            if (isPreview && key === "openQuestions" && spec[key].content === null) {
              return null;
            }
            return (
              <SpecSection
                key={key}
                sectionKey={key}
                content={spec[key].content}
                lastUpdated={spec[key].lastUpdated}
                phase={phase}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
