import { useState } from "react";
import { streamMessage } from "./lib/claude.js";
import { detectInputRichness, isLoopComplete } from "./lib/specParser.js";
import LeftPanel from "./components/LeftPanel.jsx";
import "./index.css";

const initialSpec = {
  problem:          { content: null, lastUpdated: null },
  constraints:      { content: null, lastUpdated: null },
  systemBoundaries: { content: null, lastUpdated: null },
  stakeholders:     { content: 'Not explored in this session.', lastUpdated: null },
  openQuestions:    { content: null, lastUpdated: null },
};

function App() {
  const [phase, setPhase] = useState('initial');
  const [messages, setMessages] = useState([]);
  const [spec, setSpec] = useState(initialSpec);
  const [errorMsg, setErrorMsg] = useState(null);

  function updateSpecSection(section, content) {
    setSpec(prev => ({
      ...prev,
      [section]: { content, lastUpdated: Date.now() },
    }));
  }

  async function handleSubmit(userInput) {
    setErrorMsg(null);
    const richness = detectInputRichness(userInput);
    const userMsg = { role: 'user', content: userInput };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setPhase('thinking');

    let fullText = '';
    let specSnapshot = spec;

    const { toolCallCount } = await streamMessage(
      nextMessages,
      (text) => { fullText += text; },
      (section, content) => {
        updateSpecSection(section, content);
        // capture latest spec for loop check after stream closes
        specSnapshot = {
          ...specSnapshot,
          [section]: { content, lastUpdated: Date.now() },
        };
      },
      (msg) => {
        setErrorMsg(msg);
        setPhase('clarifying');
      }
    );

    const assistantMsg = { role: 'assistant', content: fullText };
    setMessages(prev => [...prev, assistantMsg]);

    if (isLoopComplete(specSnapshot)) {
      setPhase('complete');
    } else {
      setPhase('clarifying');
    }
  }

  function handlePreview() {
    setPhase('preview');
  }

  return (
    <div className="flex h-screen bg-white text-gray-900">
      <div className="w-1/2 border-r border-gray-200 overflow-y-auto">
        {errorMsg && (
          <p className="text-red-500 text-sm px-10 pt-4">{errorMsg}</p>
        )}
        <LeftPanel phase={phase} onSubmit={handleSubmit} />
      </div>
      <div className="w-1/2 p-8 text-gray-400">
        <p className="text-xs mb-4">phase: {phase}</p>
        <p className="text-sm mb-4">Specification (draft) / Waiting for input…</p>
        {Object.entries(spec).map(([key, val]) => (
          val.content && (
            <div key={key} className="mb-3">
              <p className="text-xs font-semibold text-gray-500 uppercase">{key}</p>
              <p className="text-sm text-gray-800">{val.content}</p>
            </div>
          )
        ))}
      </div>
    </div>
  );
}

export default App;
