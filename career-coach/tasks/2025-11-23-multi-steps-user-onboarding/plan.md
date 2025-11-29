# Simplified Onboarding Flow Implementation Plan

## Overview

Simplify the onboarding flow by consolidating all preference steps into a single page (`onboarding/preferences`) and including CV data in the React Context (`PreferenceContext`). Remove the review page entirely. The context will hold the current preference values (work arrangements, locations, company stages) and CV data, exposing simple setters and a completion state.

## Current State Analysis

- `src/app/(chat)/page.tsx` currently controls CV upload then renders `ChatInterface`.
- Preference business logic is currently implemented as module-level state in `src/libs/preferences/preference-store.ts` and `src/libs/chat/conversation-handler.ts`.
- There are UI components for preference steps in `src/components/preferences/` that can be reused.
- The existing code emits analytics and tracks a draft lifecycle; the updated plan will not use those analytics events or draft-confirm semantics.

## Desired End State

- Separate route pages for onboarding:
  - `onboarding/cv-upload`
  - `onboarding/preferences`
- A React Context provider `PreferenceContext` that stores current preference values, CV data, and step index in-memory, exposing setters and navigation helpers.
- No draft lifecycle object and no analytics/event emissions.

## What We're NOT Doing

- No server-side persistence or database changes.
- No analytics instrumentation or retaining existing analytics calls.
- No change to the existing preference UI components beyond wiring them to context.

## Implementation Approach

Implement a small React Context that is the single source of truth for preference values and CV data at runtime. Pages read and write the context. Use Next.js App Router pages for each step so URLs are bookmarkable and navigation is simple.

### Key Files To Add

- `src/libs/preferences/PreferenceContext.tsx` (new)
- `src/app/onboarding/cv-upload/page.tsx` (new)
- `src/app/onboarding/preferences/page.tsx` (new)
- Update `src/app/(chat)/page.tsx` to direct to `onboarding/cv-upload` when onboarding is not completed.

### PreferenceContext sketch

```tsx
import React, { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

type PreferenceState = {
  workArrangements: string[];
  locations: string[];
  companyStages: string[];
  cvData: File | null;
  stepIndex: number; // 0..1
  setWorkArrangements: (v: string[]) => void;
  setLocations: (v: string[]) => void;
  setCompanyStages: (v: string[]) => void;
  setCvData: (file: File | null) => void;
  nextStep: () => void;
  prevStep: () => void;
  reset: () => void;
};

const PreferenceContext = createContext<PreferenceState | undefined>(undefined);

export function PreferenceProvider({ children }: { children: ReactNode }) {
  const [workArrangements, setWorkArrangements] = useState<string[]>([]);
  const [locations, setLocations] = useState<string[]>([]);
  const [companyStages, setCompanyStages] = useState<string[]>([]);
  const [cvData, setCvData] = useState<File | null>(null);
  const [stepIndex, setStepIndex] = useState(0);

  const nextStep = () => setStepIndex((s) => Math.min(s + 1, 1));
  const prevStep = () => setStepIndex((s) => Math.max(s - 1, 0));
  const reset = () => {
    setWorkArrangements([]);
    setLocations([]);
    setCompanyStages([]);
    setCvData(null);
    setStepIndex(0);
  };

  return (
    <PreferenceContext.Provider value={{ workArrangements, locations, companyStages, cvData, stepIndex, setWorkArrangements, setLocations, setCompanyStages, setCvData, nextStep, prevStep, reset }}>
      {children}
    </PreferenceContext.Provider>
  );
}

export const usePreferences = () => {
  const ctx = useContext(PreferenceContext);
  if (!ctx) throw new Error('usePreferences must be used inside PreferenceProvider');
  return ctx;
};
```

### Pages behavior

- Each onboarding page is a client component that imports relevant preference UI component and `usePreferences()`.
- On user changes call the relevant setter (e.g., `setWorkArrangements(values)`), then navigate with Next's `useRouter()` to the next page via `router.push('/onboarding/preferences')` or call `nextStep()` and use links.
- `cv-upload` uses existing `FileUpload` and after successful upload navigates to the preferences page.

## Phase 1: Preference Context (1-2 hours)

### Overview
Implement the `PreferenceContext` provider and `usePreferences` hook.

### Changes Required

- Add file: `src/libs/preferences/PreferenceContext.tsx` with the sketch above.
- Export `PreferenceProvider` from the module.

### Success Criteria

- `PreferenceProvider` compiles and can be wrapped in `src/app/layout.tsx` or around onboarding routes.

## Phase 2: Route scaffolding & wiring (2-3 hours)

### Overview
Create route pages and wire UI components to the context.

### Changes Required

- Add the two onboarding page files under `src/app/onboarding/...`.
- Each page imports `usePreferences()` and the appropriate preference step component from `src/components/preferences/`.
- Use `next/navigation`'s `useRouter()` for navigation.

### Success Criteria

- Navigating between pages keeps values in memory via Context.

## Phase 3: Integrate with Chat (1 hour)

### Overview
Make sure `ChatInterface` reads from `usePreferences()` for the final confirmed preferences and that `src/app/(chat)/page.tsx` routes users into onboarding when needed.

### Changes Required

- Wrap the chat/onboarding area with `PreferenceProvider` (for example in `src/app/layout.tsx` or `src/app/(chat)/layout.tsx`).
- Update `src/app/(chat)/page.tsx` to redirect to `/onboarding/cv-upload` if onboarding not done (detect via `stepIndex` or filled values).

### Success Criteria

- Chat sees preference values after onboarding completes.

## Testing Strategy

- Unit tests: mount `PreferenceProvider` and assert setters update the hook values.
- Integration: simulate the flow across pages, assert in-memory values persist across navigation and appear in `ChatInterface`.

## Manual Verification

1. Start dev server: `pnpm dev`
2. Visit `/onboarding/cv-upload` and upload a CV.
3. Complete `preferences` page; verify values persist across navigation.
4. Open Chat; confirm preferences are available.

## References

- `src/components/preferences/*`
- `src/app/(chat)/page.tsx`
