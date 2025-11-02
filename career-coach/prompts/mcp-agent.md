## MCP Agent Guide (Junior Developer Friendly)

Welcome! This document shows you how we use `@joshuacalpuerto/mcp-agent` ("mcp-agent") inside the Career Coach project (Next.js 15 + Vercel AI SDK). Read top‑down the first time; then keep it as a reference when adding features.

---
### 1. What Is mcp-agent?
`mcp-agent` is a lightweight orchestration layer for Large Language Model (LLM) driven agents that can call tools. Each HTTP request to our API can spin up:
1. One or more Agents (each has an LLM + allowed tool set).
2. Optionally an Orchestrator that plans multi‑step tasks and streams lifecycle events.
3. A Memory object (chat history) so the LLM has prior context.

You only pay the latency cost for what you initialize per request—nothing is globally persistent beyond configured server connections.

---
### 2. Why Do We Use It Here?
Career coaching needs multi‑step workflows:
* Parse CV → Extract skills & preferences.
* Research companies via external APIs.
* Evaluate & rank matches.
* Produce a shortlist explanation.

`mcp-agent` lets us compose specialized agents (e.g., `cv_parser`, `company_researcher`, `evaluator`) and, when needed, orchestrate a plan. For simple replies (like basic chat Q&A) we skip orchestration to save latency.

---
### 3. High-Level Architecture (Per Request)
```
Client UI (Chat) ──▶ /api/chat (route.ts)
	Parse messages
	Build Memory
	Initialize LLM (LLMFireworks)
	Initialize Agents (with tool servers)
	Optional Orchestrator
	Stream workflow events -> UI
```
Tools come from MCP Servers (HTTP/SSE/WebSocket/Stdio) or local function wrappers (future). Server configs declare which tools an agent can call.

---
### 4. Key Concepts (Memorize These)
| Term | Meaning |
|------|---------|
| Agent | LLM + allowed tools + name/description |
| Tool Server | MCP server exposing tool methods |
| Orchestrator | Plans and executes multi‑step objective across agents |
| Memory | Prior messages (SimpleMemory) |
| Workflow Event | Lifecycle progress (start, task start/end, result, error) |

---
### 5. Environment Setup
Add required keys to `.env.local` (never commit them):
```
OPENAI_API_KEY=sk-...
SMITHERY_KEY=...
SMITHERY_PROFILE=...
# Any other API/tool keys
```
Restart `next dev` after adding new env vars.

Quick sanity check inside code (fail fast):
```ts
if (!process.env.OPENAI_API_KEY) throw new Error('Missing OPENAI_API_KEY');
```

---
### 6. LLM Configuration
We use `LLMFireworks` (OpenAI‑compatible). Example:
```ts
const llm = new LLMFireworks('accounts/fireworks/models/deepseek-v3', {
	maxTokens: 2048,
	temperature: 0.2,
	stream: true // only set true when orchestrating streaming output
});
```
Raise `maxTokens` only when needed; low values reduce cost & latency.

---
### 7. Memory Handling
When handling chat requests:
```ts
const raw = await req.json();
const messages = convertToModelMessages(raw.messages).map(m => ({
	role: m.role,
	content: (m.content?.[0] as { text?: string })?.text
}));
const history = SimpleMemory.fromMessages(messages);
```
If no prior context needed: `const history = new SimpleMemory();`

---
### 8. Defining Tool Servers
Each server config declares a connection & protocol:
```ts
const searchServer = {
	name: 'search_web',
	type: 'http',
	url: buildSmitheryUrl()
};

function buildSmitheryUrl() {
	const url = new URL('https://server.smithery.ai/exa/mcp');
	url.searchParams.set('api_key', process.env.SMITHERY_KEY!);
	url.searchParams.set('profile', process.env.SMITHERY_PROFILE!);
	return url.toString();
}
```
Always validate required env vars before building the URL.

Types supported: `stdio | sse | websocket | http`.

---
### 9. Initializing an Agent
```ts
const researcher = await Agent.initialize({
	llm,
	name: 'company_researcher',
	description: 'Find and synthesize company information',
	serverConfigs: [searchServer]
});
```
Use `Promise.all` if creating multiple agents:
```ts
const [researcher, evaluator] = await Promise.all([
	Agent.initialize({ llm, name: 'company_researcher', description: '...', serverConfigs: [searchServer] }),
	Agent.initialize({ llm, name: 'evaluator', description: 'Score company fit', serverConfigs: [] })
]);
```

---
### 10. Orchestrator (Multi-Step Workflow)
```ts
const orchestrator = new Orchestrator({ llm, agents: [researcher, evaluator], history });
```
Generate a workflow:
```ts
orchestrator.generateStr('Produce a ranked shortlist of 5 companies.');
```
Listen for events to stream progress.

---
### 11. Streaming Pattern (ReadableStream)
Simplified outline (see `src/app/api/chat/route.ts` for full version):
```ts
const encoder = new TextEncoder();
const stream = new ReadableStream({
	async start(controller) {
		orchestrator.onWorkflowEvent(e => {
			controller.enqueue(encoder.encode(renderEvent(e) + '\n'));
			if (e.type === WORKFLOW_EVENTS.WORKFLOW_END || e.type === WORKFLOW_EVENTS.WORKFLOW_ERROR) {
				controller.close();
			}
		});
		orchestrator.generateStr(objective);
	}
});
return new Response(stream, { headers: { 'Content-Type': 'text/event-stream; charset=utf-8', 'x-vercel-ai-ui-message-stream': 'v1' }});
```
Each line ends with `\n`. We rely on Vercel AI SDK header to parse incremental messages.

Event formatting helper:
```ts
function renderEvent(event) {
	switch (event.type) {
		case WORKFLOW_EVENTS.WORKFLOW_START: return '**Workflow started**';
		case WORKFLOW_EVENTS.WORKFLOW_TASK_START: return `**${event.task.agent}** working: ${event.task.description}`;
		case WORKFLOW_EVENTS.WORKFLOW_TASK_END: return `**${event.task.agent}** result: ${event.task.result}`;
		case WORKFLOW_EVENTS.WORKFLOW_END: return `\n${event.result.result}`;
		case WORKFLOW_EVENTS.WORKFLOW_ERROR: return `Error: ${event.error}`;
		default: return '...';
	}
}
```

---
### 12. Minimal Single-Agent (No Orchestrator) Example
Use this when you just need a direct answer.
```ts
export async function POST(req: Request) {
	const { messages: _messages } = await req.json();
	const messages = convertToModelMessages(_messages).map(m => ({
		role: m.role,
		content: (m.content?.[0] as { text?: string })?.text
	}));
	const userPrompt = messages.at(-1)?.content || 'Provide guidance.';

	const llm = new LLMFireworks('accounts/fireworks/models/deepseek-v3', { maxTokens: 1024, temperature: 0.3 });
	const agent = await Agent.initialize({ llm, name: 'assistant', description: 'General helpful assistant', serverConfigs: [] });
	const result = await agent.respond(userPrompt);
	return Response.json({ result });
}
```

---
### 13. Adding a New API Route Using mcp-agent (Checklist)
1. Create file under `src/app/api/<feature>/route.ts`.
2. Validate request body (return 400 if malformed).
3. Load env vars; throw early if missing.
4. Configure LLM.
5. Define tool server configs.
6. Initialize agents (parallelize if >1).
7. (Optional) Build Memory from incoming messages.
8. Choose single response vs orchestrator.
9. Implement streaming if orchestration.
10. Close stream on END or ERROR.
11. Never leak secrets or stack traces (log internally instead).
12. Document any intentional deviations at top of file.

---
### 14. Adding a New Agent Role
Decide: What tasks? Which tools? Provide concise description so planner assigns tasks correctly.
```ts
const cvParser = await Agent.initialize({
	llm,
	name: 'cv_parser',
	description: 'Extract skills, experience, and preferences from user CV text',
	serverConfigs: [/* maybe local stdio parser server later */]
});
```
Keep names lowercase with underscores; easier for LLM referencing.

---
### 15. Common Pitfalls (Quick Fixes)
| Symptom | Likely Cause | Fix |
|---------|--------------|-----|
| Stream never ends | Missing close on END/ERROR | Close controller in event handler |
| Empty response | Last message extraction wrong | Use `messages.at(-1)?.content` |
| Tool calls fail | Wrong server name or env missing | Check `serverConfigs` and env presence |
| 500 early | Env not validated | Throw before starting stream |
| Duplicate tasks | Orchestrator prompt unclear | Refine objective wording |

---
### 16. Testing Strategy (Junior Friendly)
1. Unit test event formatting separately (pure function). 
2. Mock `Agent.respond` for single-agent route tests.
3. For streaming: call route handler, then read from `ReadableStream` reader collecting chunks; assert final chunk contains expected summary.
4. Simulate error by forcing an env var missing; assert JSON error response (non‑stream mode) or streamed `WORKFLOW_ERROR` line.

---
### 17. Debugging Tips
* Log event types & task descriptions temporarily (remove noisy logs before merging).
* Check env vars with `console.log(Object.keys(process.env))` locally (never commit logs with secrets).
* If output seems truncated, raise `maxTokens` modestly.
* If orchestration feels off, narrow objective (be explicit about deliverable format).

---
### 18. When to Use Orchestrator vs Single Agent
Use Orchestrator for multi‑step research/evaluation/aggregation. Use single agent for simple guidance or one-off transformations. Start simple; add orchestration later if necessary.

---
### 19. Glossary
| Term | Quick Definition |
|------|------------------|
| Objective | High-level goal passed to `generateStr` |
| Task | Atomic work unit assigned to an agent |
| Step | Grouping of tasks aligned to a sub‑objective |
| Result | Final aggregated orchestrator output |
| Memory | Historical messages shaping LLM context |

---
### 20. FAQ
Q: Do I need to cache agents?  
A: No. Initialize per request; connection manager optimizes reuse internally.

Q: Can agents share memory?  
A: Yes via the orchestrator; pass the same `history` object.

Q: How do I add a new tool?  
A: Create a server config (stdio/script or remote URL), include in `serverConfigs` when initializing the relevant agent.

Q: Response is slow—what do I check first?  
A: Number of agents (parallelize init), `maxTokens`, unnecessary orchestration, external API latency.

Q: Where do I store data from tools?  
A: For now, ephemeral within workflow. Persist later via dedicated storage layer (future enhancement).

---
### 21. Future Enhancements (Ideas)
* Add caching layer for repeated tool queries.
* Rate limiting middleware for abusive requests.
* Structured JSON response format (schema enforcement) for shortlist.
* Token usage logging for cost tracking.
* CV parsing MCP server (PDF → text). 

---
### 22. Quick Copy-Paste Orchestrated Route Skeleton
```ts
import { Agent, LLMFireworks, Orchestrator, SimpleMemory, WORKFLOW_EVENTS } from '@joshuacalpuerto/mcp-agent';
import { convertToModelMessages, ModelMessage } from 'ai';

export async function POST(req: Request) {
	let raw;
	try { raw = await req.json(); } catch { return Response.json({ error: 'Invalid JSON' }, { status: 400 }); }
	if (!raw?.messages) return Response.json({ error: 'Missing messages' }, { status: 400 });

	const messages = convertToModelMessages(raw.messages).map((m: ModelMessage) => ({
		role: m.role,
		content: (m.content?.[0] as { text?: string })?.text
	}));
	const history = SimpleMemory.fromMessages(messages);
	const objective = messages.at(-1)?.content || 'Provide assistance.';

	if (!process.env.OPENAI_API_KEY) return Response.json({ error: 'Server misconfigured' }, { status: 500 });

	const llm = new LLMFireworks('accounts/fireworks/models/deepseek-v3', { maxTokens: 1500, temperature: 0.25, stream: true });

	const searchServer = { name: 'search_web', type: 'http', url: buildSmitheryUrl() };

	const researcher = await Agent.initialize({ llm, name: 'company_researcher', description: 'Research companies', serverConfigs: [searchServer] });

	const orchestrator = new Orchestrator({ llm, agents: [researcher], history });

	function renderEvent(e: any): string {
		switch (e.type) {
			case WORKFLOW_EVENTS.WORKFLOW_START: return '**Workflow started**';
			case WORKFLOW_EVENTS.WORKFLOW_TASK_START: return `**${e.task.agent}** working: ${e.task.description}`;
			case WORKFLOW_EVENTS.WORKFLOW_TASK_END: return `**${e.task.agent}** result: ${e.task.result}`;
			case WORKFLOW_EVENTS.WORKFLOW_END: return `\n${e.result.result}`;
			case WORKFLOW_EVENTS.WORKFLOW_ERROR: return `Error: ${e.error}`;
			default: return '...';
		}
	}

	const encoder = new TextEncoder();
	const stream = new ReadableStream({
		async start(controller) {
			orchestrator.onWorkflowEvent(e => {
				controller.enqueue(encoder.encode(renderEvent(e) + '\n'));
				if (e.type === WORKFLOW_EVENTS.WORKFLOW_END || e.type === WORKFLOW_EVENTS.WORKFLOW_ERROR) controller.close();
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
}

function buildSmitheryUrl() {
	const url = new URL('https://server.smithery.ai/exa/mcp');
	url.searchParams.set('api_key', process.env.SMITHERY_KEY!);
	url.searchParams.set('profile', process.env.SMITHERY_PROFILE!);
	return url.toString();
}
```

---
### 23. Definition of Done (Route Review)
Before merging a new route:
* Validates input & env.
* Clear agent names & descriptions.
* Tool servers defined (if needed).
* Handles END & ERROR events.
* Avoids leaking secrets.
* Provides fallback objective.
* Includes streaming headers (if streaming).

---
### 24. Final Advice
Start with a minimal single-agent implementation, confirm correctness, then layer orchestration only when the problem requires multi-step reasoning. Keep objectives clear and concise—LLMs do better with focused instructions.
