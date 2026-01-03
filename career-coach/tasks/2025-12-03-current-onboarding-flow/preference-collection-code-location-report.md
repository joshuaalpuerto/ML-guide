# Preference Collection Code Location Report

**Generated:** December 3, 2025  
**Purpose:** Document all files and components related to user preference collection in the career-coach codebase.

---

## Overview

The preference collection system is organized across multiple layers:
- **UI Components** (`src/components/preferences/`) - Presentation layer for preference inputs
- **Business Logic** (`src/libs/preferences/`) - Domain logic for validation, storage, and events
- **Type Definitions** (`src/types/user-data.ts`) - TypeScript interfaces for preference data
- **Integration** (`src/libs/chat/conversation-handler.ts`) - Orchestration logic that connects UI to domain
- **UI Primitives** (`src/components/ui/MultiSelect.tsx`) - Reusable input controls

---

## 1. Preference UI Components

**Location:** `src/components/preferences/`

### 1.1 `PreferenceStepWorkArrangement.tsx`
- **Full Path:** `/Users/joshuacalpuerto/projects/ML-guide/career-coach/src/components/preferences/PreferenceStepWorkArrangement.tsx`
- **Purpose:** UI component for collecting work arrangement preferences (Remote, Hybrid, In-Person)
- **Key Features:**
  - Uses `MultiSelect` component for input
  - Imports options from `@/libs/preferences/constants` (`WORK_ARRANGEMENT_OPTIONS`)
  - Accepts `values`, `onChange`, and `errors` props
  - Displays validation errors when present
- **Dependencies:**
  - `MultiSelect` from `../ui/MultiSelect`
  - `WORK_ARRANGEMENT_OPTIONS` from `@/libs/preferences/constants`

### 1.2 `PreferenceStepLocation.tsx`
- **Full Path:** `/Users/joshuacalpuerto/projects/ML-guide/career-coach/src/components/preferences/PreferenceStepLocation.tsx`
- **Purpose:** UI component for collecting location preferences (EEA, Estonia)
- **Key Features:**
  - Uses `MultiSelect` component for input
  - Imports options from `@/libs/preferences/constants` (`LOCATION_OPTIONS`)
  - Supports conditional logic: when `inPersonOnly` prop is true, only shows Estonia option
  - Accepts `values`, `onChange`, `errors`, and `inPersonOnly` props
  - Displays validation errors when present
- **Dependencies:**
  - `MultiSelect` from `../ui/MultiSelect`
  - `LOCATION_OPTIONS` from `@/libs/preferences/constants`

### 1.3 `PreferenceStepCompanyStage.tsx`
- **Full Path:** `/Users/joshuacalpuerto/projects/ML-guide/career-coach/src/components/preferences/PreferenceStepCompanyStage.tsx`
- **Purpose:** UI component for collecting company stage preferences (Well-funded, Likely to IPO, Unicorn)
- **Key Features:**
  - Uses `MultiSelect` component for input
  - Imports options from `@/libs/preferences/constants` (`COMPANY_STAGE_OPTIONS`)
  - Accepts `values` and `onChange` props (no errors - this is optional field)
  - Marked as optional in UI
- **Dependencies:**
  - `MultiSelect` from `../ui/MultiSelect`
  - `COMPANY_STAGE_OPTIONS` from `@/libs/preferences/constants`

### 1.4 `PreferenceValidationMessages.tsx`
- **Full Path:** `/Users/joshuacalpuerto/projects/ML-guide/career-coach/src/components/preferences/PreferenceValidationMessages.tsx`
- **Purpose:** Displays validation errors for preference inputs
- **Key Features:**
  - Accepts `errors` prop (array of strings)
  - Returns null when no errors present
  - Uses accessible markup with `role="alert"` and `aria-live="polite"`
  - Renders errors as an unordered list
- **Dependencies:** None (pure presentational component)

---

## 2. Preference Business Logic

**Location:** `src/libs/preferences/`

### 2.1 `preference-store.ts`
- **Full Path:** `/Users/joshuacalpuerto/projects/ML-guide/career-coach/src/libs/preferences/preference-store.ts`
- **Purpose:** In-memory state management for preference draft and confirmed profile
- **Key Exports:**
  - `initDraft()`: PreferenceDraft - Creates new empty draft
  - `getDraft()`: PreferenceDraft | null - Returns current draft
  - `getProfile()`: PreferenceProfile | null - Returns confirmed profile
  - `updateDraft(update: Partial<PreferenceDraft>)`: PreferenceDraft - Updates draft with partial data
  - `confirmProfile()`: PreferenceProfile - Confirms draft and creates profile
- **State Variables:**
  - `draft`: PreferenceDraft | null - Current working draft
  - `profile`: PreferenceProfile | null - Confirmed preference profile
- **Side Effects:**
  - Calls `emitDraftProgress()` after each update to track progress
  - Sets `updatedAt` timestamp on draft updates
  - Sets `confirmedAt` timestamp and version number on profile confirmation
- **Dependencies:**
  - `PreferenceDraft`, `PreferenceProfile` from `../../types/user-data`
  - `emitDraftProgress` from `./analytics`

### 2.2 `preference-normalizer.ts`
- **Full Path:** `/Users/joshuacalpuerto/projects/ML-guide/career-coach/src/libs/preferences/preference-normalizer.ts`
- **Purpose:** Validation and normalization of preference data
- **Key Exports:**
  - `validateAndNormalizeDraft(partial: Partial<PreferenceDraft>)`: PreferenceValidationResult
    - Validates required fields (workArrangements, locations)
    - Filters invalid values against allowed options
    - Checks conditional rules (in-person + EEA conflict)
    - Deduplicates company stages
    - Returns validation result with errors and normalized data
  - `enforceConditionalLocationRule(workArrangements: string[], locations: string[])`: string[]
    - When only "In-Person" is selected, filters locations to only Estonia
- **Validation Rules:**
  - Work arrangements: Required, must be from `WORK_ARRANGEMENT_OPTIONS`
  - Locations: Required, must be from `LOCATION_OPTIONS`
  - Conditional: If only "In-Person" selected and "EEA" included, adds `CONDITIONAL_CONFLICT` error
  - Company stages: Optional, filters to valid options and removes duplicates
  - Interests: Not yet implemented (mentioned as US2 pending)
- **Dependencies:**
  - `PreferenceDraft`, `PreferenceValidationResult` from `../../types/user-data`
  - `WORK_ARRANGEMENT_OPTIONS`, `LOCATION_OPTIONS`, `COMPANY_STAGE_OPTIONS` from `./constants`
  - `PreferenceErrorCodes` from `./errors`

### 2.3 `preference-collector.ts`
- **Full Path:** `/Users/joshuacalpuerto/projects/ML-guide/career-coach/src/libs/preferences/preference-collector.ts`
- **Purpose:** Placeholder for preference collector logic
- **Current State:** Empty stub with comment "Placeholder for preference collector logic"
- **Future Purpose:** Sequential flow collection logic (pending implementation)

### 2.4 `constants.ts`
- **Full Path:** `/Users/joshuacalpuerto/projects/ML-guide/career-coach/src/libs/preferences/constants.ts`
- **Purpose:** Canonical option sets and limits for preference inputs
- **Key Exports:**
  - `WORK_ARRANGEMENT_OPTIONS`: ['Remote', 'Hybrid', 'In-Person'] as const
  - `LOCATION_OPTIONS`: ['EEA', 'Estonia'] as const
  - `COMPANY_STAGE_OPTIONS`: ['Well-funded', 'Likely to IPO', 'Unicorn'] as const
  - `MAX_INTERESTS`: 15 (number)
  - `MAX_INTEREST_LENGTH`: 40 (number)
- **Usage:** Referenced by UI components and validation logic
- **Maintenance Note:** These are the single source of truth for allowed preference values

### 2.5 `errors.ts`
- **Full Path:** `/Users/joshuacalpuerto/projects/ML-guide/career-coach/src/libs/preferences/errors.ts`
- **Purpose:** Error code enumeration for validation
- **Key Exports:**
  - `PreferenceErrorCodes` object with:
    - `REQUIRED`: 'REQUIRED'
    - `INVALID_VALUE`: 'INVALID_VALUE'
    - `CONDITIONAL_CONFLICT`: 'CONDITIONAL_CONFLICT'
    - `TOKEN_TOO_LONG`: 'TOKEN_TOO_LONG'
    - `TOKEN_LIMIT_EXCEEDED`: 'TOKEN_LIMIT_EXCEEDED'
  - `PreferenceErrorCode` type (union of all error code values)
- **Usage:** Used by validation logic to create consistent error messages

### 2.6 `events.ts`
- **Full Path:** `/Users/joshuacalpuerto/projects/ML-guide/career-coach/src/libs/preferences/events.ts`
- **Purpose:** Event name constants for preference flow analytics
- **Key Exports:**
  - `PREFERENCES_EVENTS` object with:
    - `STARTED`: 'preferences_started'
    - `STEP_COMPLETED`: 'preferences_step_completed'
    - `REVIEW_OPENED`: 'preferences_review_opened'
    - `CONFIRMED`: 'preferences_confirmed'
    - `ABANDONED`: 'preferences_abandoned'
  - `PreferenceEventKey` type
- **Usage:** Used by analytics module for consistent event naming

### 2.7 `analytics.ts`
- **Full Path:** `/Users/joshuacalpuerto/projects/ML-guide/career-coach/src/libs/preferences/analytics.ts`
- **Purpose:** Emits preference lifecycle and progress instrumentation events
- **Key Exports:**
  - `emitPreferenceEvent(event: string, payload?: Record<string, unknown>)` - Base emitter
  - `emitStarted()` - Emits preferences_started
  - `emitStepCompleted(step: string)` - Emits preferences_step_completed
  - `emitReviewOpened()` - Emits preferences_review_opened
  - `emitConfirmed(summary: {...})` - Emits preferences_confirmed with counts
  - `emitAbandoned(reason?: string)` - Emits preferences_abandoned
  - `emitDraftProgress(counts: {...})` - Emits preferences_draft_progress
- **Implementation:** Currently uses console.debug for debugging (real integration pending)
- **Dependencies:**
  - `PREFERENCES_EVENTS` from `./events`

### 2.8 `index.ts`
- **Full Path:** `/Users/joshuacalpuerto/projects/ML-guide/career-coach/src/libs/preferences/index.ts`
- **Purpose:** Barrel export for preferences module
- **Exports:** Re-exports all public APIs from:
  - `./constants`
  - `./events`
  - `./errors`
  - `./preference-store`
  - `./preference-normalizer`

### 2.9 `README.md`
- **Full Path:** `/Users/joshuacalpuerto/projects/ML-guide/career-coach/src/libs/preferences/README.md`
- **Purpose:** Documentation for preferences module (Phase 1-2 scaffold)
- **Contents:**
  - Overview of module purpose
  - List of introduced files and their roles
  - Note about types location (`src/types/user-data.ts`)
  - Forward reference to future implementation stories

---

## 3. Preference Integration & Orchestration

### 3.1 `conversation-handler.ts`
- **Full Path:** `/Users/joshuacalpuerto/projects/ML-guide/career-coach/src/libs/chat/conversation-handler.ts`
- **Purpose:** Orchestrates preference flow within chat context
- **Key Exports:**
  - `startPreferencesFlow()` - Initializes preference collection flow
  - `getPreferenceState()`: PreferenceState - Returns current flow state
  - `updatePreferenceStep(step: PreferenceStepKey, values: string[])` - Updates a preference field
  - `advancePreferenceStep()` - Validates and moves to next step
- **Internal Types:**
  - `PreferenceStepKey`: 'workArrangements' | 'locations' | 'companyStages'
  - `PreferenceState` interface with:
    - `active`: boolean
    - `currentStepIndex`: number
    - `steps`: PreferenceStepKey[]
    - `draft`: ReturnType<typeof getDraft>
    - `errors`: Record<string, string[]>
    - `completed`: boolean
- **Flow Logic:**
  - Manages step progression (workArrangements → locations → companyStages)
  - Applies conditional location rule when work arrangement changes to In-Person only
  - Validates current step before allowing advancement
  - Emits analytics events at key transitions
  - Determines completion based on validation state
- **Dependencies:**
  - `initDraft`, `updateDraft`, `getDraft` from `../preferences/preference-store`
  - `validateAndNormalizeDraft`, `enforceConditionalLocationRule` from `../preferences/preference-normalizer`
  - `emitStarted`, `emitStepCompleted`, `emitConfirmed` from `../preferences/analytics`

---

## 4. Type Definitions

### 4.1 `user-data.ts`
- **Full Path:** `/Users/joshuacalpuerto/projects/ML-guide/career-coach/src/types/user-data.ts`
- **Purpose:** TypeScript interfaces and schemas for user CV data and preferences
- **Preference-Related Types:**
  - `PreferenceProfile` type with fields:
    - `workArrangements`: string[]
    - `locations`: string[]
    - `companyStages`: string[]
    - `interests`: string (note: single string, not array)
    - `valid`: boolean

**IMPORTANT FINDING:** The code references `PreferenceDraft` and `PreferenceValidationResult` types that are NOT currently defined in this file:
- `preference-store.ts` imports `PreferenceDraft` and `PreferenceProfile` from this file
- `preference-normalizer.ts` imports `PreferenceDraft` and `PreferenceValidationResult` from this file
- These types are used throughout the preference logic but **do not exist** in `user-data.ts`

**Missing Type Definitions:**
1. `PreferenceDraft` - Should include fields like:
   - workArrangements, locations, companyStages, interests
   - errors object
   - updatedAt timestamp
   
2. `PreferenceValidationResult` - Should include:
   - valid: boolean
   - errors: Record<string, string[]>
   - normalized: Partial<PreferenceDraft>

---

## 5. UI Primitives

### 5.1 `MultiSelect.tsx`
- **Full Path:** `/Users/joshuacalpuerto/projects/ML-guide/career-coach/src/components/ui/MultiSelect.tsx`
- **Purpose:** Reusable multi-select dropdown component
- **Key Features:**
  - Keyboard accessible (Enter, Space to toggle, Escape to close)
  - Visual feedback for selected items (checkmarks)
  - Customizable via props
  - Dark mode support
  - Scrollable option list (max-h-48)
  - Accessible markup (ARIA roles: listbox, option)
- **Props Interface:**
  - `label`: string - Display label
  - `options`: string[] - Available options
  - `selected`: string[] - Currently selected values
  - `onChange`: (values: string[]) => void - Callback on selection change
  - `disabled?`: boolean - Optional disabled state
- **Usage:** Used by all three preference step components

---

## 6. Integration Points

### 6.1 `ChatInterface.tsx`
- **Full Path:** `/Users/joshuacalpuerto/projects/ML-guide/career-coach/src/components/chat/ChatInterface.tsx`
- **Purpose:** Main chat interface that integrates preference collection UI
- **Preference Integration:**
  - Imports all three preference step components
  - Imports `PreferenceValidationMessages` component
  - Imports conversation handler functions (`startPreferencesFlow`, `getPreferenceState`, `updatePreferenceStep`)
  - Maintains local state for preference values using `PreferenceProfile` type
  - Renders preference selection panel when `!preference.valid`
  - Disables chat input while preference flow is active (line 148: `const chatDisabled = prefState.active`)
  - Displays conditional location options based on work arrangement selection
- **Preference Panel Structure:**
  - Three sections: Work Arrangement, Location, Company Stage (optional)
  - Each section has a heading and corresponding preference step component
  - Shows helper text explaining chat is disabled during preference selection
- **State Management:**
  - Uses local React state for preference object
  - Updates state via `setPreference` callback
  - Checks `inPersonOnly` condition for location filtering

---

## 7. Component Connections & Data Flow

### 7.1 Data Flow Overview
```
User Input (UI Components)
    ↓
Local State (ChatInterface useState)
    ↓
Conversation Handler (orchestration logic)
    ↓
Preference Store (in-memory state)
    ↓
Preference Normalizer (validation)
    ↓
Analytics Emitter (tracking)
```

### 7.2 Validation Flow
```
updatePreferenceStep()
    → getDraft()
    → updateDraft()
    → validateAndNormalizeDraft()
    → enforceConditionalLocationRule() [if needed]
    → emitDraftProgress()
```

### 7.3 Component Dependencies
- **UI Components** depend on:
  - `MultiSelect` primitive
  - Constants from `@/libs/preferences/constants`
  
- **Conversation Handler** depends on:
  - All preference store functions
  - Validation functions from normalizer
  - Analytics emitters
  
- **Preference Store** depends on:
  - Type definitions from `user-data.ts`
  - Analytics emitter for progress tracking
  
- **Preference Normalizer** depends on:
  - Type definitions from `user-data.ts`
  - Constants for valid option sets
  - Error codes for validation messages

---

## 8. File Inventory Summary

### By Directory

**`src/components/preferences/`** (4 files)
- PreferenceStepWorkArrangement.tsx
- PreferenceStepLocation.tsx
- PreferenceStepCompanyStage.tsx
- PreferenceValidationMessages.tsx

**`src/libs/preferences/`** (9 files)
- preference-store.ts
- preference-normalizer.ts
- preference-collector.ts (stub)
- constants.ts
- errors.ts
- events.ts
- analytics.ts
- index.ts (barrel export)
- README.md (documentation)

**`src/libs/chat/`** (1 file with preference logic)
- conversation-handler.ts

**`src/types/`** (1 file with preference types)
- user-data.ts (partial - missing PreferenceDraft and PreferenceValidationResult)

**`src/components/ui/`** (1 shared component)
- MultiSelect.tsx

**`src/components/chat/`** (1 integration file)
- ChatInterface.tsx

### By Purpose

**Presentation/UI:** 5 files
- 4 preference step components
- 1 shared MultiSelect component

**Business Logic:** 7 files
- Store, normalizer, analytics, constants, errors, events, collector (stub)

**Orchestration:** 1 file
- conversation-handler.ts

**Type Definitions:** 1 file (incomplete)
- user-data.ts

**Integration:** 1 file
- ChatInterface.tsx

**Documentation:** 1 file
- preferences/README.md

---

## 9. Notable Patterns & Conventions

### 9.1 Naming Conventions
- Preference step components: `PreferenceStep<FieldName>.tsx`
- Preference domain logic: `preference-<purpose>.ts`
- Constants in SCREAMING_SNAKE_CASE with `_OPTIONS` suffix
- Event constants in lowercase with underscores

### 9.2 Import Patterns
- UI components use `@/` path alias for imports
- Relative imports within same directory
- Barrel exports through `index.ts` for clean public API

### 9.3 Validation Strategy
- Validation happens in normalizer module
- Returns structured result with errors keyed by field name
- Supports conditional validation rules
- Filters invalid values rather than rejecting entire input

### 9.4 State Management
- In-memory state (not persisted)
- Separate draft and confirmed profile concepts
- Timestamps tracked for draft updates and profile confirmation
- Version number on profile (currently hardcoded to 1)

### 9.5 Analytics Integration
- Separate analytics module for instrumentation
- Event constants defined separately from implementation
- Lightweight console-based implementation (production integration pending)
- Progress tracking on every draft update

---

## 10. Known Issues & Gaps

### 10.1 Type Definition Gaps
- **CRITICAL:** `PreferenceDraft` type is referenced but not defined
- **CRITICAL:** `PreferenceValidationResult` type is referenced but not defined
- Both types are imported and used throughout preference logic but missing from `user-data.ts`

### 10.2 Incomplete Implementations
- `preference-collector.ts` is an empty stub
- Interests field validation not implemented (mentioned as "US2 pending")
- Analytics uses console.debug instead of real analytics integration

### 10.3 Data Type Inconsistencies
- `PreferenceProfile.interests` is defined as `string` (single value)
- But draft structure suggests it should be `string[]` (array)
- Store initializes interests as empty array but type says string

### 10.4 Missing Features
- No persistence layer (all in-memory)
- No review/confirmation step implemented yet (referenced in events)
- No abandon flow handling (event exists but not triggered)
- No interests parsing or collection UI

---

## 11. Future Extension Points

Based on code comments and structure:

### 11.1 Interests Collection (US2)
- Interest parsing logic to be added in normalizer
- UI for interest input (not yet created)
- Validation rules for token length and limit

### 11.2 Review & Confirmation
- Review step UI (referenced in events)
- Confirmation mechanism (store has `confirmProfile()` but not called from UI)

### 11.3 Persistence
- Backend API integration for saving preferences
- Profile versioning support (structure exists)

### 11.4 Additional Preference Fields
- Framework appears extensible for new preference types
- Step-based approach supports adding new steps

---

## Document Metadata

**Total Files Documented:** 15 core files + 1 integration file
**Lines of Code (estimated):** ~800-1000 lines across preference system
**Last Updated:** December 3, 2025
**Codebase State:** Phase 1-2 implementation (per README.md)

---

**End of Report**
