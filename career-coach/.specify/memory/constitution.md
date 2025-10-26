<!--
Sync Impact Report
Version change: 1.0.0 → 1.0.1 (PATCH: path corrections)
Modified principles:
	- I. Modular Business Logic & Test Discipline (path corrections, clarified libs vs lib)
	- II. External API Resilience & Rate Limiting (no semantic change)
Added sections: None (existing retained)
Removed sections: None
Templates requiring updates:
	- plan-template.md ✅ (Principle list updated order I–V)
	- spec-template.md ⚠ (Recommend adding explicit Privacy & Transparency acceptance scenarios)
	- tasks-template.md ✅ (Can tag tasks with P-Privacy, P-Transparency, etc.)
Deferred TODOs: None
-->

# Career Coach Project Constitution

## Core Principles

### I. Modular Business Logic & Test Discipline
Business logic MUST reside in `src/libs/**` (apis, evaluation, parsing, preferences, shortlist) and MUST NOT leak into `src/app/**` or component files. API client integrations belong in `src/libs/apis/` folder and route handlers live as thin request/response wrappers under `src/app/api/**/route.ts` following NextJS app router. The separate `src/lib/` directory (currently sparse) SHOULD remain thin or be consolidated—avoid duplicating logic across `lib` and `libs`. UI components (`src/components/**`) MUST remain presentation‑only, invoking typed functions from libs. Critical logic (parsing, evaluation scoring, shortlist generation) MUST have unit tests before implementation (Red‑Green‑Refactor). Cross‑module contracts (e.g., company score object) MUST be defined in `src/types/` and referenced consistently. New logic without tests is prohibited; refactors MUST keep or raise coverage. Minimum coverage: 80% lines for evaluation & parsing libraries; 70% overall.
Rationale: Clear separation accelerates safe iteration and prevents UI-driven logic sprawl.

### II. External API Resilience & Rate Limiting
All external data access (Crunchbase, Glassdoor, News) MUST occur only via clients in `src/libs/apis/`. Each client MUST implement: bounded retry (max 3 attempts, exponential backoff), circuit breaker (open after configurable consecutive failures), request deduplication/caching for identical queries within a 5‑minute window, and rate limiting aligned with provider terms. Failures MUST degrade gracefully: provide partial scores with reason codes instead of hard errors. Timeouts: < 3s per call; p95 combined external latency for shortlist generation < 8s.
Rationale: Third‑party variability must not destabilize user experience.

### III. Ranking Integrity & Explainability
Shortlist generation MUST produce a deterministic score breakdown per company: criteria weights (e.g., role fit, growth signals, cultural indicators), raw metrics, normalized scores, and final composite—implemented in `src/libs/shortlist/generator.ts` and formatted via `src/libs/shortlist/formatter.ts`. Each recommendation MUST include an explanation string or structured rationale object (for UI formatting). Weight changes MUST be documented with before/after examples and reviewed. Bias mitigation: exclude proxies for protected characteristics; ensure scoring functions operate only on role-relevant factors. Users MUST be able to request a JSON export of rationale.
Rationale: Clear, fair, explainable rankings foster trust and compliance with ethical guidelines.

### IV. Codebase Orientation & Context Discipline
All contributors and automated agents MUST consult `FOLDER_STRUCTURE.md` (`career-coach/FOLDER_STRUCTURE.md`) before planning, implementing, or refactoring features. LLM prompt assemblies or architectural planning MUST reference only relevant entries from the folder structure map to minimize token usage and avoid hallucinated paths. The `FOLDER_STRUCTURE.md` file serves as the single source of truth for high‑level module intent and SHOULD be used for onboarding, impact analysis, and scoping.
Rationale: Enforced orientation reduces misrouting of logic, improves LLM guidance accuracy, and accelerates safe evolution.

## Operational Constraints & Standards

Technology Stack: Next.js 15 (App Router), TypeScript, Tailwind (shadcn-ui), Vercel AI SDK. Node LTS required.
Performance Targets: p95 API route latency < 1500ms (excluding bulk external aggregation endpoints which target < 3000ms); memory stable < 512MB in production. 
Security & Privacy: Environment variables managed via `.env.local`; no secrets committed. Upload endpoints MUST validate MIME type and size (< 5MB). No third‑party tracking of CV content. 
Error Handling: All API routes return JSON `{ ok: boolean, data?: T, error?: { code: string, message: string } }`. Unexpected errors MUST map to `error.code = "INTERNAL"` with generic message; detailed stack only logged server‑side. 
Logging & Observability: Structured logs (JSON) for server events; user-sensitive fields redacted. Include correlation id per request. 
Scoring Determinism: Given identical inputs + external snapshots, shortlist MUST be identical; store snapshot of external metrics used in scoring for reproducibility (consider persisted scoring artifact under future `src/libs/evaluation/` strategy). 
Rate Limits: User interactive endpoints: max 10 shortlist generations per hour per user; chat messages throttled to 30/minute.

## Development Workflow & Quality Gates

Branch Naming: `feat/<slug>`, `fix/<slug>`, `docs/<slug>`, `chore/<slug>`. 
Pull Requests MUST: reference related task, list affected principles, include test evidence (coverage diff or new test names), and provide scoring/rationale change examples if touching shortlist logic. 
Review Checklist: (1) Principle adherence, (2) Typed interfaces updated, (3) No sensitive data leakage in logs, (4) External API safeguards present, (5) Deterministic scoring maintained. 
Testing Gates: CI MUST run lint, type check, unit tests; fail build on coverage below thresholds. High‑risk modules (evaluation, parsing) require at least one property-based or scenario integration test. 
Deployment: Only main branch deploys; requires green CI + at least one approval. 
Documentation: Changes to prompts or weights require update to `README.md` or dedicated `docs/` rationale section (future); privacy or consent changes require README Privacy subsection update. 
Constitution Check: New features MUST document which principles apply and justify any exceptions in plan.md Complexity Tracking table.

## Governance

Authority: This constitution supersedes informal conventions. Conflicts resolved by adhering to principles in listed order (earlier wins if irreconcilable). 
Amendments: Propose via PR modifying this file; include: rationale, impacted modules, migration plan, verification strategy. Version increment rules: MAJOR for removing/redefining a principle; MINOR for adding a principle or section; PATCH for clarifications. 
Compliance Review: Quarterly audit (or before major release) reviewing: data privacy, AI trace logs, test coverage, rate limit configs, scoring reproducibility sample. Findings MUST create tasks for remediation. 
Violation Handling: Critical violations (privacy, uncontrolled AI output, missing tests) block merges until resolved. Non-critical (wording/format) scheduled in next patch release. 
Traceability: Plan/spec/tasks templates MUST explicitly reference relevant principles. Automated checks (future) will parse PR descriptions for principle tags. 
Sunset/Deprecation: Principle changes require deprecation notice period (1 release cycle) unless security/privacy emergency.

**Version**: 1.0.3 | **Ratified**: 2025-10-18 | **Last Amended**: 2025-10-26

