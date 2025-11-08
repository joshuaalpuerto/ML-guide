# Libs Catalog (Authoritative Inventory)

Last Updated: 2025-11-08

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
- `apis/crunchbase-client.ts` – Fetch & normalize company profile data.
	Exports: `fetchCompanyProfile` (normalized), internal rate-limit helper.
	Maintenance Triggers: New endpoint, auth strategy, added normalization fields, error taxonomy change.
- `apis/glassdoor-client.ts` – Employer review & rating ingestion + shaping.
	Exports: `fetchEmployerReviews` (normalized ratings + counts).
	Maintenance Triggers: Scoring source changes, field mapping update, pagination strategy.
- `apis/news-client.ts` – Company news retrieval + summarization prep layer.
	Exports: `fetchCompanyNews` (sanitized articles subset).
	Maintenance Triggers: Source change, summarization preprocessor addition, rate limit logic.

### Chat
- `chat/conversation-handler.ts` – Turn orchestration & conversation state transitions.
	Exports: `handleUserMessage`, `initializeConversation`.
	Maintenance Triggers: New dialog action, state machine change, error type expansion.

### Files
- `files/cv-uploader.ts` – CV upload validation (size/type) + dispatch to parsing.
	Exports: `validateAndStoreCV`.
	Maintenance Triggers: New file format acceptance, storage strategy change.
- `files/file-handler.ts` – Generic file lifecycle helpers (naming, safe text extraction).
	Exports: `extractPlainText`, `generateSafeFilename`.
	Maintenance Triggers: Sanitization rule change, new extraction method.

### Preferences
- `preferences/preference-collector.ts` – Sequential collection flow control.
	Exports: `collectNextPreference`.
	Maintenance Triggers: New preference step, sequence order change.
- `preferences/preference-normalizer.ts` – Normalizes raw preference inputs to canonical types.
	Exports: `normalizePreference`.
	Maintenance Triggers: New normalization rule, field rename.
- `preferences/preference-store.ts` – In-memory store for collected preferences.
	Exports: `PreferenceStore` (class / instance helpers).
	Maintenance Triggers: Persistence change, data schema update.
- `preferences/analytics.ts` – Aggregation & lightweight metrics on preference data.
	Exports: `computePreferenceStats`.
	Maintenance Triggers: New metric, performance optimization.

### Parsing
- `parsing/cv-parser.ts` – CV text → structured user data extraction.
	Exports: `parseCV` (composite), internal regex helpers.
	Maintenance Triggers: New regex heuristic, section parsing addition, error taxonomy change.

### Evaluation
- `evaluation/company-evaluator.ts` – Company scoring formulas (weighted dimensions).
	Exports: `evaluateCompany`.
	Notes: Each weight constant documents its formula rationale inline.
	Maintenance Triggers: New scoring dimension or weight adjustment, formula refactor.

### Shortlist
- `shortlist/generator.ts` – Orchestrates evaluation + ranking + filtering.
	Exports: `generateShortlist`.
	Maintenance Triggers: Ranking algorithm change, new filter type.
- `shortlist/formatter.ts` – Shapes shortlist output for UI consumption.
	Exports: `formatShortlist`.
	Maintenance Triggers: Output type change, addition/removal of display field.

### Hooks
- `hooks/useApiFetcher.ts` – Generic wrapper for API calls exposing `{ data, error, loading, retry }`.
	Exports: `useApiFetcher`.
	Maintenance Triggers: State shape change, retry/backoff strategy.

### Config
- `config/settings.ts` – Central env + feature flag access (single read per module).
	Exports: `getSettings` (or config object), typed settings interface.
	Maintenance Triggers: New env vars, flag rename, validation changes.

### Utilities
- `utils.ts` – Generic helpers (pure, reusable) not domain-specific.
	Exports: various small pure functions (ensure names stay descriptive).
	Maintenance Triggers: Helper count growth > threshold (split), new non-pure logic (move out).

### Formatters
- `formatters/string.ts` – String normalization, casing, truncation utilities for reuse.
	Exports: `normalizeWhitespace`, `truncate`, `toTitleCase`, etc.
	Maintenance Triggers: New formatting rule with edge cases, performance change.

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
