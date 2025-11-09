# Libs Catalog (Authoritative Inventory)

Last Updated: 2025-11-09

Purpose: Canonical, single-source list of every module under `src/libs/` with concise responsibility, primary exports, and maintenance triggers. Update this file FIRST whenever adding, removing, renaming, or materially changing a libs module. Keep entries lean (<6 lines each). Do not duplicate UI concerns here.

## Update Policy
1. Add new entry BEFORE commit / PR creation.
2. If a file is deleted/renamed, reflect change in same PR.
3. When domain behavior (API surface, scoring formula, parsing heuristic, error type) changes, append a bullet to the relevant Maintenance Log section (see below).
4. No stale entries – treat missing update as a failed Definition of Done item.

## Template (Use for New Entry)
```
### <Category>: `<relative-path>` – <1-line responsibility>
Exports: <main exported functions/types>
Notes: <edge cases / formula / normalization note>
Maintenance Triggers: <what changes require catalog + instructions update>
```

---
## Catalog Entries

### APIs
- `apis/crunchbase-client.ts` – Stub Crunchbase client (implementation pending).
	Exports: (none yet)
	Maintenance Triggers: Initial implementation, new endpoint, auth strategy, normalization field additions.
- `apis/glassdoor-client.ts` – Stub Glassdoor client (implementation pending).
	Exports: (none yet)
	Maintenance Triggers: Add ratings ingestion, pagination, field mapping changes.
- `apis/news-client.ts` – Stub News client for company articles (implementation pending).
	Exports: (none yet)
	Maintenance Triggers: Source integration, summarization preprocessor addition, rate limit logic.

### Chat
- `chat/conversation-handler.ts` – Preference flow orchestration (start, state snapshot, step update, advancement).
	Exports: `startPreferencesFlow`, `getPreferenceState`, `updatePreferenceStep`, `advancePreferenceStep`.
	Maintenance Triggers: New preference step, state progression rule change, completion criteria update.

### Files
- `files/cv-uploader.ts` – Stub CV uploader (validation + dispatch pending implementation).
	Exports: (none yet)
	Maintenance Triggers: Add size/type validation, new storage backend, accepted format change.
- `files/file-handler.ts` – Stub file handler utilities (naming, extraction pending).
	Exports: (none yet)
	Maintenance Triggers: Add sanitization rules, new extraction method.

### Preferences
- `preferences/analytics.ts` – Emits preference lifecycle + progress instrumentation events.
	Exports: `emitStarted`, `emitStepCompleted`, `emitConfirmed` (plus others).
	Maintenance Triggers: New event, payload schema change, analytics sink integration.
- `preferences/constants.ts` – Canonical option sets & limits for preference inputs.
	Exports: `WORK_ARRANGEMENT_OPTIONS`, `LOCATION_OPTIONS`, `COMPANY_STAGE_OPTIONS`.
	Maintenance Triggers: Option list changes, max limits adjustments.
- `preferences/errors.ts` – Error code enumeration for validation outcomes.
	Exports: `PreferenceErrorCodes`, `PreferenceErrorCode`.
	Maintenance Triggers: Add/remove error codes, taxonomy rename.
- `preferences/events.ts` – Event name constants for preference flow analytics.
	Exports: `PREFERENCES_EVENTS`, `PreferenceEventKey`.
	Maintenance Triggers: Event addition/removal, naming convention shift.
- `preferences/index.ts` – Barrel re-export aggregating preference domain modules.
	Exports: (re-exports multiple modules)
	Maintenance Triggers: Added/removed underlying module, export surface change.
- `preferences/preference-collector.ts` – Stub collector logic (sequential flow pending implementation).
	Exports: (none yet)
	Maintenance Triggers: Implement collection sequencing, step addition/removal.
- `preferences/preference-normalizer.ts` – Validation + normalization of draft preferences.
	Exports: `validateAndNormalizeDraft`, `enforceConditionalLocationRule`.
	Maintenance Triggers: New normalization rule, conditional logic change, schema field rename.
- `preferences/preference-store.ts` – In-memory draft + confirmed profile management.
	Exports: `initDraft`, `getDraft`, `updateDraft`, `confirmProfile`.
	Maintenance Triggers: Persistence layer addition, versioning change, profile schema update.

### Parsing
- `parsing/cv-parser.ts` – Stub CV parsing logic (text → structured data pending implementation).
	Exports: (none yet)
	Maintenance Triggers: Add parsing heuristics, section extraction, error taxonomy change.

### Evaluation
- `evaluation/company-evaluator.ts` – Stub company scoring formulas (weights & dimensions pending).
	Exports: (none yet)
	Maintenance Triggers: Introduce scoring dimensions, weight adjustments, formula refactor.

### Shortlist
- `shortlist/formatter.ts` – Stub shortlist formatting (output shaping pending).
	Exports: (none yet)
	Maintenance Triggers: Output field additions/removals, formatting rule change.
- `shortlist/generator.ts` – Stub shortlist generation (evaluation + ranking pending).
	Exports: (none yet)
	Maintenance Triggers: Ranking algorithm change, new filter type, evaluation dependency update.

### Hooks
- `hooks/useApiFetcher.ts` – API request lifecycle hook with abort, parsing & state management.
	Exports: `useApiFetcher`, `request`, `ApiState`.
	Maintenance Triggers: State shape change, retry/backoff strategy, error handling schema.

### Config
- `config/settings.ts` – Centralized API key access & dev-time warnings.
	Exports: `CRUNCHBASE_API_KEY`, `GLASSDOOR_API_KEY`, `NEWS_API_KEY`.
	Maintenance Triggers: New env var, key rename, validation/warning logic change.

### Utilities
- `utils.ts` – Tailwind + clsx merge utility for composing className strings.
	Exports: `cn`.
	Maintenance Triggers: Additional variant logic, performance concern, non-pure helper additions.

### Formatters
- `formatters/date.ts` – ISO date → YYYY-MM-DD safe formatting with invalid input guards.
	Exports: `formatDateYMD`.
	Maintenance Triggers: New display format, timezone handling change, invalid input policy update.

---
## Maintenance Log
Record concise bullets for domain-impacting changes. Newest first.

### Evaluation Changes
- (none yet)

### Parsing Changes
- (none yet)

### Preferences Changes
- (none yet)

### API Client Changes
- (none yet)

### Error Taxonomy Changes
- (none yet)

### Performance / Caching Changes
- (none yet)

2025-11-09: Added preferences/constants.ts, preferences/errors.ts, preferences/events.ts, preferences/index.ts, formatters/date.ts; Removed formatters/string.ts
