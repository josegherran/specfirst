export default function ThinkingIndicator({ phase }) {
  if (phase !== "thinking") return null;

  return (
    <div className="flex items-center gap-2 py-3 text-sm text-gray-400">
      <span>Interpreting intent and shaping a draft specification</span>
      <span className="flex gap-0.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="inline-block w-1 h-1 rounded-full bg-gray-400"
            style={{ animation: `thinking-dot 1.2s ease-in-out ${i * 0.2}s infinite` }}
          />
        ))}
      </span>
    </div>
  );
}
