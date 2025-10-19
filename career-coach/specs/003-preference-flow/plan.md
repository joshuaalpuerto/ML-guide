# Implementation Plan: Preference Gathering Flow

**Branch**: 003-preference-flow  
**Spec**: ./spec.md  
**Status**: Draft  
**Date**: 2025-10-19

## 1. Technical Context
Feature adds hybrid conversational + structured UI for capturing preferences post CV parsing. The updated specification introduces a consolidated (bulk) selection panel for the three categorical groups (Work Arrangement, Location, Company Stage) and a requirement to disable regular chat input while this panel is active (FR-001A, FR-001B).

### Stack & Existing Modules
- Runtime: Next.js 15 (App Router), TypeScript.
- UI: shadcn-ui + Tailwind (existing components in `src/components`).
- Business logic should sit in `src/libs/preferences/` and state orchestration in `src/libs/chat/conversation-handler.ts` (per Constitution Principle I).
- Types: `src/types/user-data.ts` will be extended with PreferenceProfile.

### New Components / Modules
- MultiSelect UI component (presentation only) under `src/components/ui/` or `src/components/preferences/` (used across all three categorical groups inside consolidated panel).
- Consolidated Preference Panel wrapper component (may live in `src/components/preferences/` — orchestrates bulk selection state & disables chat input while mounted).
- InterestsInput component for comma-separated parsing (presentation only) revealed/enabled only after required categorical minimums satisfied.
- `src/libs/preferences/preference-normalizer.ts` for parsing & validation logic (keeps logic out of components) including conditional location rule & interests branch.
- `src/libs/preferences/preference-store.ts` for draft state management (pure functions + simple in-memory session abstraction) including immutable confirmation.

### Data Shapes (High-Level)
- PreferenceDraft: { workArrangements: string[], locations: string[], companyStages: string[], interests: string[], errors: Record<string,string[]> }
- PreferenceProfile: { workArrangements: string[], locations: string[], companyStages: string[], interests: string[], confirmedAt: string, version: number }

### Constraints / Rules
- Work Arrangement: >=1 required.
- Conditional Location: if workArrangements === ['In-Person'] then locations must be ['Estonia'] (EEA auto-removed if previously selected when switching to in-person only). Auto-removal must surface a notice.
- Company Stage: optional (0+ selections).
- Interests: optional, unique, <=15, each <=40 chars (overflow silently ignored with notice; over-length tokens rejected with inline token error).
- Bulk Panel: User can select categories in any order; progression to interests only requires (>=1 work arrangement & >=1 location valid under conditional rule).
- Chat Disable: Chat input MUST be disabled while consolidated panel active (re-enabled after review confirmation or flow completion / abandonment).

### Unknowns / Clarifications
Currently resolved: Company Stage optional; no post-confirmation edits. No outstanding critical unknowns.

### Risks
- Validation complexity creeping into UI components (mitigated by lib normalization module).
- Over-expansion of interests causing UI overflow (chip wrapping strategy needed).
- User confusion due to disabled chat input (mitigate with inline helper text explaining temporary disablement).
- Bulk panel state divergence (ensure single source of truth in store; panel components receive derived state not own duplicated state).

### Non-Functional Considerations
- Must not degrade chat latency; prefer lazy load of choice components & defer interests parsing until input blur / submit.
- Accessibility: keyboard navigation for MultiSelect (tab, arrow keys, space/enter) and ARIA roles. Chat disable should be announced to screen readers (aria-disabled or descriptive text).
- Privacy: preference data transient; not persisted beyond session.
- Observability: instrumentation around time-to-complete (panel mount -> confirmation) & abandonment.

## 2. Constitution Check (Initial)
Principle I: Modular Business Logic – Plan uses libs for parsing & storage (COMPLIANT).  
Principle II: External API Resilience – No new external calls (N/A).  
Principle III: Ranking Integrity – Provides clean preference object for deterministic scoring (SUPPORTS).  
Performance targets: Flow local only; should keep p95 route latency unaffected (OK).  
Security & Privacy: No new secrets, only local state (OK).  
Error Handling: Will follow JSON shape if exposing API endpoint later (OK).  
Testing Gates: Plan will add unit tests for normalizer & conditional rules (OK).  
No exceptions requested.

## 3. Phase 0: Research Summary
No unresolved NEEDS CLARIFICATION items; formal research artifact will still capture decisions & alternatives. Action: create `research.md` with rationale for optional Company Stage and immutable confirmation.

## 4. Phase 1: Design Artifacts
Artifacts to produce: `research.md`, `data-model.md`, `contracts/preferences.yaml` (OpenAPI), `quickstart.md`.

## 5. Phase 2: Implementation Outline
High-level tasks (will map to repo tasks):
1. Extend types (`user-data.ts`).
2. Add libs: normalizer, store, confirmation emitter.
3. Build MultiSelect component & consolidated panel wrapper (A11y + keyboard nav) plus InterestsInput.
4. Integrate into conversation flow with chat disable toggle & bulk (non-linear) selection support.
5. Add tests (bulk selection enablement, chat disabled, conditional restriction, parsing, edge cases, a11y).
6. Wire final profile emission to shortlist trigger.

## 6. Testing Strategy
- Unit tests: normalizer (work arrangement required, conditional location rule, interests parsing: dedupe, limit, length rejection).
- Integration tests: (a) bulk selection path enabling interests without linear steps, (b) draft -> review -> confirm sequence producing immutable profile.
- Component tests: MultiSelect keyboard navigation & selection toggling, ChatInterface enforcing disabled chat input while panel active, InterestsInput chip add/remove.
- Accessibility: ARIA roles & keyboard interactions for MultiSelect & InterestsInput, focus management when chat is disabled (announce reason).
- Edge case tests: auto-removal notice when transitioning to in-person only; empty / commas-only interests string; overflow & over-length tokens.

## 7. Rollout & Metrics
- Soft launch behind internal flag; measure completion time & abandonment.
- Instrument events: `preferences_started`, `preferences_step_completed` (including interests), `preferences_review_opened`, `preferences_confirmed`, `preferences_abandoned`.
- Capture metric: time_to_enable_interests (panel mount -> interests enabled) to validate bulk selection efficiency.

## 8. Open Items
None.

## 9. Post-Design Constitution Recheck (Placeholder)
Re-evaluation completed after adding artifacts:
- Principles I–III: Compliant (logic isolated in libs design; no external API additions; deterministic profile structure supports ranking integrity).
- No privacy/security deviations introduced.
- Testing commitments present (unit + integration + accessibility notes).
- Exception: Agent context update script failed (missing `agent-file-template.md`); does not impact feature compliance but should be addressed separately.

No amendments or exceptions required. Ready for Phase 2 implementation tasks (updated to include bulk panel & chat disable considerations).
