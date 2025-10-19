# Preferences Module

Phase 1–2 scaffold for Preference Gathering Flow.

Introduced:
* `events.ts` – analytics event constants.
* Preference types in `src/types/user-data.ts` (PreferenceDraft, PreferenceProfile, PreferenceValidationResult).
* `constants.ts` – option sets & limits.
* `preference-normalizer.ts` – validation skeleton.
* `preference-store.ts` – in-memory draft/profile management.
* `errors.ts` – error code enumeration.
* `analytics.ts` – simple debug emitter utilities.
* `index.ts` – barrel exports.

Next Stories will implement full validation logic, UI components, interests parsing, and review/confirmation steps.

