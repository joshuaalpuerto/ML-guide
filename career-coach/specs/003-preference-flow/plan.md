# Implementation Plan: Preference Gathering Flow

**Branch**: 003-preference-flow  
**Spec**: ./spec.md  
**Status**: Draft  
**Date**: 2025-10-19

## 1. Technical Context
Feature adds hybrid conversational + structured UI for capturing preferences post CV parsing.

### Stack & Existing Modules
- Runtime: Next.js 15 (App Router), TypeScript.
- UI: shadcn-ui + Tailwind (existing components in `src/components`).
- Business logic should sit in `src/libs/preferences/` and state orchestration in `src/libs/chat/conversation-handler.ts` (per Constitution Principle I).
- Types: `src/types/user-data.ts` will be extended with PreferenceProfile.

### New Components / Modules
- MultiSelect UI component (presentation only) under `src/components/ui/` or `src/components/preferences/`.
- InterestsInput component for comma-separated parsing (presentation only).
- `src/libs/preferences/preference-normalizer.ts` (new) for parsing & validation logic (keeps logic out of components).
- `src/libs/preferences/preference-store.ts` for draft state management (pure functions + simple in-memory session abstraction).

### Data Shapes (High-Level)
- PreferenceDraft: { workArrangements: string[], locations: string[], companyStages: string[], interests: string[], errors: Record<string,string[]> }
- PreferenceProfile: { workArrangements: string[], locations: string[], companyStages: string[], interests: string[], confirmedAt: string, version: number }

### Constraints / Rules
- Work Arrangement: >=1 required.
- Conditional Location: if workArrangements === ['In-Person'] then locations must be ['Estonia'].
- Company Stage: optional (0+ selections).
- Interests: optional, unique, <=15, each <=40 chars.

### Unknowns / Clarifications
Currently resolved: Company Stage optional; no post-confirmation edits. No outstanding critical unknowns.

### Risks
- Validation complexity creeping into UI components (mitigated by lib normalization module).
- Over-expansion of interests causing UI overflow (chip wrapping strategy needed).

### Non-Functional Considerations
- Must not degrade chat latency; prefer lazy load of choice components.
- Accessibility: keyboard navigation for MultiSelect (tab, arrow keys, space/enter) and ARIA roles.
- Privacy: preference data transient; not persisted beyond session.

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
3. Build MultiSelect & InterestsInput components (A11y included).
4. Integrate into conversation flow (state transitions).
5. Add tests (parsing, conditional restriction, edge cases).
6. Wire final profile emission to shortlist trigger.

## 6. Testing Strategy
- Unit tests: normalizer (token parsing, limits), conditional location rule, dedupe logic.
- Component tests: MultiSelect keyboard navigation.
- Integration test: simulate draft -> review -> confirm sequence producing immutable profile.
- Accessibility audit script (basic ARIA role checks). (Deferred if time constrained.)

## 7. Rollout & Metrics
- Soft launch behind internal flag; measure completion time & abandonment.
- Instrument events: `preferences_started`, `preferences_confirmed`, `preferences_abandoned`.

## 8. Open Items
None.

## 9. Post-Design Constitution Recheck (Placeholder)
Re-evaluation completed after adding artifacts:
- Principles I–III: Compliant (logic isolated in libs design; no external API additions; deterministic profile structure supports ranking integrity).
- No privacy/security deviations introduced.
- Testing commitments present (unit + integration + accessibility notes).
- Exception: Agent context update script failed (missing `agent-file-template.md`); does not impact feature compliance but should be addressed separately.

No amendments or exceptions required. Ready for Phase 2 implementation tasks.
