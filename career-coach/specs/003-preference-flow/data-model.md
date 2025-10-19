# Data Model: Preference Gathering Flow

**Date**: 2025-10-19  
**Related Spec**: ./spec.md  

## Entities

### 1. PreferenceDraft
Transient working state prior to confirmation.

Fields:
- `workArrangements: string[]` (Allowed values: `Remote`, `Hybrid`, `In-Person`) – MUST contain ≥1.
- `locations: string[]` (Allowed values: `EEA`, `Estonia`)
- `companyStages: string[]` (Allowed values: `Well-funded`, `Likely to IPO`, `Unicorn`) – MAY be empty.
- `interests: string[]` (Normalized tokens; MAY be empty)
- `errors: Record<string, string[]>` (Per-field validation messages; empty arrays if no errors)
- `updatedAt: string` (ISO timestamp of last modification)

Validation Rules:
1. Work Arrangements: length ≥1.
2. Conditional Location Rule: If `workArrangements` exactly equals `['In-Person']` then `locations` MUST equal `['Estonia']`.
3. Locations: length ≥1 (implicit requirement from flow; user must choose at least one location – assumption). If conditional rule triggers, enforce Estonia only.
4. Interests: length ≤15; each token length 1–40; tokens trimmed; duplicates removed preserving first occurrence.
5. Company Stages: any subset (0–3); duplicates removed if encountered.
6. Unknown values: reject with error recorded under respective field.

State Transitions:
- Draft Initialized → (user inputs) → Validated Draft → (user triggers Review) → Reviewed Draft → (user confirms) → PreferenceProfile.
- Errors present prevent transition to Reviewed Draft until resolution.

### 2. PreferenceProfile
Immutable confirmed preferences consumed by evaluation & shortlist logic.

Fields:
- `workArrangements: string[]` (≥1)
- `locations: string[]` (≥1; conditional rule satisfied)
- `companyStages: string[]` (0–3)
- `interests: string[]` (0–15; unique; normalized)
- `confirmedAt: string` (ISO timestamp)
- `version: number` (Starts at 1; increments only if future enhancement introduces edit flow)

Integrity Constraints:
1. All validation rules of PreferenceDraft re-applied at confirmation.
2. Once emitted, fields MUST NOT change (immutability guarantee).
3. Empty `companyStages` acceptable; other arrays MUST NOT be empty (`workArrangements`, `locations`).

### 3. PreferenceValidationResult (Helper)
Fields:
- `valid: boolean`
- `errors: Record<string, string[]>`
- `normalized: Partial<PreferenceDraft>` (Normalized subsets)

Usage: Produced by normalization/validation function before updating draft state.

## Derived / Computed Values
- `isInPersonOnly`: boolean = (`workArrangements.length === 1 && workArrangements[0] === 'In-Person'`).
- `canIncludeEEA`: boolean = !`isInPersonOnly`.
- `excessInterests`: string[] (tokens beyond limit; used for user notice messaging).

## Validation Flow
1. Raw user input (selections + interests string) → Normalization (trim, split, dedupe) → Basic semantic validation (allowed values, length rules) → Conditional rule enforcement → Error aggregation.
2. If no errors: update `PreferenceDraft` and allow transition to Review.
3. On confirmation: re-run validation; if still clean produce `PreferenceProfile`.

## Error Codes (Conceptual)
- `REQUIRED`: Missing required selection.
- `INVALID_VALUE`: Token not in allowed values.
- `CONDITIONAL_CONFLICT`: Location violates in-person rule.
- `TOKEN_TOO_LONG`: Interest token length > 40.
- `TOKEN_LIMIT_EXCEEDED`: Interests exceed max allowed.

## Assumptions
- Location requires ≥1 selection (EEA or Estonia) for meaningful downstream matching.
- Interests optional; empty list is valid.

## Future Extensions (Not Implemented Now)
- Add salary range fields.
- Add preferred company size bracket.
- Add remote time zone constraints.
