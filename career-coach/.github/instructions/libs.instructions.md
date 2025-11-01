---
description: 'Instructions for working with the Libs folder (src/libs/)'
applyTo: '**/src/libs/**.tsx'
---
 
# Libs Guide (src/libs)

Goal: Keep all non-UI logic here—small, typed, testable, reusable—and never mix rendering concerns. Components provide data via props and call libs; libs never import components or emit JSX.

---
## 1. Scope & Placement
Belongs:
- Fetching, parsing, normalization, evaluation, ranking, orchestration.
- Domain errors, pure utilities, rate limiting, caching (light, in-memory), env access.
Does NOT belong:
- JSX, styling, Tailwind classes, DOM manipulation, side effects unrelated to data flow, untyped blobs, hard-coded secrets.
Rationale: Clear separation yields reuse and predictable test coverage.

---
## 2. Core Principles
1. Single responsibility per file (name matches purpose).
2. All inputs/outputs strictly typed (no any; extend `src/types/`).
3. Pure first: keep functions deterministic unless performing controlled IO (fetch/file).
4. Never expose raw external API responses—normalize before return.
5. Centralize env/flags via `config/settings.ts` (one read per module).
6. Errors are structured/tagged (no bare string throws).
7. Keep modules <300 lines; split when growing (e.g. `<domain>-internals.ts`).
8. Reuse helpers—search before adding new logic (avoid duplication).
9. Tests accompany logic (happy + edge) before merge.
10. No silent failure—surface typed error or explicit fallback.
Rationale: Ensures maintainability, scalability, and safety.

---
## 3. Folder Roles
`apis/` External API clients (Crunchbase, Glassdoor, News) → fetch + normalize.
`evaluation/` Company scoring logic (pure deterministic formulas).
`shortlist/` Ranking + output formatting (no UI; structure only).
`preferences/` Collect, normalize, store user job preferences & events.
`parsing/` CV/text parsing → structured types.
`files/` Upload validation, sanitation, lifecycle operations.
`chat/` Conversation orchestration (state transitions, turn handling).
`hooks/` React hooks wrapping libs async flows (data, loading, error, retry).
`config/` Env + feature flags (single access surface).
`utils.ts` Tiny generic helpers ONLY (string trims, guards)—no domain clutter.
Rationale: Predictable placement accelerates discovery and review.

---
## 4. Decision Flow (Before Adding Code)
1. Is logic reused (or likely reused) ≥3 times? If yes → libs; else keep local until reuse threshold.
2. Does it transform, fetch, evaluate, rank, parse, orchestrate? → libs.
3. Does it reference UI state or styling? If yes → move to component/hook.
4. Does it need secrets/env? Access through `settings.ts` only.
5. Are types defined? If missing, add/update under `src/types/` first.
Rationale: Prevents logic creep in components and maintains purity.

---
## 5. Standard Workflows
### A. New API Client
1. Create `src/libs/apis/<service>-client.ts`.
2. Define interface(s) upfront (e.g. `fetchCompanyProfile(id: string): Promise<CompanyData>`).
3. Read API keys/base URLs via `settings.ts` (once).
4. Implement fetch with explicit headers + non-2xx handling (typed error).
5. Normalize raw response → domain type; hide extraneous fields.
6. Add minimal rate limit/backoff (timestamp window or simple queue).
7. Export high-level functions only (no raw fetch leakage).
8. Tests: success normalization + non-2xx error path.
9. Update Maintenance (API section) in this file.

### B. Extend Evaluation Scoring
1. Open `evaluation/company-evaluator.ts`.
2. Add constant for new dimension + weight (document formula inline comment).
3. Implement pure deterministic calculation.
4. Adjust `shortlist/generator.ts` ranking if needed.
5. Tests: min/max boundary + contribution correctness.
6. Maintenance update (Evaluation section).

### C. Add / Change Preference Field
1. Update `preferences/preference-collector.ts` sequence/state.
2. Add constants/events if new category in `preferences/constants.ts` & `events.ts`.
3. Normalize in `preferences/preference-normalizer.ts`.
4. Extend `src/types/user-data.ts`.
5. Tests: valid input, invalid input error, sequence transition.
6. Maintenance update (Preferences section).

### D. New Hook (Async Data)
1. File `hooks/use<Thing>.ts`.
2. Accept single params object (avoid positional args).
3. Manage `{ data, error, loading }` state + `retry()`.
4. Call existing libs function only (no fetch inline).
5. Tests: success, error, retry flow.
6. Maintenance update if new domain exposure.

### E. CV Parsing Enhancement
1. Add function in `parsing/cv-parser.ts`.
2. Isolate regex/pattern; comment rationale & edge cases.
3. Return typed structure (extend `user-data.ts` if needed).
4. Handle missing dates/unusual formatting gracefully.
5. Tests: typical CV + missing sections edge.
6. Maintenance update (Parsing section).
Rationale: Consistent, safe extension.

---
## 6. Types & Contracts
Before implementation, define interfaces in `src/types/` or reuse existing.
Contract bullets:
- Inputs: exhaustive typed shape (no optional unless truly optional).
- Outputs: stable domain type (avoid union explosion; refine with discriminants).
- Errors: tagged types (e.g. `{ type: 'RateLimitError'; message; retryAfter? }`).
- Success criteria: deterministic formatting, normalized fields, weight formulas documented.
Rationale: Contracts reduce ambiguity and ease testing.

---
## 7. Error Handling
Rules:
1. Never throw bare strings or raw external error objects.
2. Wrap external failures into domain error types (NetworkError, RateLimitError, ValidationError, ParseError).
3. Include context: operation, identifiers, attempt count.
4. Provide actionable fields (`retryAfter`, `missingFields`).
5. Fail fast; do not silently swallow or auto-retry infinitely.
Example: `{ type: 'RateLimitError', message, retryAfter: 120 }`.
Rationale: Structured errors enable consistent UI handling.

---
## 8. Edge Cases Checklist
[] Null / empty fields → default or mark unknown.
[] Network timeout → propagate typed error (optional limited retry).
[] Rate limit → throw RateLimitError with `retryAfter`.
[] Malformed user input → normalize or ValidationError.
[] Large dataset → consider chunking; add TODO if deferred.
[] Missing CV sections → partial structure with `undefined` fields typed.
Rationale: Pre-flight mental checklist prevents surprises.

---
## 9. Performance & Security
1. Batch external calls when feasible.
2. Cache idempotent lookups in-memory per evaluation cycle (document TTL).
3. Sanitize uploaded text (strip scripts) before returning/storing.
4. Never log PII outside guarded debug flag.
5. Single env read via `settings.ts` (no scattered `process.env`).
6. Avoid heavy dependencies—seek approval before adding.
Rationale: Efficient & safe logic foundation.

---
## 10. Testing Minimum
Required per module change:
1. Happy path returns correct typed shape.
2. Representative error surfaces correct tagged type.
3. Boundary input (empty list / malformed text) defined fallback or error.
4. Deterministic functions produce stable snapshot.
5. Rate limiting logic: one success + one limit scenario (if applicable).
Rationale: Baseline confidence; expand later as complexity grows.

---
## 11. Definition of Done (DOD)
All must pass before merge:
1. Single clear responsibility.
2. Fully typed inputs/outputs (no any).
3. Structured errors with context.
4. No JSX/UI imports.
5. Env access centralized.
6. Tests (happy + edge) passing.
7. No duplicated logic (searched project).
8. Comment non-trivial formulas/regex.
9. No inline secrets.
10. File size reasonable (<300 lines) or split plan documented.
11. Maintenance section updated here.
12. No stray console logs (unless behind debug flag).
Rationale: Uniform acceptance criteria ensures quality.

---
## 12. Safe Refactors vs Approval Needed
Safe (no approval): extract helper, consolidate fetch logic, add types, refine error taxonomy, improve comments, remove duplication.
Needs approval: new external dependency, persistent storage layer, major folder restructure, complex caching layer, new top-level folder.
Rationale: Guard rails against risky architectural changes.

---
## 13. Maintenance Triggers & Update Steps
Trigger events:
- New API client
- New scoring dimension/weight
- New preference category/event
- New parsing heuristic/regex
- New or changed error taxonomy
- Added caching/backoff logic
- Deprecated module/function
- Any addition, deletion, or rename of a file under `src/libs/` (catalog must reflect exact inventory)
Steps:
1. Identify trigger.
2. Update Catalog (Section 15) to reflect every new/removed/renamed file before merge.
3. Add bullet under relevant maintenance section (API/Evaluation/Preferences/Parsing/Error/Performance) if domain-impacting change.
4. Commit change in same PR.
5. Add TODO for follow-up if tests incomplete.
Rationale: Documentation parity prevents drift.

---
## 14. Self-Check Before Commit
ASK: Is logic reusable & UI-agnostic? Are raw responses hidden? Do tests + types exist? Are errors structured? If any NO → fix first.
Rationale: Quick gate to avoid rework.

---
## 15. Catalog (Keep Updated)
APIs:
- `apis/crunchbase-client.ts` – Company data fetch + normalize.
- `apis/glassdoor-client.ts` – Employer reviews & ratings normalization.
- `apis/news-client.ts` – Company news retrieval + summarization prep.
Chat:
- `chat/conversation-handler.ts` – Turn orchestration logic.
Files:
- `files/cv-uploader.ts` – Upload validation flow.
- `files/file-handler.ts` – File lifecycle helpers.
Preferences:
- `preferences/preference-collector.ts` – Collect sequence.
- `preferences/preference-normalizer.ts` – Data normalization.
- `preferences/preference-store.ts` – In-memory preference store.
- `preferences/analytics.ts` – Preference analytics helpers.
Parsing:
- `parsing/cv-parser.ts` – CV → structured user data.
Evaluation:
- `evaluation/company-evaluator.ts` – Scoring formulas.
Shortlist:
- `shortlist/generator.ts` – Ranking orchestration.
- `shortlist/formatter.ts` – Output shaping.
Hooks:
- `hooks/useApiFetcher.ts` – Generic API fetch hook wrapper.
Config:
- `config/settings.ts` – Env + flags.
Utilities:
- `utils.ts` – Generic helpers.
Rationale: Inventory speeds onboarding & change impact assessment.

---
## 16. Examples
Add scoring dimension:
1. In `company-evaluator.ts` define `const CULTURE_WEIGHT = 0.15` with formula comment.
2. Integrate into total score aggregator.
3. Update tests verifying min/max contribution.
4. Update Maintenance (Evaluation).

New parsing regex:
1. Add pattern + comment rationale.
2. Provide fallback when missing matches.
3. Test typical + edge CV.
4. Maintenance (Parsing) update.
Rationale: Demonstrates safe iterative extension.

---
## 17. Escalation
If instructions conflict or scenario is ambiguous (e.g. multi-service batch fetch strategy), pause and seek clarification before coding.
Rationale: Prevents misaligned architectural decisions.

---
## 18. Forbidden Without Approval
- New storage layer (DB, persistent cache)
- Heavy dependencies or large utility libraries
- Global mutation of env at runtime
- Complex distributed caching strategy
Rationale: Controls risk & scope creep.

---
## 19. Final Reminder
Keep libs lean, typed, tested, and reusable. When in doubt—push logic out of components and into focused modules here. Prefer clarity over cleverness.
Rationale: Sustains long-term velocity and reliability.


