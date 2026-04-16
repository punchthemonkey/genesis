```
README.md
```

```markdown
# Genesis

**A sovereign, multi‑agent AI runtime that lives in your browser.**

Genesis is a Progressive Web App that combines local on‑device LLM inference, a modular skill ecosystem, and encrypted cloud sync—all while keeping your data private and under your control. It works offline, respects your battery, and never phones home without permission.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue)](https://www.typescriptlang.org/)
[![Preact](https://img.shields.io/badge/Preact-10.24-purple)](https://preactjs.com/)

---

## Quick Start (5 Minutes)

```bash
git clone https://github.com/your-org/genesis.git
cd genesis
npm install
npm run dev
```

Open http://localhost:5173 in Safari (iOS 26+) or Chrome with WebGPU enabled.
Follow the on‑screen prompts to create a master password and load the local LLM. Then start chatting—everything stays on your device.

---

What Problem This Solves

Existing AI assistants (ChatGPT, Claude, Gemini) send every conversation to the cloud, compromising privacy and requiring constant connectivity. Genesis flips the model:

· Privacy‑first: All data stays on your device unless you explicitly enable encrypted sync.
· Offline‑capable: Core inference, conversation history, and tools work without internet.
· Extensible: Install community skills or create your own without modifying core code.
· Self‑improving: Genesis learns from its mistakes and can propose skill improvements (with your review).

---

Core Features

Feature Description
Local Inference Runs a quantized LLM directly in your browser via WebGPU. No cloud required.
Hybrid Routing Optionally delegate complex tasks to cloud models (OpenAI, Anthropic) with cost estimates.
Multi‑Agent Swarm A Conductor agent coordinates specialists (WebNavigator, DataAnalyst, CodeGenerator).
Secure Vault API keys and secrets are encrypted with AES‑GCM, unlocked by your master password.
Skill Marketplace Install skills (JSON‑defined prompts + tool permissions) from a community registry.
Tool Ecosystem Built‑in tools (calculator, web fetch) plus dynamic discovery via MCP.
Memory Fabric Semantic search over your conversations and documents—all stored locally.
Cross‑Device Sync Optional encrypted sync via Turso (libSQL) keeps your devices in harmony.
Self‑Evolution Analyzes struggle logs and proposes improvements to skills via GitHub PRs.

---

Installation

Prerequisites

· Node.js 20+
· npm 10+
· A browser with WebGPU support:
  · Safari on iOS 26+ / macOS 15+
  · Chrome 113+ with #enable-webgpu-developer-features flag

Setup

```bash
npm install
npm run build
npm run preview   # Serves the production build locally
```

To deploy to production, see the Deployment section.

---

Usage

Basic Example

Once the app is running and the model is loaded, type a message and press Send. The assistant responds with streaming text.

```typescript
// Example of using the core use case programmatically
import { container } from './infrastructure/di/container';
import { RunAgentTurnUseCase } from './application/usecases/RunAgentTurnUseCase';

const useCase = container.resolve(RunAgentTurnUseCase);
const result = await useCase.execute({ userMessage: 'What is 15% of 85?' });
if (result.ok) {
  console.log(result.value.turn.assistantResponse); // "12.75"
}
```

Common Patterns

1. Installing a Skill

1. Open the skill installer (Settings → Skills).
2. Paste a skill JSON manifest:

```json
{
  "name": "Code Reviewer",
  "description": "Reviews code for best practices.",
  "systemPrompt": "You are a senior code reviewer...",
  "allowedTools": [],
  "version": "1.0.0"
}
```

1. Click Install. The skill appears in the chat dropdown.

2. Using Tools

Ask the assistant to calculate something or fetch a webpage. The ReAct loop automatically uses the calculator or fetch tool.

```
User: "What's the square root of 144?"
Genesis: [Calls calculator tool] → "The square root of 144 is 12."
```

3. Offline Mode

Turn off your network. Genesis continues to work—conversations are saved locally and the LLM runs entirely on‑device.

4. Encrypted Sync

1. Create a free Turso database at turso.tech.
2. In Settings → Sync, enter your database URL and token.
3. Conversations and memories sync across devices, encrypted with your master password.

5. Self‑Improvement (Opt‑in)

Enable in Settings → Self‑Improvement. When Genesis repeatedly struggles, it will propose a skill improvement. You can review and approve the change, which opens a GitHub PR.

---

Architecture Overview

Genesis follows Hexagonal Architecture (Ports & Adapters). The core domain (domain/) contains business logic and interfaces. Infrastructure (infrastructure/) provides concrete implementations (WebLLM, IndexedDB, WebCrypto). The UI (ui/) is built with Preact and consumes use cases from the application layer.

All dependencies point inward. The domain never imports from infrastructure. See ARCHITECTURE.md for a deep dive.

---

API Reference

The public API surface is the set of application use cases. Key interfaces:

Use Case Purpose
RunAgentTurnUseCase Process a user message and return the assistant's response.
InstallSkillUseCase Validate and persist a skill manifest.
SelfImproveUseCase Analyze struggles and propose improvements.

For detailed method signatures and error codes, see API.md.

---

Configuration

Genesis uses environment variables for build‑time configuration (via Vite). Create a .env.local file:

```bash
VITE_DEFAULT_MODEL=SmolLM2-135M-Instruct-q4f16_1-MLC
```

Important: Never prefix secrets with VITE_; they would be exposed in the bundle. User secrets (API keys, Turso token) are stored encrypted in the vault.

Feature flags are managed in src/infrastructure/di/container.ts.

---

Development

Local Development

```bash
npm run dev          # Start Vite dev server with HMR
npm run test         # Run unit & integration tests (Vitest)
npm run test:e2e     # Run Playwright E2E tests (iOS viewport)
npm run lint         # ESLint with layer import rules
npm run type-check   # Verify TypeScript
```

Testing

· Unit tests: *.spec.ts alongside source files, 100% coverage on domain.
· Integration tests: application/usecases/*.spec.ts mocks ports.
· E2E tests: e2e/ directory, covers critical user journeys.

Run coverage report:

```bash
npm run coverage
```

Contributing

We welcome contributions! Please see DEVELOPMENT.md for the full guide. In short:

1. Fork and clone the repo.
2. Create a feature branch.
3. Write tests, ensure coverage does not drop.
4. Submit a PR with a clear description.

All code must adhere to the GOAT Standard (see docs/GOAT.md).

---

Deployment

Genesis is a static PWA. Deploy the dist/ folder to any static host that supports custom headers for COOP/COEP.

Example: Cloudflare Pages

```bash
npm run build
npx wrangler pages deploy dist --project-name genesis
```

Ensure the following headers are set (Cloudflare Pages does this automatically if you add a _headers file):

```
/*
  Cross-Origin-Embedder-Policy: require-corp
  Cross-Origin-Opener-Policy: same-origin
```

Example: Vercel

Add vercel.json:

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "Cross-Origin-Embedder-Policy", "value": "require-corp" },
        { "key": "Cross-Origin-Opener-Policy", "value": "same-origin" }
      ]
    }
  ]
}
```

---

Monitoring & Observability

Genesis emits a rich stream of events via the EventBus. Enable the debug overlay by adding ?debug to the URL.

In production, opt‑in error reporting can be enabled via Sentry (set VITE_SENTRY_DSN).

Key metrics to monitor:

· First Token Latency (p99): <500ms
· Model Load Time: <30s on first download, <5s on cache hit
· IndexedDB Quota Usage: warn at 80%

---

Troubleshooting

Symptom Cause Solution
"WebGPU not available" Browser doesn't support WebGPU Use Safari on iOS 26+ or enable flags in Chrome.
Model download fails Network interrupted or quota exceeded Clear site data, ensure Wi‑Fi, retry.
IndexedDB quota exceeded Too many conversations Settings → Storage → Clear Old Conversations.
COOP/COEP headers missing Hosting configuration Verify headers (see Deployment).
Service worker not updating iOS caches aggressively In Safari: Settings → Safari → Advanced → Website Data → Remove Genesis.

For more, see OPERATIONS.md.

---

License & Legal

Genesis is open‑source under the MIT License. See LICENSE for details.

The project uses third‑party libraries under their respective licenses. Model weights are subject to the terms of the model provider (e.g., SmolLM2).

```
```
