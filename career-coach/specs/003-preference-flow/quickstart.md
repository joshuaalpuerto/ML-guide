# Quickstart: Implement Preference Gathering Flow

## Sequence Overview
1. Extend types (`src/types/user-data.ts`) with `PreferenceDraft` & `PreferenceProfile` interfaces.
2. Implement normalization & validation module (`src/libs/preferences/preference-normalizer.ts`).
3. Implement preference draft store utilities (`src/libs/preferences/preference-store.ts`).
4. Build UI components:
   - `MultiSelect` (generic) under `src/components/ui/MultiSelect.tsx`.
   - `InterestsInput` under `src/components/preferences/InterestsInput.tsx`.
5. Integrate steps into conversation flow (`src/libs/preferences/preference-collector.ts` orchestrating states) or extend existing conversation handler.
6. Add review component summarizing selections.
7. Add confirmation action emitting final `PreferenceProfile` object.
8. Wire emission to trigger company evaluation pipeline start.
9. Add unit tests + component interaction tests.
10. Instrument analytics events.

## Data Contracts
Refer to `contracts/preferences.yaml` for confirmation endpoint shape (if server persistence required later).

## Validation Rules Recap
- At least one Work Arrangement.
- Conditional location enforcement for In-Person only.
- Interests limits: ≤15 tokens, each ≤40 chars, dedupe.
- Company Stage optional.

## Testing Checklist
- Normalizer: duplicates removed, overflow interests truncated, overlength tokens flagged.
- Conditional rule: auto-removal of EEA when switching to In-Person only.
- Review step immutability post-confirmation.
- MultiSelect keyboard navigation (focus ring, Enter/Space toggles selection, Escape closes).

## Analytics Events (names)
- `preferences_started`
- `preferences_step_completed` (payload: step id)
- `preferences_review_opened`
- `preferences_confirmed`
- `preferences_abandoned`

## Edge Case Handling
- Empty interests accepted.
- Comma-only input yields empty list.
- Switching from multi arrangements to only In-Person triggers location pruning.

## Rollback Strategy
If flow causes increased abandonment (>25%), enable temporary bypass: provide “Skip preference setup” fallback (future flag).
