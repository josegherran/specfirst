import SpecSection from "./SpecSection.jsx";

const SECTION_ORDER = [
  "problem",
  "constraints",
  "systemBoundaries",
  "stakeholders",
  "openQuestions",
];

export default function RightPanel({ spec, phase }) {
  const isPreview = phase === "preview";
  const isIdle = phase === "initial";
  const isThinking = phase === "thinking";

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className={`px-8 pt-8 pb-4 border-b border-gray-100 transition-opacity duration-300 ${isIdle ? "opacity-100" : "opacity-0 h-0 overflow-hidden pb-0 border-0"}`}>
        <p className="text-sm text-gray-400">Specification (draft) / Waiting for input…</p>
      </div>

      {/* Preview title */}
      {isPreview && (
        <div className="px-8 pt-8 pb-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">Specification</h2>
          <p className="text-xs text-gray-400 mt-0.5">First-pass specification</p>
        </div>
      )}

      {/* Section headers fade in during thinking */}
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
