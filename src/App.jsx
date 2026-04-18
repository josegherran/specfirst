import { useState } from "react";
import { streamMessage } from "./lib/claude.js";
import { detectInputRichness, isLoopComplete } from "./lib/specParser.js";
import LeftPanel from "./components/LeftPanel.jsx";
import RightPanel from "./components/RightPanel.jsx";
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
  // displayMessages: plain { role, content: string } — rendered in LeftPanel
  const [displayMessages, setDisplayMessages] = useState([]);
  // apiMessages: full structured history with tool_use/tool_result blocks — sent to API
  const [apiMessages, setApiMessages] = useState([]);
  const [spec, setSpec] = useState(initialSpec);
  const [errorMsg, setErrorMsg] = useState(null);
  const [streamingText, setStreamingText] = useState('');

  function updateSpecSection(section, content) {
    setSpec(prev => ({
      ...prev,
      [section]: { content, lastUpdated: Date.now() },
    }));
  }

  async function handleSubmit(userInput) {
    setErrorMsg(null);
    detectInputRichness(userInput); // used as hint by system prompt via context
    const userMsg = { role: 'user', content: userInput };
    const nextApiMessages = [...apiMessages, userMsg];
    setApiMessages(nextApiMessages);
    setDisplayMessages(prev => [...prev, userMsg]);
    setPhase('thinking');

    let fullText = '';
    let specSnapshot = spec;
    setStreamingText('');

    const { toolCallCount, finalApiMessages } = await streamMessage(
      nextApiMessages,
      (text) => {
        fullText += text;
        setStreamingText(prev => prev + text);
      },
      (section, content) => {
        updateSpecSection(section, content);
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

    // Save full structured history for next API call
    setApiMessages(finalApiMessages);
    // Save plain text for display
    setDisplayMessages(prev => [...prev, { role: 'assistant', content: fullText }]);
    setStreamingText('');

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
        <LeftPanel
          phase={phase}
          messages={displayMessages}
          streamingText={streamingText}
          onSubmit={handleSubmit}
          onPreview={handlePreview}
        />
      </div>
      <div className="w-1/2 overflow-y-auto">
        <RightPanel spec={spec} phase={phase} />
      </div>
    </div>
  );
}

export default App;
