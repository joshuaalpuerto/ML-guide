# Phase 0 Research: Preference Gathering Flow

**Date**: 2025-10-19  
**Spec**: ./spec.md  
**Plan**: ./plan.md

## Decisions & Rationale

### D1: Company Stage Optional
- **Decision**: User may proceed without selecting any Company Stage.
- **Rationale**: Reduces friction for users unfamiliar with funding terminology; preserves inclusivity.
- **Alternatives Considered**:
  - Mandatory selection: Increases completeness but adds cognitive load.
  - Soft warning prompt: Adds extra step; optional choice already minimal friction.

### D2: Immutable Preference Profile Post-Confirmation
- **Decision**: No edits after confirmation in MVP; reset requires session restart.
- **Rationale**: Simplifies state management and prevents downstream inconsistency once evaluation begins.
- **Alternatives Considered**:
  - Allow pre-shortlist reset: Adds UI complexity, modest benefit.
  - Allow anytime edits triggering re-evaluation: High complexity; risk of user confusion.

### D3: Interests Parsing Limits (<=15 tokens, <=40 chars)
- **Decision**: Enforce limits for performance and UI clarity.
- **Rationale**: Prevents unwieldy profile, maintains quick readability and scoring performance.
- **Alternatives Considered**:
  - Higher limits (e.g., 30): Harder to display; diminishing returns for matching.
  - No length limit: Risk of excessively verbose interest tokens.

### D4: Location Conditional Rule Strictness
- **Decision**: If Work Arrangement exactly ['In-Person'], enforce Estonia only.
- **Rationale**: Aligns with product geographic constraint for in-person roles.
- **Alternatives Considered**:
  - Allow EEA + Estonia for in-person: Dilutes specificity; mismatched with stated requirement.
  - Dynamic list of cities: Out of scope for MVP.

### D5: Accessibility Commitment for MultiSelect
- **Decision**: Provide keyboard navigation (Tab, Arrow, Enter/Space) and ARIA attributes.
- **Rationale**: Ensures inclusivity and compliance with basic accessibility expectations.
- **Alternatives Considered**:
  - Minimal clickable-only UI: Faster but excludes keyboard-only users.

## Resolved Unknowns
No outstanding clarifications remain from spec (FR-020, FR-021 decisions incorporated).

## Implementation Impact
- Data model stable: PreferenceDraft & PreferenceProfile unchanged from plan.
- Scoring pipeline can rely on optional companyStages presence.

## Risks & Mitigations
- User confusion about immutability → Add explicit confirmation copy.
- Overly generic interests → Future enhancement: semantic tagging (not now).

## Next Steps
Proceed to Phase 1: produce data-model.md, contracts, quickstart.md.
