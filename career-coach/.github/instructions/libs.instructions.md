---
description: 'Instructions for working with the Libs folder (src/libs/)'
applyTo: '**/src/libs/**.tsx'
---
 
# Libs Folder

Purpose: `src/libs/` holds ALL non-UI logic (fetch, parse, normalize, evaluate, rank, orchestrate). Nothing here renders JSX. Components call libs; libs stay small, typed, testable.

## 1. Folder Roles (Know Where To Put Code)
apis/  external API clients (Crunchbase, Glassdoor, News) → fetch + normalize
evaluation/  scoring logic (company metrics)
shortlist/  ranking + formatting output
preferences/  collect, normalize, store user job preferences
parsing/  turn raw CV text/files into structured data
files/  upload validation + sanitation + lifecycle
chat/  conversation orchestration (state, turns)
hooks/  React wrappers exposing libs async logic (data, error, loading, retry)
config/  env + feature flags via a single access point
utils.ts  tiny generic helpers only

## 2. What Belongs / What Doesn’t
DO: pure functions, controlled side effects (fetch, file IO), orchestrators, normalizers, domain errors.
DO NOT: JSX, styling, direct DOM, hard-coded secrets, giant misc utility dumps.

## 3. Decision Quick Flow
Is logic reusable across components? YES → libs. NO → keep local until reused ≥3 times.
Does it transform or evaluate data? → libs.
Uses UI state or rendering? → component.
Touches secret/env? Access through `config/settings.ts` only.

## 4. Before You Add Anything (5 Checks)
1 Define domain: fetch | transform | evaluate | orchestrate.
2 Choose correct folder (do NOT invent new top-level folders without approval).
3 Specify input/output types (reuse or add under `src/types/`).
4 List error modes (network, missing fields, invalid format, rate limit).
5 Write minimal tests (happy + one edge case) FIRST or alongside.

## 5. Standard Workflows (Follow Steps Exactly)
### A. New API Client
1 File: `src/libs/apis/<service>-client.ts`.
2 Interface first (e.g. `fetchCompanyProfile(id: string): Promise<CompanyData>`).
3 Read keys/base URL via `config/settings.ts` once.
4 Implement fetch: explicit headers, handle non-2xx (throw typed error).
5 Normalize response → `CompanyData` (extend types if needed).
6 Add simple rate limit/backoff (timestamp window or queue).
7 Export only needed high-level functions (no raw fetch leakage).
8 Tests: success normalized shape + non-2xx error path.
9 Update this file (Maintenance section).

### B. Extend Evaluation Scoring
1 Open `evaluation/company-evaluator.ts`.
2 Add constant for new dimension + weight.
3 Implement pure deterministic calculation (document formula inline comment).
4 Update shortlist ranking logic if needed (`shortlist/generator.ts`).
5 Tests: min/max boundary, contribution correctness.
6 Update Maintenance section with new dimension + formula.

### C. Add / Change Preference Field
1 Update `preferences/preference-collector.ts` (sequence/state).
2 Add constants/events if new category.
3 Normalize in `preferences/preference-normalizer.ts`.
4 Extend types (`user-data.ts`).
5 Tests: valid input, invalid input error, sequence transition.
6 Document change (Maintenance update).

### D. New Hook (Async Data)
1 File `hooks/use<Thing>.ts`.
2 Accept single params object.
3 Internals: `useState({data,error,loading})` + `useEffect` trigger.
4 Call existing libs function (no fetch inline).
5 Provide `retry()`.
6 Tests: success state, error state, retry flow.

### E. CV Parsing Enhancement
1 Add function in `parsing/cv-parser.ts`.
2 Isolate regex/pattern; comment rationale.
3 Return typed structure (extend `user-data.ts` if needed).
4 Handle edge cases: missing dates, unusual formatting.
5 Tests: typical CV, missing sections edge.
6 Maintenance update (summarize pattern).

## 6. Error Handling (Never Throw Bare Strings)
Use tagged objects or classes: `{ type: 'RateLimitError', message, retryAfter? }`.
Include context: operation, identifiers.
Wrap external errors; surface domain-specific types.
Fail fast; do not silently swallow.

## 7. Edge Case Checklist (Run Through Mentally)
[] Null/empty fields → default or mark unknown.
[] Network timeout → retry or escalate error.
[] Rate limit → throw RateLimitError with `retryAfter`.
[] Malformed user input → normalize or throw ValidationError.
[] Large dataset → consider chunking (note TODO if future work).

## 8. Performance & Security Quick Rules
Batch external calls where possible.
Cache repeated idempotent lookups in-memory per evaluation cycle.
Sanitize user-uploaded text (strip scripts) before storing/returning.
Never log PII unless behind a debug flag (and note TODO to remove).
Access env once via `settings.ts` (no scattered `process.env`).

## 9. Testing Minimum (Per New / Changed Module)
1 Happy path returns correct typed shape.
2 One representative error path surfaces correct error type.
3 Boundary input (empty list / malformed text) → defined fallback or error.
4 Pure deterministic functions produce stable snapshot.

## 10. Definition of Done Checklist
[] Single clear responsibility (filename matches purpose)
[] All inputs/outputs typed (no `any`)
[] Errors typed & contextual
[] No UI imports / no JSX
[] Env access centralized
[] Tests (happy + edge) passing
[] No duplicated logic (searched)
[] Non-trivial logic commented (formula/regex) 
[] No secrets inline
[] Reasonable file size (<300 lines) or split plan added

## 11. Safe Refactors vs Approval Needed
Safe: extract helper, consolidate fetch logic, add types, refine error taxonomy.
Needs approval: new external dependency, persistent storage layer, major folder restructure, complex caching layer.

## 12. Maintenance Update Triggers (Update This File Same PR)
Trigger Events:
- New API client
- New scoring dimension/weight
- New preference category/event
- New parsing heuristic/regex
- New error type taxonomy change
- Added caching/backoff logic
- Deprecated module/function

Update Steps:
1 Identify trigger.
2 Add brief bullet under relevant section (API/Evaluation/Preferences/Parsing/Error/Performance).
3 Commit with same PR.
4 If large change, add TODO for follow-up tests or refactor.

## 13. Quick Self-Check Before Commit
ASK: Is logic reusable & UI-agnostic? Are raw external responses hidden? Do tests + types exist? If any NO → fix first.

Keep it lean. Ship small, typed, tested pieces.

