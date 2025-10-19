# Feature Specification: Preference Gathering Flow

**Feature Branch**: `003-preference-flow`  
**Created**: 2025-10-19  
**Status**: Draft  
**Input**: User description: "Implement preference gathering flow after CV upload: multi-select dropdowns for Work Arrangement, Location (conditional), Company Stage; free-text comma-separated Interests; integrate into conversational UI and validation."

## Overview *(added)*
After a user uploads a CV and it is successfully parsed, the product must guide the user through capturing job preference data. The flow blends conversational guidance with structured selection UI. Three categorical preference groups (Work Arrangement, Location, Company Stage) are captured via multi‑select dropdown widgets. Open‑ended interests are captured via a free‑text comma‑separated input that is normalized to a distinct list. The output is a validated Preference Profile used by downstream company evaluation and shortlist generation.

## Goals *(added)*
1. Capture accurate, structured preference data with minimal friction.
2. Provide transparency and confirmation before preferences are locked for evaluation.
3. Support flexible multi-selection while preventing contradictory or impossible combinations.
4. Produce a normalized, deduplicated, validation‑clean preference object for matching logic.

## Scope *(added)*
IN SCOPE:
- Interactive preference capture immediately after CV parsing success.
- Multi-select inputs for Work Arrangement, Location (conditional constraint), Company Stage.
- Free‑text interests parsing (comma separated) → normalized list.
- Inline validation, error messages, confirmation review step, ability to edit before final confirmation.
- Storage of preferences in session state (single user session) for later matching.

OUT OF SCOPE:
- Persistent storage beyond session/matching lifecycle.
- Editing preferences after shortlist generation (future enhancement).
- Personalization or adaptive ordering of options.

## Actors *(added)*
- Primary User (Job Seeker)
- System Preference Flow Orchestrator (automated conversational guide)

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Provide Core Preferences (Priority: P1)
The user, after CV upload success, is prompted conversationally to select Work Arrangement, Location, and Company Stage options using structured multi-select components and then proceeds to free‑text interests input.

**Why this priority**: Core categorical preferences are essential for filtering potential companies; without them, downstream evaluation lacks context.

**Independent Test**: A tester can start from a mocked "CV parsed" state, complete all selections, and verify a valid preference object is produced.

**Acceptance Scenarios**:
1. **Given** CV parsing completed, **When** the user selects at least one Work Arrangement and one Location (respecting constraints), **Then** the system enables moving to next section.
2. **Given** the user selected only "In-Person", **When** they attempt to add a non-Estonia location, **Then** the system blocks input with an explanatory message.
3. **Given** the user selected valid combinations across all three categories, **When** they proceed, **Then** interests input is presented.

---

### User Story 2 - Enter and Normalize Interests (Priority: P2)
The user enters a comma-separated list of role or domain interests; the system cleans, trims, deduplicates, and enforces limits, showing chips/pills for each accepted interest.

**Why this priority**: Interests refine relevance scoring but are secondary to categorical filters.

**Independent Test**: Provide an input string with duplicates, excess whitespace, and over-limit entries; verify normalized list respects constraints and error messages surface appropriately.

**Acceptance Scenarios**:
1. **Given** user inputs "AI/ML,  AI/ML , Full Stack Engineering, Data Platforms", **When** parsed, **Then** duplicates collapse to unique entries preserving original order of first occurrence.
2. **Given** user inputs more than the maximum allowed interests, **When** they submit, **Then** the system accepts only the first N and informs the user which were ignored.

---

### User Story 3 - Review & Confirm Preferences (Priority: P3)
The user reviews a structured summary of all selected preferences and interests and confirms or returns to edit any section before finalizing.

**Why this priority**: Confirmation reduces downstream mismatches and increases user trust.

**Independent Test**: From a populated preference draft, navigate to review, edit one category, re-confirm, and ensure final object reflects the edit exactly once.

**Acceptance Scenarios**:
1. **Given** completed selections, **When** user opens review, **Then** all categories and interests display in human-readable labels.
2. **Given** review screen visible, **When** user chooses to edit Company Stage, **Then** system returns to that step with prior selections pre-populated.
3. **Given** user confirms, **When** system emits final preference object, **Then** it is locked for matching (no further edits unless a reset action is explicitly triggered).

---

### Edge Cases
- User selects no Work Arrangement: validation prevents progression with clear message.
- User selects only In-Person then tries to add EEA-only location: blocked with rationale.
- User selects Hybrid + In-Person and removes Hybrid leaving only In-Person: any non-Estonia location chips are auto-removed with notice.
- Interests input empty: allowed (interests optional) → produces empty list.
- Interests contain excessively long tokens (>40 chars): those tokens rejected with inline per-token error.
- Interests list exceeds maximum (default assumption: 15): overflow entries ignored and user notified.
- All categories selected (Remote + Hybrid + In-Person): allowed; conditional rules reevaluated (location set must still comply).
- User pastes string of just commas: results in empty list and no error (treated as optional field).

## Requirements *(mandatory)*

### Functional Requirements
- **FR-001**: System MUST initiate the preference gathering flow immediately after successful CV parsing acknowledgment.
- **FR-002**: System MUST present multi-select control for Work Arrangement with options: Remote, Hybrid, In-Person; at least one selection required.
- **FR-003**: System MUST present multi-select control for Location with options: European Economic Area (EEA), Estonia.
- **FR-004**: System MUST enforce rule: If and only if the final Work Arrangement selection set equals {In-Person}, the Location selection MUST be restricted to Estonia (EEA disallowed / removed if previously selected).
- **FR-005**: System MUST present multi-select control for Company Stage with options: Well-funded, Likely to IPO, Unicorn; zero or more allowed (ASSUMPTION: user may skip if uncertain) unless clarified.
- **FR-006**: System MUST provide a free-text comma-separated Interests input that parses into a distinct ordered list of interests.
- **FR-007**: System MUST trim whitespace, remove empty entries, and deduplicate interests preserving the first occurrence.
- **FR-008**: System MUST reject any single interest token exceeding 40 characters with a per-token validation message.
- **FR-009**: System MUST cap accepted interests at a maximum of 15; additional entries are ignored and surfaced via a non-blocking notice.
- **FR-010**: System MUST allow user to proceed with zero interests (field optional).
- **FR-011**: System MUST provide inline validation messages that appear proximal to the offending field and disappear once corrected.
- **FR-012**: System MUST present a Review step summarizing all chosen values before final confirmation.
- **FR-013**: System MUST allow user to revisit any earlier category from the Review step, preserving previous selections for modification.
- **FR-014**: System MUST produce a final immutable Preference Profile object only after explicit user confirmation.
- **FR-015**: System MUST expose a single success callback/event carrying the Preference Profile for downstream processes.
- **FR-016**: System MUST prevent modification of the Preference Profile after confirmation unless a full preference reset action is invoked.
- **FR-017**: System MUST log (internally) preference completion event including timestamp and counts of selections (no PII beyond selections and derived meta counts).
- **FR-018**: System MUST handle session abandonment (user navigates away) by discarding incomplete preference state (no partial profile emitted).
- **FR-019**: System MUST display a clear error if internal normalization fails, prompting retry without data loss of user-entered raw text.

Potential clarifications (marked only where critical):
- **FR-020**: System MUST allow zero Company Stage selections (Company Stage is optional); flow must not block progression if none chosen.
- **FR-021**: System MUST prohibit edits to the confirmed Preference Profile for MVP (no post-confirmation modifications; user would need full session restart for changes).

### Key Entities
- **PreferenceProfile**: Structured object containing arrays: workArrangements[], locations[], companyStages[], interests[] plus metadata (confirmedAt, version).
- **PreferenceDraft**: Transient working state mirroring PreferenceProfile fields plus validation error collections until confirmation.

## Success Criteria *(mandatory)*

### Measurable Outcomes
- **SC-001**: 95% of users who reach CV parsing success complete the preference flow within 3 minutes.
- **SC-002**: < 2% validation error re-occurrence rate after correction (i.e., same field triggering error twice consecutively for same cause).
- **SC-003**: 90% of users report (post-flow micro-survey) that the preference capture was "Clear" or better (4/5 or 5/5).
- **SC-004**: 100% of emitted Preference Profiles conform to schema (no null required arrays, enforcement of conditional location rule).
- **SC-005**: Abandonment rate of the preference flow (users leaving before confirmation) is below 15% within first 30 days of launch.

## Assumptions *(added)*
- Interests are optional; absence does not block downstream matching.
- Maximum interests = 15; maximum length per interest = 40 characters.
- Company Stage may be optional (pending clarification FR-020); default: optional.
- Post-confirmation edits are excluded from MVP unless clarified (FR-021 default: not allowed).
- Location options intentionally coarse (EEA vs Estonia) to reduce cognitive load.
- Time metrics measured from first render of Work Arrangement step to confirmation event.

## Dependencies *(added)*
- Successful CV parsing event emission prior to initiating flow.
- Downstream matching logic expecting PreferenceProfile schema.

## Out of Scope Risks *(added)*
- Future expansion (e.g., salary ranges, company size) intentionally omitted to preserve simplicity.

## Clarifications Resolved
1. Company Stage selection is optional (users may proceed with none).
2. Post-confirmation edits are not permitted in MVP; Preference Profile remains immutable until session restart.

## Glossary *(added)*
- **Preference Profile**: The confirmed, immutable structured representation of user preferences consumed by evaluation and shortlist generation.
