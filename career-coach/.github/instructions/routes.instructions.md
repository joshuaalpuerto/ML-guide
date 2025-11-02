---
description: 'Instructions for building Next.js API routes using mcp-agent for AI orchestration.'
applyTo: '**/src/app/api/**/route.ts'
---

# API Routes Minimal Guide

Purpose: Define only high-level rules for API route files. Full MCP agent orchestration, streaming patterns, agent definitions, and examples have moved to `prompts/mcp-agent.md`. Open that file and read it end-to-end before implementing any complex or streaming route.

---
## 1. Scope
Routes live at `src/app/api/<feature>/route.ts` and must:
- Parse & validate request payload.
- Call business logic housed in `src/libs/**` (do not implement logic inline).
- Optionally delegate to mcp-agent orchestration (see MCP guide for details).
- Return JSON or streaming response (SSE style) as required.

For ALL orchestration specifics (agents, memory, tool servers, event formatting) → READ `prompts/mcp-agent.md`.

---
## 2. Core Rules
1. Validate input early (400 on malformed shape).
2. Validate required env vars (500 if missing; no partial stream).
3. Keep route lean: no scoring, parsing, evaluation logic—import from `libs`.
4. Never leak secrets or stack traces; log internally only.
5. Use `Agent.respond` for simple one-step replies; orchestrator only when multi-step justifies added latency.
6. Close streams on completion or error (follow MCP guide pattern—not duplicated here).
7. Token usage: keep `maxTokens` conservative; raise only for genuine synthesis needs.

---
## 3. What Not To Do Here
- Implement business logic, normalization, parsing, ranking (move to `libs`).
- Hardcode API keys or secrets.
- Add complex formatting helpers (place in `libs/utils`).
- Create agents inline without reading the MCP guide.
- Copy old detailed streaming snippets—always consult `prompts/mcp-agent.md` for the latest.

---
## 4. Required Reading
Before touching a route that uses mcp-agent: open `prompts/mcp-agent.md` and review sections 6–13 (LLM config, memory, tool servers, agent init, orchestrator, streaming). Do not rely on memory—patterns may evolve.

---
## 5. Minimal JSON Route Skeleton
```ts
export async function POST(req: Request) {
  let body;
  try { body = await req.json(); } catch { return Response.json({ error: 'Invalid JSON' }, { status: 400 }); }
  if (!body?.messages) return Response.json({ error: 'Missing messages' }, { status: 400 });
  // Delegate to libs or mcp-agent (see prompts/mcp-agent.md for orchestration details)
  // Example: return Response.json(await simpleHandler(body));
  return Response.json({ ok: true });
}
```

---
## 6. Definition of Done (Minimal)
Must satisfy:
1. Input validated.
2. Env vars checked (if needed).
3. No business logic inline (delegated to libs).
4. References MCP guide for orchestration (no duplicated implementation comments).
5. Proper HTTP status codes.
6. No unused imports.
7. No secret leakage.

---
## 7. Maintenance
- If MCP orchestration pattern changes, update ONLY `prompts/mcp-agent.md` not this file.
- Keep this file minimal—do not reintroduce detailed streaming or agent docs.
- Review new routes for logic creep; refactor into `libs` immediately.

---
## 8. Route Catalog (Must Stay Current)
Update this catalog in the SAME PR whenever you add, rename, move, or remove an API route or related page. Missing updates here block review.

| Path | Type | Purpose |
|------|------|---------|
| `src/app/(chat)/page.tsx` | Page | Renders chat UI; coordinates CV + preference state (presentation only). |
| `src/app/api/chat/route.ts` | API (POST) | Chat endpoint invoking conversation handler; returns assistant responses (may stream). |
| `src/app/api/upload/route.ts` | API (POST) | CV/PDF upload; validates file and passes to parsing logic in `libs/files`. |
| `src/app/api/health/route.ts` | API (GET) | Health/status check (uptime/readiness). No business logic beyond simple report. |
| `src/app/api/cv/parse/` | Directory | Placeholder for future CV parsing endpoints (structured extraction). Add route.ts when implementing. |

Catalog Update Rules:
1. Add a row for every new `route.ts` with concise purpose.
2. If a route changes role materially (e.g., starts streaming), update its description.
3. Remove rows only after the route is deleted from the codebase.
4. Keep purposes short; detailed orchestration lives in `prompts/mcp-agent.md`.
5. For multi-verb routes (e.g., GET + POST in same file) list verbs explicitly.

PR Checklist Addition: "Route Catalog updated" must be ticked before merge.

---
## 9. Final Pointer
Stop here and open: `prompts/mcp-agent.md` for everything about agents, tools, memory, orchestrator, streaming, and advanced patterns.



