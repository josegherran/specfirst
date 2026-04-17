import { useState } from "react";
import { streamMessage } from "./lib/claude.js";
import { detectInputRichness, isLoopComplete } from "./lib/specParser.js";
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
      <div className="w-1/2 border-r border-gray-200 p-8">
        <p className="text-xs text-gray-400 mb-2">phase: {phase}</p>
        {errorMsg && <p className="text-red-500 text-sm mb-2">{errorMsg}</p>}
        <p className="text-sm text-gray-500 mb-4">LeftPanel placeholder</p>
        {phase === 'initial' && (
          <button
            className="px-4 py-2 bg-gray-900 text-white text-sm rounded"
            onClick={() => handleSubmit("I need a payment reconciliation system for KYC-gated EU customers that handles multi-currency transactions and fraud detection.")}
          >
            Test submit (rich input)
          </button>
        )}
        {phase === 'clarifying' && (
          <button
            className="px-4 py-2 bg-gray-900 text-white text-sm rounded mt-2"
            onClick={() => handleSubmit("The main constraint is GDPR compliance and sub-second response times. System boundaries are the payment gateway API and our internal ledger.")}
          >
            Test follow-up answer
          </button>
        )}
        {phase === 'complete' && (
          <button
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded mt-2"
            onClick={handlePreview}
          >
            Preview final specification →
          </button>
        )}
        <div className="mt-4 text-xs text-gray-400">
          <p>messages: {messages.length}</p>
        </div>
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
