---
description: "Task list for Preference Gathering Flow feature implementation"
---

# Tasks: Preference Gathering Flow

**Input**: Design documents from `/specs/003-preference-flow/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Tests ARE requested per plan (normalizer, conditional rules, component interaction, integration). Include targeted unit, component, and integration tests.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing. Each user story delivers a fully testable increment.

## Format: `[ID] [P?] [Story] Description`
- **[P]**: Can run in parallel (different files, no direct unresolved dependencies)
- **[Story]**: User story label (US1, US2, US3)
- All tasks include explicit file paths

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Any repository or structural prep specific to this feature (minimal because project already initialized)

- [X] T001 Create feature analytics event constants in `src/libs/preferences/events.ts`
- [X] T002 [P] Add placeholder preferences section comment block in `src/types/user-data.ts` (will extend in Foundational)
- [X] T003 [P] Create directory `src/libs/preferences/` (if not existing) with README stub `src/libs/preferences/README.md`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core types and scaffolding required before implementing any user story logic
**⚠️ CRITICAL**: Complete before starting user story phases

- [X] T004 Extend user types with `PreferenceDraft`, `PreferenceProfile`, and `PreferenceValidationResult` in `src/types/user-data.ts`
- [X] T005 [P] Define constant option sets (WORK_ARRANGEMENT_OPTIONS, LOCATION_OPTIONS, COMPANY_STAGE_OPTIONS) in `src/libs/preferences/constants.ts`
- [X] T006 [P] Implement normalization & validation skeleton (function stubs only) in `src/libs/preferences/preference-normalizer.ts`
- [X] T007 Implement in-memory draft store utilities (init, updateDraft, toProfile) in `src/libs/preferences/preference-store.ts`
- [X] T008 [P] Add preference analytics emitter utility in `src/libs/preferences/analytics.ts`
- [X] T009 Add story-specific error codes enumeration in `src/libs/preferences/errors.ts`
- [X] T010 [P] Create initial unit test placeholders for normalizer & store in `tests/unit/preferences/normalizer.test.ts` and `tests/unit/preferences/store.test.ts`
- [X] T011 Integrate draft store reference hook point in conversation handler (`src/libs/chat/conversation-handler.ts`) behind TODO comment (no logic yet)
- [X] T012 [P] Add basic barrel export in `src/libs/preferences/index.ts`
- [X] T013 Document validation rule summary in `src/libs/preferences/README.md`

**Checkpoint**: Foundational types & scaffolds ready. Normalizer logic and UI flows can now proceed independently per story.

---

## Phase 3: User Story 1 - Provide Core Preferences (Priority: P1) 🎯 MVP

**Goal**: Capture Work Arrangement, Location (with conditional restriction), and optional Company Stage selections producing a validated draft ready for interests step.
**Independent Test**: From a mocked post-CV-parse state, user can make selections respecting conditional rule and obtain a valid draft object without interests.

### Tests for User Story 1

- [ ] T014 [P] [US1] Implement unit tests for work arrangement required rule in `tests/unit/preferences/normalizer.test.ts`
- [ ] T015 [P] [US1] Implement unit tests for conditional in-person location restriction in `tests/unit/preferences/normalizer.test.ts`
- [ ] T016 [P] [US1] Add integration test simulating selection flow (no interests) in `tests/integration/preferences/core-flow.test.ts`
- [ ] T017 [P] [US1] Add accessibility keyboard navigation tests skeleton for MultiSelect in `tests/component/preferences/MultiSelect.a11y.test.tsx`

### Implementation for User Story 1

- [ ] T018 [P] [US1] Implement full normalization & validation logic (work arrangements, locations, company stages) in `src/libs/preferences/preference-normalizer.ts`
- [ ] T019 [P] [US1] Implement MultiSelect base component with ARIA roles & keyboard nav in `src/components/ui/MultiSelect.tsx`
- [ ] T020 [P] [US1] Create PreferenceStepWorkArrangement component in `src/components/preferences/PreferenceStepWorkArrangement.tsx`
- [ ] T021 [P] [US1] Create PreferenceStepLocation component in `src/components/preferences/PreferenceStepLocation.tsx`
- [ ] T022 [P] [US1] Create PreferenceStepCompanyStage component in `src/components/preferences/PreferenceStepCompanyStage.tsx`
- [ ] T023 [US1] Wire step orchestration (advance, validate, error display) into conversation handler in `src/libs/chat/conversation-handler.ts`
- [ ] T024 [US1] Emit `preferences_started` and per-step completion events in `src/libs/preferences/analytics.ts`
- [ ] T025 [US1] Implement conditional auto-removal logic for EEA when switching to in-person only in `src/libs/preferences/preference-normalizer.ts`
- [ ] T026 [US1] Add user-facing validation messaging components (inline errors) in `src/components/preferences/PreferenceValidationMessages.tsx`
- [ ] T027 [US1] Update chat UI to insert preference steps after CV parse success in `src/components/chat/ChatInterface.tsx`
- [ ] T028 [US1] Ensure draft persisted in memory across steps via store in `src/libs/preferences/preference-store.ts`
- [ ] T029 [US1] Add logging instrumentation for draft completion counts in `src/libs/preferences/analytics.ts`

**Checkpoint**: Core categorical preferences captured & validated; draft ready for interests. Story independently testable.

---

## Phase 4: User Story 2 - Enter and Normalize Interests (Priority: P2)

**Goal**: Parse and normalize comma-separated interests into a deduplicated, bounded list with per-token validation.
**Independent Test**: Provide complex input string with duplicates, whitespace, over-limit tokens; normalized list output validated and errors surfaced.

### Tests for User Story 2

- [ ] T030 [P] [US2] Add unit tests for interests dedupe, trimming, empty handling in `tests/unit/preferences/normalizer.test.ts`
- [ ] T031 [P] [US2] Add unit tests for token length >40 rejection & message in `tests/unit/preferences/normalizer.test.ts`
- [ ] T032 [P] [US2] Add unit tests for limit >15 truncation & ignored list messaging in `tests/unit/preferences/normalizer.test.ts`
- [ ] T033 [P] [US2] Add component interaction test for InterestsInput adding/removing chips in `tests/component/preferences/InterestsInput.test.tsx`

### Implementation for User Story 2

- [ ] T034 [P] [US2] Implement interests parsing branch (split, trim, dedupe, length rules) in `src/libs/preferences/preference-normalizer.ts`
- [ ] T035 [P] [US2] Create InterestsInput component in `src/components/preferences/InterestsInput.tsx`
- [ ] T036 [P] [US2] Add overflow & rejection notice UI in `src/components/preferences/InterestsNotices.tsx`
- [ ] T037 [US2] Integrate interests step into flow sequencing in `src/libs/chat/conversation-handler.ts`
- [ ] T038 [US2] Extend analytics events for interests step (`preferences_step_completed` for interests) in `src/libs/preferences/analytics.ts`
- [ ] T039 [US2] Persist interests additions/removals in draft via store in `src/libs/preferences/preference-store.ts`

**Checkpoint**: Interests captured & normalized; full draft now includes interests; flow ready for review & confirmation.

---

## Phase 5: User Story 3 - Review & Confirm Preferences (Priority: P3)

**Goal**: Display review summary, allow edits to prior steps, lock immutable PreferenceProfile upon confirmation.
**Independent Test**: From populated draft, open review, edit one category, reconfirm; final profile immutable.

### Tests for User Story 3

- [ ] T040 [P] [US3] Add integration test for review edit roundtrip in `tests/integration/preferences/review-flow.test.ts`
- [ ] T041 [P] [US3] Add unit test ensuring confirmed profile immutable (attempt mutation rejected) in `tests/unit/preferences/store.test.ts`
- [ ] T042 [P] [US3] Add test for final validation re-run on confirmation in `tests/unit/preferences/normalizer.test.ts`

### Implementation for User Story 3

- [ ] T043 [P] [US3] Create ReviewSummary component in `src/components/preferences/ReviewSummary.tsx`
- [ ] T044 [P] [US3] Implement confirmation action converting draft → profile in `src/libs/preferences/preference-store.ts`
- [ ] T045 [US3] Wire review step navigation & edit capabilities in `src/libs/chat/conversation-handler.ts`
- [ ] T046 [US3] Emit `preferences_review_opened` & `preferences_confirmed` events in `src/libs/preferences/analytics.ts`
- [ ] T047 [US3] Trigger downstream shortlist/evaluation initiation using confirmed profile in `src/libs/chat/conversation-handler.ts`
- [ ] T048 [US3] Implement guard preventing further edits post-confirmation in `src/libs/preferences/preference-store.ts`
- [ ] T049 [US3] Implement abandonment detection hook (on session end) logging `preferences_abandoned` in `src/libs/preferences/analytics.ts`

**Checkpoint**: Final immutable PreferenceProfile emitted; downstream pipeline triggered; story independently verifiable.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Non-functional improvements & documentation after core stories complete.

- [ ] T050 [P] Add README usage examples for normalizer & store in `src/libs/preferences/README.md`
- [ ] T051 Refactor duplicate validation message patterns in `src/components/preferences` (consolidate helpers) in `src/components/preferences/` files
- [ ] T052 [P] Add additional edge case tests (comma-only interests, switching to in-person only auto-removals) in `tests/unit/preferences/normalizer.test.ts`
- [ ] T053 Performance micro-benchmark (normalizer function) script in `tests/perf/preferences/normalizer.bench.ts`
- [ ] T054 [P] Add accessibility audit script for MultiSelect & InterestsInput in `tests/a11y/preferences/audit.test.ts`
- [ ] T055 Security review checklist entry in `docs/security/preference-flow.md`
- [ ] T056 [P] Validate quickstart accuracy (run through steps) update `specs/003-preference-flow/quickstart.md`
- [ ] T057 Add skip/bypass flag wiring (if needed for rollback) in `src/libs/preferences/feature-flags.ts`
- [ ] T058 Cleanup TODO comments introduced during implementation across `src/libs/preferences/`

---

## Dependencies & Execution Order

### Phase Dependencies
- Setup (Phase 1): No dependencies
- Foundational (Phase 2): Depends on Setup (directory & initial stubs) – BLOCKS all user stories
- User Story Phases (3–5): Depend on completion of Foundational (Phase 2); each story independent of others beyond shared scaffolds
- Polish (Phase 6): Depends on completion of targeted user stories (at minimum MVP = US1; full polish after US3)

### User Story Dependencies
- US1 (P1): Requires Phase 2
- US2 (P2): Requires Phase 2; independent of US1 except for shared store & normalizer extension (tests remain independent by mocking prior data)
- US3 (P3): Requires Phase 2; uses draft produced by prior steps but can be tested by seeding draft directly

### Within Story Ordering
- Tests written before implementation tasks (enforced by listing tests first)
- Components rely on constants & types → constants/types done in Phases 1–2
- Analytics events added concurrently once event constants exist

### Parallel Opportunities
- Constants, analytics, and error code files can be built in parallel
- MultiSelect subcomponents can be built parallel to normalizer logic (interfaces already defined)
- Interests parsing tasks parallel to interests UI component
- Review summary creation parallel to confirmation action implementation
- Polish phase tests & docs can run parallel

---

## Parallel Execution Examples

### Example 1 (Early US1)
T018, T019, T020, T021, T022 can run in parallel after T004–T013 complete.

### Example 2 (US2 Interests)
T034, T035, T036, T030, T031, T032 can run in parallel (logic + tests + UI) using established interfaces.

### Example 3 (US3 Review)
T043, T044, T046, T048 proceed in parallel (component, store action, analytics, guard) then converge at T045 & T047.

---

## Implementation Strategy

### MVP (Deliver Quickly)
1. Complete Phases 1–2
2. Implement Phase 3 (US1) fully → verify draft generation & validation
3. Ship MVP enabling downstream evaluation with categorical preferences only

### Incremental Enhancement
4. Add Phase 4 (US2) for interests enrichment
5. Add Phase 5 (US3) for review & confirmation immutability + downstream trigger
6. Execute Phase 6 polish tasks iteratively

### Quality Gates
- Each user story includes unit & integration coverage before moving on
- Accessibility tests ensure keyboard operability of MultiSelect & InterestsInput
- Analytics events verified in dev logs prior to shipping

---

## Validation Checklist
- All tasks formatted with: checkbox, sequential ID, optional [P], optional [USx], explicit file path → YES
- User stories independent & testable → YES
- Tests appear before implementation in each story → YES
- Parallelizable tasks marked [P] → YES
- Clear MVP scope defined (US1) → YES

---

## Summary
Total Tasks: 58
Tasks per Story: US1 (16 tasks: T014–T029), US2 (10 tasks: T030–T039), US3 (10 tasks: T040–T049)
Parallel Opportunities Identified: Multi-select (US1), Interests parsing (US2), Review & confirmation components (US3), plus constants & analytics
Independent Test Criteria: Listed at each story phase header
MVP Scope: Phase 3 (US1) only – provides validated categorical preferences
Format Validation: All tasks conform to required checklist pattern

