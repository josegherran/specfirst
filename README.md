# SpecFirst

**Turn messy architectural intent into a structured specification — before a single line of code is written.**

SpecFirst is a single-page app for software and solution architects. You describe a system in rough terms; the AI slows you down with the right clarifying questions, and a structured specification builds itself in real time on the right side of the screen.

The demo centerpiece: type a paragraph of rough intent, answer three questions, and walk away holding a concrete spec artifact — Problem Statement, Constraints & Guardrails, System Boundaries, Stakeholders, and Open Questions — derived from your own words.

Live: **[specfirst.vercel.app](https://specfirst.vercel.app)**

---

## How It Works

1. Describe your system — messy is fine
2. The AI paraphrases your intent and asks exactly three clarifying questions, each labeled with its target spec section
3. Answer in any order; each answer fills the corresponding section of the spec panel
4. When the three core sections are complete, the loop exits and you can preview a clean Markdown specification

The AI's job is to ask better questions, not generate faster. Prompt engineering in `lib/prompts.js` is the critical path — weak questions produce weak specs regardless of UI polish.

---

## Stack

| Layer | Choice |
|---|---|
| UI | React 19 + Vite 8 |
| Styling | Tailwind CSS v4 |
| AI | Anthropic Claude (Haiku 4.5) via streaming API |
| Deployment | Vercel (Edge Function proxy for API calls) |

---

## Local Development

**Prerequisites:** Node 20+, an [Anthropic API key](https://console.anthropic.com/settings/keys)

```bash
git clone https://github.com/josegherran/specfirst
cd specfirst
npm install
cp .env.example .env
# Add your key to .env: VITE_ANTHROPIC_API_KEY=sk-ant-...
npm run dev
```

Open `http://localhost:5173`. The Vite dev proxy routes `/api/chat` to the Anthropic API locally.

**Production note:** API calls are routed through `api/chat.js` (a Vercel Edge Function) so the API key is never exposed to the browser in production. Set `VITE_ANTHROPIC_API_KEY` in your Vercel environment variables before deploying.

---

## Project Structure

```
src/
├── components/
│   ├── LeftPanel.jsx         # input → chat history + bottom input
│   ├── RightPanel.jsx        # spec sections → preview Markdown document
│   ├── SpecSection.jsx       # single section: content + pulse + provenance tag
│   └── ThinkingIndicator.jsx # animated "interpreting intent" placeholder
├── lib/
│   ├── claude.js             # raw SSE streaming + tool_use handler
│   ├── prompts.js            # system prompt + UPDATE_SPEC_SECTION_TOOL
│   └── specParser.js         # thin/rich input detection + loop exit check
├── App.jsx                   # root state owner, phase machine
└── index.css
api/
└── chat.js                   # Vercel Edge Function — proxies Anthropic API calls
docs/                         # spec-driven development artifacts
```

---

## Key Technical Decision

Spec sections update *before* confirmation text using Claude's `tool_use` feature — `update_spec_section(section, content)` fires mid-stream, triggering immediate panel updates. Text parsing at the end would have violated the PRD requirement and introduced an entire class of parsing brittleness. The tool call is the mechanism.

---

## Built With

React · Vite · Tailwind CSS · Anthropic Claude · Vercel

---

## License

MIT — see [LICENSE](./LICENSE)
