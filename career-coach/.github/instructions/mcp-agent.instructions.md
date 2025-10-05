---
description: 'Instructions for building Next.js API routes using mcp-agent for AI orchestration.'
applyTo: '**/src/app/api/**/route.ts'
---

# MCP Agent + Next.js API Route Implementation Guide

These instructions teach an AI (and humans) how to author **Next.js App Router API endpoints** under `src/app/api/**/route.ts` that leverage `@joshuacalpuerto/mcp-agent` ("mcp-agent") for tool‑augmented, multi‑agent, or orchestrated AI workflows.

The canonical reference example in this repo is `src/app/api/chat/route.ts`. Use it as a template for streaming orchestration output.

---
## 1. Core Concepts (Quick Mental Model)

1. mcp-agent wraps three layers:
	 - MCP Server Connections (via `ServerConfig`) managed globally (connection reuse).
	 - Per-Agent Aggregator (only exposes allowed tools to that agent).
	 - Orchestrator (optional) that plans multi‑step tasks and emits lifecycle events.
2. Each API request can:
	 - Instantiate one or more `Agent`s (fastest if tools are reused via server configs).
	 - Optionally create an `Orchestrator` to split an objective into tasks.
	 - Stream lifecycle events (Server‑Sent Events style) back to the client.
3. Memory: Use `SimpleMemory.fromMessages(...)` when you have prior chat history; otherwise start blank.
4. Tools: Provided via MCP servers (`stdio`, `sse`, `websocket`, `streamable-http`) or local function tools.

---
## 2. Required Imports

Always import only what you use. Typical streaming orchestration route:

```ts
import { Agent, LLMFireworks, Orchestrator, SimpleMemory, WORKFLOW_EVENTS, WorkflowLifecycleEvent } from '@joshuacalpuerto/mcp-agent';
import { convertToModelMessages, ModelMessage } from 'ai'; // Vercel AI SDK
```

If you only need a single agent response (no orchestration):
```ts
import { Agent, LLMFireworks } from '@joshuacalpuerto/mcp-agent';
```

---
## 3. Environment & Configuration

Set any required keys in `.env.local` (Next.js) or environment (Vercel dashboard):

| Variable | Purpose |
|----------|---------|
| `OPENAI_API_KEY` or provider equivalent | Needed by `LLMFireworks` (uses OpenAI‑compatible interface) |
| `SMITHERY_KEY` / `SMITHERY_PROFILE` | Example remote MCP server (search) credentials used in sample route |
| Tool specific keys (e.g., `EXA_API_KEY`) | Passed via server URL query params or server env |

Never hardcode secrets; always use `process.env.*`.

---
## 4. Choosing LLM Implementation

Currently `LLMFireworks` is provided and expects an OpenAI‑compatible model name, e.g.:
```ts
const llm = new LLMFireworks('accounts/fireworks/models/deepseek-v3', {
	maxTokens: 2048,
	temperature: 0.2,
	stream: true // set to true when you want downstream streaming
});
```

Key options (partial):
* `temperature`: creativity vs determinism.
* `maxTokens`: upper bound on generation.
* `stream`: if true, model streaming is internally consumed; orchestrator events are what you stream out.

---
## 5. Defining MCP Server Tools (ServerConfig)

`serverConfigs` passed to `Agent.initialize` specify which tools that agent can call.

Supported types (as implemented in mcp-agent):
* `stdio`: `{ name, type: 'stdio', command, args? }`
* `sse`: `{ name, type: 'sse', url }`
* `websocket`: `{ name, type: 'websocket', url }`
* `http` (aka streamable-http in implementation): `{ name, type: 'http', url }`

Example referencing a hosted MCP tool aggregator (Smithery + Exa search):
```ts
const searchServer = {
	name: 'search_web',
	type: 'http',
	url: buildSmitheryUrl() // function that injects api_key/profile
};
```

For local stdio server (if you add one to repo):
```ts
const fsServer = {
	name: 'read_local_fs',
	type: 'stdio',
	command: 'node',
	args: ['demo/servers/readLocalFileSystem.js']
};
```

---
## 6. Creating an Agent

Use `Agent.initialize` (async) rather than `new Agent` directly so tool connections are resolved.

```ts
const researcher = await Agent.initialize({
	llm,
	name: 'researcher',
	description: 'Find and synthesize information',
	serverConfigs: [searchServer]
});
```

If you need multiple agents, initialize them in parallel with `Promise.all` for latency savings.

---
## 7. Memory Handling

When receiving prior messages from the client UI (Vercel AI SDK style):
```ts
const raw = await req.json();
const messages = convertToModelMessages(raw.messages).map((m: ModelMessage) => ({
	role: m.role,
	content: (m.content?.[0] as { text?: string })?.text
}));
const history = SimpleMemory.fromMessages(messages);
```

If no history is needed: `const history = new SimpleMemory();`

---
## 8. Orchestrator Usage (Multi-Step Planning)

Instantiate with agents + optional existing history:
```ts
const orchestrator = new Orchestrator({
	llm,
	agents: [researcher],
	history
});
```

Generate plan & execute as a single high‑level objective:
```ts
orchestrator.generateStr(objectiveString);
```

Listen to lifecycle events to stream progress:
```ts
orchestrator.onWorkflowEvent((event) => { /* format & stream */ });
```

Important event types (enum `WORKFLOW_EVENTS`):
* `WORKFLOW_START`
* `WORKFLOW_STEP_START` / `WORKFLOW_STEP_END`
* `WORKFLOW_TASK_START` / `WORKFLOW_TASK_END`
* `WORKFLOW_END` (contains final aggregated result)
* `WORKFLOW_ERROR`

---
## 9. Streaming Response Pattern (SSE Style)

Use a `ReadableStream` and enqueue formatted lines. Minimal pattern:
```ts
const encoder = new TextEncoder();
const stream = new ReadableStream({
	async start(controller) {
		const format = (e: WorkflowLifecycleEvent) => encoder.encode(renderEvent(e) + '\n');
		orchestrator.onWorkflowEvent((e) => {
			controller.enqueue(format(e));
			if (e.type === WORKFLOW_EVENTS.WORKFLOW_END || e.type === WORKFLOW_EVENTS.WORKFLOW_ERROR) {
				controller.close();
			}
		});
		orchestrator.generateStr(objective);
	}
});

return new Response(stream, {
	headers: {
		'Content-Type': 'text/event-stream; charset=utf-8',
		'Cache-Control': 'no-cache, no-transform',
		'Connection': 'keep-alive',
		'x-vercel-ai-ui-message-stream': 'v1'
	}
});
```

Ensure each message ends with a newline so the client UI can parse incremental updates. If adopting strict SSE framing, prefix with `data: ` and add blank line; current example just sends plain lines (works with Vercel AI UI helper header signaling a stream).

---
## 10. Minimal Single-Agent (No Orchestrator) Example

When you simply want the agent to respond without planning:
```ts
export async function POST(req: Request) {
	const { messages: _messages } = await req.json();
	const messages = convertToModelMessages(_messages).map((m: ModelMessage) => ({
		role: m.role,
		content: (m.content?.[0] as { text?: string })?.text
	}));
	const userPrompt = messages[messages.length - 1]?.content || 'Provide guidance.';

	const llm = new LLMFireworks('accounts/fireworks/models/deepseek-v3', { maxTokens: 1024, temperature: 0.3 });
	const agent = await Agent.initialize({
		llm,
		name: 'assistant',
		description: 'General helpful assistant',
		serverConfigs: [] // add tools if needed
	});

	const result = await agent.respond(userPrompt);
	return Response.json({ result });
}
```

---
## 11. Advanced Orchestrated Example (Pattern From `chat/route.ts`)

Key differences vs minimal:
* Builds memory from incoming messages.
* Streams structured workflow progress.
* Attaches external search tool server.
* Formats events into markdown‑friendly lines.

Follow `src/app/api/chat/route.ts` for full reference; adapt agent name, description, and tool servers to your use case (e.g., CV parsing, company evaluation).

---
## 12. Utility: Building External MCP URLs

Encapsulate URL construction so secrets only live in env:
```ts
function buildSmitheryUrl() {
	const url = new URL('https://server.smithery.ai/exa/mcp');
	url.searchParams.set('api_key', process.env.SMITHERY_KEY!);
	url.searchParams.set('profile', process.env.SMITHERY_PROFILE!);
	return url.toString();
}
```
Validate presence of required env vars; if missing, throw a 500 early with a clear message.

---
## 13. Error Handling

Recommendations:
1. Wrap agent/orchestrator logic in try/catch; on error stream a `WORKFLOW_ERROR` event (or return JSON with `{ error }`).
2. For streaming route: if initialization fails before the stream starts, return a JSON error response instead of a half‑open stream.
3. Validate `req.json()` shape (must contain `messages` for chat pattern); return 400 if invalid.
4. Never leak stack traces to client in production; log server side via `Logger`.

---
## 14. Performance Considerations

* Parallelize agent initialization: `const [a,b] = await Promise.all([...])`.
* Reuse LLM configuration objects if stateless; DO NOT cache `Agent` instances across requests unless you intentionally share memory.
* Limit `maxTokens` and raise only when required.
* For heavy external tools, consider caching tool results at the application layer keyed by (toolName + args hash).

---
## 15. Security & Safety

* Sanitize user input passed to tools (avoid arbitrary filesystem or shell when using stdio servers).
* For file system tools: whitelist directories; never allow relative path traversal.
* Rate limit endpoints (implement middleware if necessary) to prevent tool abuse.
* Enforce size limits on request body.

---
## 16. Testing Strategy

1. Unit test prompt generation & event formatting functions separately.
2. Mock `Agent.respond` or orchestrator plan generation to isolate API contract tests.
3. For integration, call route handler with a synthetic Request object and assert streamed chunks (capture via reader). Use node test runner or Jest environment supporting `ReadableStream`.

---
## 17. Common Pitfalls

| Issue | Cause | Fix |
|-------|-------|-----|
| Stream never closes | Not handling `WORKFLOW_END` / `WORKFLOW_ERROR` | Ensure controller.close() after terminal events |
| Empty output | Wrong extraction of last user message | Verify `messages[messages.length - 1]` logic |
| Tool not found | Misnamed `serverConfigs.name` vs referenced tool name | Match names exactly; log available tools |
| 500 early | Missing env vars | Validate before constructing server URLs |
| Duplicate connections | Re-initializing same stdio server per agent without reuse | Let connection manager handle; avoid manual persistent caching |

---
## 18. Step-by-Step Template (Copy & Adapt)

1. Parse request JSON, extract messages.
2. Build memory via `SimpleMemory.fromMessages`.
3. Create / configure LLM (`LLMFireworks`).
4. Define all needed server configs.
5. Initialize one or more agents with `Agent.initialize`.
6. (Optional) Create orchestrator with agents + memory.
7. Create `ReadableStream`.
8. Register event handler translating events -> lines.
9. Kick off `orchestrator.generateStr(objective)` (or `agent.respond`).
10. Return streaming `Response` with correct headers.

---
## 19. Extending For Career Coach Domain

Potential specialized agents:
* `cv_parser` (tools: local PDF parser MCP server or function tools).
* `company_researcher` (tools: Crunchbase / News MCP servers).
* `evaluator` (tools: scoring functions as local function tools).
* `shortlist_builder` (no external tools; combines prior results).

Plan: Orchestrator objective = "Generate a ranked shortlist of 5 companies aligned with user preferences." Steps automatically decomposed; each task assigned to the appropriate agent (ensure agent names are referenced consistently in orchestrator prompts if custom logic added).

---
## 20. Logging & Observability

* Use `Logger` from mcp-agent for structured colored logs (dev local only).
* Wrap critical sections with timing (Date.now) to measure planning vs execution time.
* Optionally add LangSmith tracing if environment variables are present (LLM wrapper already integrates when `LANGSMITH_TRACING` is truthy).

---
## 21. Definition of Done (Checklist for Each New API Route)

Ensure ALL items are satisfied:
1. Exports the HTTP verb function (`POST`, `GET`, etc.).
2. Validates request payload; returns 400 on malformed input.
3. Uses environment variables securely.
4. Initializes agents with explicit `name` + `description`.
5. Defines and uses at least one tool server if required by feature.
6. Closes stream on workflow completion or error.
7. Does not leak secrets or stack traces in response.
8. Handles empty user prompt gracefully (fallback objective).
9. Includes headers for streaming when streaming is used.
10. Logs or surfaces final result for debugging (server side only).

If any item is intentionally skipped, document reason in a comment at top of route file.

---
## 22. Example Event Formatting Function

```ts
function renderEvent(event: WorkflowLifecycleEvent): string {
	switch (event.type) {
		case WORKFLOW_EVENTS.WORKFLOW_START: return '**Workflow started**';
		case WORKFLOW_EVENTS.WORKFLOW_STEP_START: return `**Objective**: ${event.step.objective}`;
		case WORKFLOW_EVENTS.WORKFLOW_TASK_START: return `**${event.task.agent}** working on **${event.task.description}**`;
		case WORKFLOW_EVENTS.WORKFLOW_TASK_END: return `**${event.task.agent}** result: ${event.task.result}`;
		case WORKFLOW_EVENTS.WORKFLOW_STEP_END: return `**Finished objective**: ${event.step.objective}`;
		case WORKFLOW_EVENTS.WORKFLOW_END: return `\n${event.result.result}`;
		case WORKFLOW_EVENTS.WORKFLOW_ERROR: return `Error: ${event.error}`;
		default: return 'Unknown event';
	}
}
```

---
## 23. When NOT to Use Orchestrator

Use direct `agent.respond` when:
* Only one tool invocation or simple completion.
* Latency must be minimal.
* No decomposition / planning required.

Use Orchestrator when:
* You need multi-step research, evaluation, synthesis.
* Multiple agents with distinct roles.
* You want progressive streaming of intermediate reasoning to UI.

---
## 24. Future Enhancements (Optional Hooks)

These are placeholders you can implement later:
* Add a caching layer for identical tool calls.
* Add rate limiting middleware.
* Add schema-based response format enforcement (pass `responseFormat` in LLM config).
* Add metrics (count tasks, average task latency, token usage).

---
## 25. Summary

To build a Next.js API route using mcp-agent: configure LLM, initialize agents with appropriate MCP tool access, optionally orchestrate multi-step objectives, and stream lifecycle events back in a user-friendly format while ensuring robust error handling and security best practices.

Proceed by copying the template in Section 18 and adjusting agents & tools to match the career coaching feature you are implementing.

