### Research: Current Onboarding, CV Upload, Preference Input, and Chat Interface Integration

#### Research Question
How are CV upload, preference input, and chat interface currently implemented and connected in the codebase, and how are these features organized in the onboarding flow?

---

## Summary

- The onboarding flow is currently implemented as a single-page experience, primarily orchestrated in the main chat page (`src/app/(chat)/page.tsx`), where users upload their CV, input preferences, and interact with the chat interface for job search.
- All features are grouped by function: CV upload, preference input, and chat interface each have dedicated UI components and supporting business logic, organized in their respective directories.
- The onboarding process uses a multi-step pattern, with preference input steps managed by a fixed sequence and state tracking in business logic modules.
- UI components for each step are modularized, and orchestration of the flow is handled in the chat interface, sequencing the steps and updating state as the user progresses.

---

## Detailed Findings

### 1. File Locations and Organization

- **Onboarding Logic:**  
  - `src/app/onboarding/` — Contains onboarding-related routes and logic, with subfolders for each step (`chat/`, `cv-upload/`, `preferences/`, `review/`, `upload/`).
- **CV Upload:**  
  - `src/app/api/upload/route.ts` — API endpoint for CV upload and parsing.
  - `src/components/upload/FileUpload.tsx` — Drag & drop CV upload UI component.
  - `src/libs/files/cv-uploader.ts` — CV uploader logic.
  - `src/libs/parsing/cv-parser.ts` — CV parsing logic.
- **Preference Input:**  
  - UI:  
    - `src/components/preferences/PreferenceStepCompanyStage.tsx`
    - `src/components/preferences/PreferenceStepLocation.tsx`
    - `src/components/preferences/PreferenceStepWorkArrangement.tsx`
    - `src/components/preferences/PreferenceValidationMessages.tsx`
  - Business Logic:  
    - `src/libs/preferences/preference-collector.ts`
    - `src/libs/preferences/preference-normalizer.ts`
    - `src/libs/preferences/preference-store.ts`
    - `src/libs/preferences/constants.ts`, `errors.ts`, `events.ts`
- **Chat Interface:**  
  - `src/app/(chat)/page.tsx` — Main chat page, integrates CV upload and chat interface.
  - `src/components/chat/ChatInterface.tsx` — Renders chat message list and input, manages chat logic and preference flow.
  - `src/components/chat/MessageBubble.tsx` — Styled message bubble for chat.
  - `src/libs/chat/conversation-handler.ts` — Orchestrates preference flow in chat.

### 2. Multi-Step Onboarding Patterns

- **Business Logic:**  
  - `src/libs/preferences/preference-collector.ts` defines a fixed step sequence for onboarding:
    ```typescript
    const steps: PreferenceStepKey[] = ['workArrangements', 'locations', 'companyStages'];
    ```
  - Functions for starting the flow, updating steps, and advancing:
    ```typescript
    export function startPreferencesFlow() { ... }
    export function updatePreferenceStep(step: PreferenceStepKey, values: string[]) { ... }
    export function advancePreferenceStep() { ... }
    ```
  - State management for draft and confirmed profiles in `preference-store.ts`:
    ```typescript
    let draft: PreferenceDraft | null = null;
    export function initDraft(): PreferenceDraft { ... }
    export function updateDraft(update: Partial<PreferenceDraft>): PreferenceDraft { ... }
    export function confirmProfile(): PreferenceProfile { ... }
    ```

- **UI Components:**  
  - Each step is a dedicated React component:
    - `PreferenceStepWorkArrangement.tsx`
    - `PreferenceStepLocation.tsx`
    - `PreferenceStepCompanyStage.tsx`
  - Components use shared UI elements (e.g., `MultiSelect`) and accept values, change handlers, and error props.

- **Orchestration in Chat Interface:**  
  - The chat page imports and renders step components in order, manages local state for step values, and calls business logic functions to update and advance steps.

### 3. Type Definitions

- `src/types/user-data.ts` — User CV and preference types.
- `src/types/company-data.ts` — Company data types.

### 4. Documentation

- `src/components/CATALOG.md` — Lists and describes UI components for chat, upload, and preferences.
- `src/libs/CATALOG.md` — Lists and describes library modules for chat, CV upload, and preferences.

---

## Code References

- `src/app/(chat)/page.tsx` — Main orchestration of onboarding flow.
- `src/components/upload/FileUpload.tsx` — CV upload UI.
- `src/components/preferences/PreferenceStepWorkArrangement.tsx`, `PreferenceStepLocation.tsx`, `PreferenceStepCompanyStage.tsx` — Step UI components.
- `src/libs/preferences/preference-collector.ts`, `preference-store.ts` — Multi-step logic and state management.
- `src/libs/chat/conversation-handler.ts` — Chat orchestration.

---

## Architecture Documentation

- **Feature-based organization:** Each major feature (CV upload, preferences, chat) is separated into its own directory for UI and business logic.
- **Multi-step onboarding:** Implemented via a fixed step array, state tracking, and step-wise validation in business logic.
- **Modular UI:** Each onboarding step is a dedicated React component, using shared UI elements.
- **State management:** Draft and confirmed profile states are managed centrally.
- **Orchestration:** The chat interface sequences steps and updates state as the user progresses.

---

## Historical Context

- No specific historical research documents found in `tasks/` related to onboarding flow separation.

---

## Related Research

- No related research documents found.

---

## Open Questions

- None at this time. If you have follow-up questions about specific implementation details or want to explore how to separate these steps, please specify.