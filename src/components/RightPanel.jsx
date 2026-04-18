import { useEffect, useState } from "react";
import SpecSection from "./SpecSection.jsx";

const SECTION_ORDER = [
  "problem",
  "constraints",
  "systemBoundaries",
  "stakeholders",
  "openQuestions",
];

const SECTION_LABELS = {
  problem:          "Problem",
  constraints:      "Constraints & Guardrails",
  systemBoundaries: "System Boundaries",
  stakeholders:     "Stakeholders",
  openQuestions:    "Open Questions",
};

function buildMarkdown(spec, systemName) {
  const sections = SECTION_ORDER.filter(
    (key) => !(key === "openQuestions" && spec[key].content === null)
  );
  const body = sections.map((key) => {
    const content = (key === "stakeholders" && spec[key].content === null)
      ? "Not explored in this session."
      : spec[key].content ?? "pending";
    return `## ${SECTION_LABELS[key]}\n\n${content}`;
  }).join("\n\n---\n\n");
  return `# Specification: ${systemName}\n\n${body}\n`;
}

function downloadMarkdown(spec, systemName) {
  const md = buildMarkdown(spec, systemName);
  const blob = new Blob([md], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${systemName.toLowerCase().replace(/\s+/g, "-")}-spec.md`;
  a.click();
  URL.revokeObjectURL(url);
}

async function getSystemName(problemContent) {
  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
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
        <div className="px-8 pt-8 pb-6 border-b border-gray-200 flex items-start justify-between">
          <div>
            <p className="text-xs uppercase tracking-widest text-gray-400 mb-1">Specification</p>
            <h2 className="text-xl font-semibold text-gray-900">{systemName}</h2>
          </div>
          <button
            onClick={() => downloadMarkdown(spec, systemName)}
            title="Download as Markdown"
            className="mt-1 p-2 text-gray-400 hover:text-gray-700 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
          </button>
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
