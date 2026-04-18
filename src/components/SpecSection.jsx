import { useEffect, useRef, useState } from "react";

const SECTION_LABELS = {
  problem:          "Problem",
  constraints:      "Constraints & Guardrails",
  systemBoundaries: "System Boundaries",
  stakeholders:     "Stakeholders",
  openQuestions:    "Open Questions",
};

function renderMarkdown(text) {
  if (!text) return null;
  const lines = text.split('\n');
  const elements = [];
  let listItems = [];

  lines.forEach((line, i) => {
    if (/^[-*] /.test(line)) {
      listItems.push(line.slice(2));
    } else {
      if (listItems.length > 0) {
        elements.push(
          <ul key={`ul-${i}`} className="list-disc ml-5 space-y-1 mb-3">
            {listItems.map((item, j) => <li key={j}>{item}</li>)}
          </ul>
        );
        listItems = [];
      }
      if (line.trim()) {
        elements.push(<p key={i} className="mb-3 last:mb-0">{line}</p>);
      }
    }
  });

  if (listItems.length > 0) {
    elements.push(
      <ul key="ul-end" className="list-disc ml-5 space-y-1 mb-3">
        {listItems.map((item, j) => <li key={j}>{item}</li>)}
      </ul>
    );
  }

  return elements;
}

export default function SpecSection({ sectionKey, content, lastUpdated, phase }) {
  const title = SECTION_LABELS[sectionKey] || sectionKey;
  const [isPulsing, setIsPulsing] = useState(false);
  const prevUpdated = useRef(lastUpdated);
  const isRecent = lastUpdated !== null && (Date.now() - lastUpdated) < 10_000;
  const showProvenance = isRecent && phase !== "preview" && phase !== "initial";

  useEffect(() => {
    if (phase === "preview") return;
    if (lastUpdated !== prevUpdated.current && lastUpdated !== null) {
      setIsPulsing(false);
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

  if (phase === "preview") {
    return (
      <div className="mb-8">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-400 mb-2">
          {title}
        </h3>
        <div className="text-sm text-gray-800 leading-7">
          {renderMarkdown(content)}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`mb-6 rounded-lg px-4 py-3 ${isPulsing ? "spec-pulse" : ""}`}
      onAnimationEnd={handleAnimationEnd}
    >
      <div className="flex items-center gap-2 mb-1">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
          {title}
        </h3>
        {isDraft && (
          <span className="text-xs text-gray-400 italic">(draft)</span>
        )}
        {showProvenance && content !== null && (
          <span className="text-xs text-indigo-400">· Added from your latest response</span>
        )}
      </div>

      {isEmpty ? (
        <p className="text-sm text-gray-400 italic">
          {phase === "initial" || phase === "thinking" ? "pending…" : "pending"}
        </p>
      ) : (
        <p className="text-sm leading-relaxed text-gray-700">{content}</p>
      )}
    </div>
  );
}
