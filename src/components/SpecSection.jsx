import { useEffect, useRef, useState } from "react";

const SECTION_LABELS = {
  problem:          "Problem",
  constraints:      "Constraints & Guardrails",
  systemBoundaries: "System Boundaries",
  stakeholders:     "Stakeholders",
  openQuestions:    "Open Questions",
};

export default function SpecSection({ sectionKey, content, lastUpdated, phase }) {
  const title = SECTION_LABELS[sectionKey] || sectionKey;
  const [isPulsing, setIsPulsing] = useState(false);
  const prevUpdated = useRef(lastUpdated);
  // Show provenance only if updated within the last 10 seconds (from the latest response)
  const isRecent = lastUpdated !== null && (Date.now() - lastUpdated) < 10_000;
  const showProvenance = isRecent && phase !== "preview" && phase !== "initial";

  useEffect(() => {
    if (phase === "preview") return;
    if (lastUpdated !== prevUpdated.current && lastUpdated !== null) {
      setIsPulsing(false);
      // flush the removal so the browser registers the class was gone
      requestAnimationFrame(() => {
        setIsPulsing(true);
        prevUpdated.current = lastUpdated;
      });
    }
  }, [lastUpdated, phase]);

  function handleAnimationEnd() {
    setIsPulsing(false);
  }

  const isEmpty = content === null;
  const isDraft = isEmpty && phase !== "initial" && phase !== "thinking";

  return (
    <div
      className={`mb-6 rounded-lg px-4 py-3 ${isPulsing ? "spec-pulse" : ""}`}
      onAnimationEnd={handleAnimationEnd}
    >
      <div className="flex items-center gap-2 mb-1">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
          {title}
        </h3>
        {isDraft && phase !== "preview" && (
          <span className="text-xs text-gray-400 italic">(draft)</span>
        )}
        {showProvenance && content !== null && phase !== "preview" && (
          <span className="text-xs text-indigo-400">· Added from your latest response</span>
        )}
      </div>

      {isEmpty ? (
        <p className="text-sm text-gray-400 italic">
          {phase === "initial" || phase === "thinking" ? "pending…" : "pending"}
        </p>
      ) : (
        <p className={`text-sm leading-relaxed ${phase === "preview" ? "text-gray-800 leading-6" : "text-gray-700"}`}>
          {content}
        </p>
      )}
    </div>
  );
}
