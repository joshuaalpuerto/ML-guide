# Multi-Step Onboarding Flow Implementation Plan

## Overview

Separate the current single-page flow at `src/app/(chat)/page.tsx` into a multi-step onboarding process with dedicated routes for CV upload and preference collection. The implementation will use React Context for global state management and integrate with the existing preference store infrastructure. Users will navigate through `/onboarding/upload` → `/onboarding/preferences` → `/chat`, with the ability to go back and edit at any time.

## Current State Analysis

The application currently implements a single-page conditional rendering flow:

### Key Discoveries:
- **Single state variable controls flow**: `userCVParsedProfile` in `page.tsx:7` toggles between upload UI and chat interface
- **Preferences embedded in ChatInterface**: `ChatInterface.tsx:30-63` renders preference selection panel before chat
- **Preference infrastructure exists but disconnected**: `preference-store.ts`, `preference-normalizer.ts` exist but unused by UI
- **Empty validation logic**: `preference-collector.ts` is a placeholder (line 1: "// Placeholder for preference collector logic")
- **Placeholder onboarding directories exist**: `src/app/onboarding/upload/`, `/preferences/`, `/review/` with no page files
- **Hardcoded demo CV data**: `page.tsx:7-60` contains extensive demo data for development
- **No persistence**: All state is ephemeral local state
- **MessageBubble rendering commented out**: `ChatInterface.tsx:64-68` chat messages not displayed

### Current Flow Pattern:
```
page.tsx (/)
  → if (!userCVParsedProfile) → FileUpload component
  → if (userCVParsedProfile) → ChatInterface component
      → if (!preference.valid) → Preference selection panel
      → if (preference.valid) → Chat enabled (never reached)
```

## Desired End State

A multi-step onboarding flow with proper separation of concerns:

```
OnboardingContext (Global State)
  ├── CV Data (UserCVParsed)
  └── Preference Store Integration

Routes:
  / → Redirect to /onboarding/upload
  /onboarding/upload → Upload and parse CV → Navigate to preferences
  /onboarding/preferences → Collect preferences → Navigate to chat
  /chat → Chat interface with guards (requires CV + preferences)
```

### Verification:
1. User visits root `/` → automatically redirected to `/onboarding/upload`
2. After CV upload → navigates to `/onboarding/preferences`
3. After preference submission (work arrangements + locations required) → navigates to `/chat`
4. Chat page displays messages with MessageBubble components
5. User can click "Edit CV" or "Edit Preferences" to go back
6. Refreshing browser at any point → state lost, redirected to `/onboarding/upload`
7. No hardcoded demo CV data present

## What We're NOT Doing

- ❌ Implementing localStorage or backend persistence (using in-memory React Context only)
- ❌ Creating `/onboarding/review` page (skipping directly to chat)
- ❌ Building visual progress indicators or stepper UI
- ❌ Adding automated tests in this phase
- ❌ Implementing "skip for demo" functionality
- ❌ Making company stages preference mandatory (optional field)
- ❌ Implementing profile editing within the chat interface itself (only navigation links)

## Implementation Approach

The implementation follows a bottom-up approach:
1. Build foundation: Global state management with React Context
2. Create isolated pages: Upload and preferences pages with their own logic
3. Refactor existing: Move chat to dedicated route with guards
4. Clean up: Remove old code and establish proper routing

We'll refactor `preference-store.ts` to work within React Context, ensuring proper React state management while preserving the existing draft/profile pattern.

---

## Phase 1: Create Global State Management with React Context

### Overview
Create a comprehensive onboarding context that manages CV data and integrates with the preference store. This phase establishes the foundation for all subsequent pages by providing centralized state management using React Context API. We'll refactor the existing `preference-store.ts` to work within React Context.

### Changes Required:

#### 1. Create OnboardingContext Provider
**File**: `src/contexts/OnboardingContext.tsx` (new file)
**Changes**: Create new file with context provider

```typescript
'use client';
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { UserCVParsed, PreferenceProfile } from '@/types/user-data';

interface OnboardingContextType {
  // CV State
  cvData: UserCVParsed | null;
  setCVData: (data: UserCVParsed | null) => void;
  
  // Preference State (replacing preference-store.ts closure variables)
  preferences: PreferenceProfile | null;
  setPreferences: (prefs: PreferenceProfile | null) => void;
  
  // Onboarding Status
  isOnboardingComplete: boolean;
  completeOnboarding: () => void;
  resetOnboarding: () => void;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [cvData, setCVData] = useState<UserCVParsed | null>(null);
  const [preferences, setPreferences] = useState<PreferenceProfile | null>(null);
  const [isOnboardingComplete, setIsOnboardingComplete] = useState(false);

  const completeOnboarding = () => {
    setIsOnboardingComplete(true);
  };

  const resetOnboarding = () => {
    setCVData(null);
    setPreferences(null);
    setIsOnboardingComplete(false);
  };

  return (
    <OnboardingContext.Provider
      value={{
        cvData,
        setCVData,
        preferences,
        setPreferences,
        isOnboardingComplete,
        completeOnboarding,
        resetOnboarding,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error('useOnboarding must be used within OnboardingProvider');
  }
  return context;
}
```

#### 2. Update Root Layout to Include Provider
**File**: `src/app/layout.tsx`
**Changes**: Wrap children with OnboardingProvider

```typescript
import { OnboardingProvider } from '@/contexts/OnboardingContext';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <OnboardingProvider>
          {children}
        </OnboardingProvider>
      </body>
    </html>
  );
}
```

#### 3. Refactor Preference Store to Use React State
**File**: `src/libs/preferences/preference-store.ts`
**Changes**: Remove closure variables, make functions work with React state

**Note**: The functions in `preference-store.ts` currently use module-level closure variables (`let draft`, `let profile`). We'll keep these functions but document that they should NOT be called directly from components. Instead, components should use the OnboardingContext. We'll update this file to export helper functions that work with passed state.

```typescript
import { PreferenceProfile } from '@/types/user-data';

// Helper type for draft state (validation errors, etc.)
export interface PreferenceDraft {
  workArrangements: string[];
  locations: string[];
  companyStages: string[];
  interests: string;
  errors: Record<string, string>;
  updatedAt: string;
}

// Create initial draft from empty state
export function createInitialDraft(): PreferenceDraft {
  return {
    workArrangements: [],
    locations: [],
    companyStages: [],
    interests: '',
    errors: {},
    updatedAt: new Date().toISOString(),
  };
}

// Validate draft and return profile if valid
export function validateAndCreateProfile(draft: PreferenceDraft): { valid: boolean; profile?: PreferenceProfile; errors: Record<string, string> } {
  const errors: Record<string, string> = {};
  
  // Work arrangements required
  if (draft.workArrangements.length === 0) {
    errors.workArrangements = 'Please select at least one work arrangement';
  }
  
  // Locations required
  if (draft.locations.length === 0) {
    errors.locations = 'Please select at least one location';
  }
  
  // Company stages optional (no validation)
  
  if (Object.keys(errors).length > 0) {
    return { valid: false, errors };
  }
  
  const profile: PreferenceProfile = {
    workArrangements: draft.workArrangements,
    locations: draft.locations,
    companyStages: draft.companyStages,
    interests: draft.interests,
    valid: true,
  };
  
  return { valid: true, profile, errors: {} };
}

// Update draft with partial changes
export function updateDraft(currentDraft: PreferenceDraft, updates: Partial<PreferenceDraft>): PreferenceDraft {
  return {
    ...currentDraft,
    ...updates,
    updatedAt: new Date().toISOString(),
  };
}
```

#### 4. Implement Preference Collector Validation
**File**: `src/libs/preferences/preference-collector.ts`
**Changes**: Implement validation logic (currently empty placeholder)

```typescript
import { PreferenceDraft } from './preference-store';
import { WORK_ARRANGEMENT_OPTIONS, LOCATION_OPTIONS, COMPANY_STAGE_OPTIONS } from './constants';

export interface ValidationResult {
  valid: boolean;
  errors: Record<string, string>;
}

export function validatePreferences(draft: PreferenceDraft): ValidationResult {
  const errors: Record<string, string> = {};
  
  // Work arrangements validation
  if (draft.workArrangements.length === 0) {
    errors.workArrangements = 'Please select at least one work arrangement';
  } else {
    // Validate all values are in allowed options
    const invalidArrangements = draft.workArrangements.filter(
      arr => !WORK_ARRANGEMENT_OPTIONS.includes(arr as any)
    );
    if (invalidArrangements.length > 0) {
      errors.workArrangements = `Invalid work arrangements: ${invalidArrangements.join(', ')}`;
    }
  }
  
  // Locations validation
  if (draft.locations.length === 0) {
    errors.locations = 'Please select at least one location';
  } else {
    // If only In-Person selected and location is not Estonia, show error
    const inPersonOnly = draft.workArrangements.length === 1 && 
                        draft.workArrangements[0] === 'In-Person';
    if (inPersonOnly && !draft.locations.includes('Estonia')) {
      errors.locations = 'For In-Person work, only Estonia is available';
    }
    
    // Validate all values are in allowed options
    const invalidLocations = draft.locations.filter(
      loc => !LOCATION_OPTIONS.includes(loc as any)
    );
    if (invalidLocations.length > 0) {
      errors.locations = `Invalid locations: ${invalidLocations.join(', ')}`;
    }
  }
  
  // Company stages validation (optional field)
  if (draft.companyStages.length > 0) {
    const invalidStages = draft.companyStages.filter(
      stage => !COMPANY_STAGE_OPTIONS.includes(stage as any)
    );
    if (invalidStages.length > 0) {
      errors.companyStages = `Invalid company stages: ${invalidStages.join(', ')}`;
    }
  }
  
  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export function collectPreferences(draft: PreferenceDraft): ValidationResult & { data?: PreferenceDraft } {
  const validation = validatePreferences(draft);
  
  if (!validation.valid) {
    return validation;
  }
  
  return {
    valid: true,
    errors: {},
    data: draft,
  };
}
```

#### 5. Update Type Definitions
**File**: `src/types/user-data.ts`
**Changes**: Add PreferenceDraft type import (already defined in preference-store.ts, ensure consistency)

```typescript
// Re-export PreferenceDraft from preference-store for convenience
export type { PreferenceDraft } from '@/libs/preferences/preference-store';
```

### Success Criteria:

#### Automated Verification:
- [ ] TypeScript compilation passes: `npm run build`
- [ ] No linting errors: `npm run lint` (if lint script exists)
- [ ] OnboardingContext exports all required functions and types
- [ ] Provider can be imported and rendered without errors
- [ ] useOnboarding hook throws error when used outside provider

#### Manual Verification:
- [ ] Application starts without errors: `npm run dev`
- [ ] Browser console shows no React context errors
- [ ] DevTools React Components tree shows OnboardingProvider wrapping app
- [ ] Calling `useOnboarding()` in a component returns context values
- [ ] Setting CV data via `setCVData()` updates context state
- [ ] Setting preferences via `setPreferences()` updates context state

**Implementation Note**: After completing this phase and all automated verification passes, manually test the context provider in DevTools before proceeding to Phase 2.

---

## Phase 2: Build Upload Page

### Overview
Create the CV upload page at `/onboarding/upload` that handles PDF uploads, displays upload status, and navigates to preferences upon successful parsing. This page will reuse the existing `FileUpload` component but integrate with the new OnboardingContext.

### Changes Required:

#### 1. Create Upload Page
**File**: `src/app/onboarding/upload/page.tsx` (new file)
**Changes**: Create new page with FileUpload integration

```typescript
'use client';
import { useRouter } from 'next/navigation';
import FileUpload from '@/components/upload/FileUpload';
import { useOnboarding } from '@/contexts/OnboardingContext';

export default function UploadPage() {
  const router = useRouter();
  const { setCVData } = useOnboarding();

  const handleUploadSuccess = (info: { filename: string; size: number; profile?: any }) => {
    if (info.profile) {
      setCVData(info.profile);
      // Navigate to preferences page
      router.push('/onboarding/preferences');
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      <div className="w-full max-w-2xl space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold tracking-tight">Welcome to Career Coach</h1>
          <p className="text-sm text-gray-600 dark:text-gray-300 max-w-md mx-auto">
            Let's start by uploading your CV. We'll extract your skills and experience to personalize your job search.
          </p>
        </div>
        
        <div className="border rounded-lg shadow-lg bg-white dark:bg-gray-800 p-8">
          <FileUpload
            onUploaded={handleUploadSuccess}
            onUploadError={(error) => {
              console.error('Upload failed:', error);
              // Error already displayed by FileUpload component
            }}
          />
        </div>
        
        <p className="text-xs text-center text-gray-500 dark:text-gray-400">
          Your file is processed securely and not shared externally.
        </p>
      </div>
    </main>
  );
}
```

#### 2. Create Onboarding Layout (Optional but Recommended)
**File**: `src/app/onboarding/layout.tsx` (new file)
**Changes**: Create layout for consistent onboarding styling

```typescript
import { ReactNode } from 'react';

export default function OnboardingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      {children}
    </div>
  );
}
```

### Success Criteria:

#### Automated Verification:
- [ ] Page builds without TypeScript errors: `npm run build`
- [ ] Route is accessible: `/onboarding/upload` returns 200 status
- [ ] useRouter and useOnboarding imports resolve correctly

#### Manual Verification:
- [ ] Navigate to `http://localhost:3000/onboarding/upload` displays upload page
- [ ] Page title shows "Welcome to Career Coach"
- [ ] FileUpload component renders with drag-and-drop zone
- [ ] Uploading a valid PDF file shows loading state
- [ ] After successful upload, browser navigates to `/onboarding/preferences`
- [ ] CV data is stored in OnboardingContext (verify in React DevTools)
- [ ] Upload errors display appropriate error messages
- [ ] Page styling matches existing design system (dark mode works)

**Implementation Note**: Test the complete upload flow with a real PDF file before proceeding to Phase 3. Verify that the CV parsing API returns valid data and navigation occurs.

---

## Phase 3: Build Preferences Page

### Overview
Create the preferences collection page at `/onboarding/preferences` that allows users to select work arrangements, locations, and optionally company stages. Implement validation requiring work arrangements and locations before allowing navigation to chat. This page integrates with the refactored preference store.

### Changes Required:

#### 1. Create Preferences Page
**File**: `src/app/onboarding/preferences/page.tsx` (new file)
**Changes**: Create new page with preference selection UI

```typescript
'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { PreferenceStepWorkArrangement } from '@/components/preferences/PreferenceStepWorkArrangement';
import { PreferenceStepLocation } from '@/components/preferences/PreferenceStepLocation';
import { PreferenceStepCompanyStage } from '@/components/preferences/PreferenceStepCompanyStage';
import { createInitialDraft, updateDraft, validateAndCreateProfile, PreferenceDraft } from '@/libs/preferences/preference-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';

export default function PreferencesPage() {
  const router = useRouter();
  const { cvData, setPreferences, completeOnboarding } = useOnboarding();
  
  const [draft, setDraft] = useState<PreferenceDraft>(createInitialDraft());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);

  // Redirect to upload if no CV data
  useEffect(() => {
    if (!cvData) {
      router.push('/onboarding/upload');
    }
  }, [cvData, router]);

  const handleWorkArrangementChange = (values: string[]) => {
    setDraft(prev => updateDraft(prev, { workArrangements: values }));
    if (attemptedSubmit) {
      // Clear error on change after submit attempt
      setErrors(prev => ({ ...prev, workArrangements: '' }));
    }
  };

  const handleLocationChange = (values: string[]) => {
    setDraft(prev => updateDraft(prev, { locations: values }));
    if (attemptedSubmit) {
      setErrors(prev => ({ ...prev, locations: '' }));
    }
  };

  const handleCompanyStageChange = (values: string[]) => {
    setDraft(prev => updateDraft(prev, { companyStages: values }));
  };

  const handleSubmit = () => {
    setAttemptedSubmit(true);
    const result = validateAndCreateProfile(draft);
    
    if (!result.valid) {
      setErrors(result.errors);
      return;
    }
    
    // Store preferences and mark onboarding complete
    setPreferences(result.profile!);
    completeOnboarding();
    
    // Navigate to chat
    router.push('/chat');
  };

  const handleBack = () => {
    router.push('/onboarding/upload');
  };

  // Don't render if no CV data (will redirect)
  if (!cvData) {
    return null;
  }

  const inPersonOnly = draft.workArrangements.length === 1 && draft.workArrangements[0] === 'In-Person';

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      <div className="w-full max-w-2xl space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold tracking-tight">Your Preferences</h1>
          <p className="text-sm text-gray-600 dark:text-gray-300 max-w-md mx-auto">
            Help us find the best opportunities by sharing your work preferences.
          </p>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Job Search Preferences</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <h3 className="text-sm font-semibold">
                Work Arrangement <span className="text-red-500">*</span>
              </h3>
              <PreferenceStepWorkArrangement
                values={draft.workArrangements}
                onChange={handleWorkArrangementChange}
              />
              {attemptedSubmit && errors.workArrangements && (
                <p className="text-xs text-red-500">{errors.workArrangements}</p>
              )}
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-semibold">
                Location <span className="text-red-500">*</span>
              </h3>
              <PreferenceStepLocation
                values={draft.locations}
                inPersonOnly={inPersonOnly}
                onChange={handleLocationChange}
              />
              {attemptedSubmit && errors.locations && (
                <p className="text-xs text-red-500">{errors.locations}</p>
              )}
              {inPersonOnly && (
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  Note: In-Person work is only available in Estonia.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-semibold">Company Stage (Optional)</h3>
              <PreferenceStepCompanyStage
                values={draft.companyStages}
                onChange={handleCompanyStageChange}
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={handleBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Upload
            </Button>
            <Button onClick={handleSubmit}>
              Continue to Chat
            </Button>
          </CardFooter>
        </Card>

        <p className="text-xs text-center text-gray-500 dark:text-gray-400">
          * Required fields
        </p>
      </div>
    </main>
  );
}
```

### Success Criteria:

#### Automated Verification:
- [ ] Page builds without TypeScript errors: `npm run build`
- [ ] Route is accessible: `/onboarding/preferences` returns 200 status
- [ ] All imports resolve correctly
- [ ] Validation functions work correctly with test data

#### Manual Verification:
- [ ] Navigate to `/onboarding/preferences` without CV data → redirects to `/onboarding/upload`
- [ ] After uploading CV, preferences page displays correctly
- [ ] All three preference sections render (Work Arrangement, Location, Company Stage)
- [ ] Required fields show asterisk (*)
- [ ] Clicking "Continue to Chat" without selections shows validation errors
- [ ] Selecting only work arrangement (no location) shows error
- [ ] Selecting only location (no work arrangement) shows error
- [ ] Selecting "In-Person" only → Location options restricted to Estonia only
- [ ] Selecting "In-Person" only and "EEA" → validation error on submit
- [ ] Selecting work arrangement + location → "Continue to Chat" button works
- [ ] After valid submit → navigates to `/chat`
- [ ] Preferences stored in OnboardingContext (verify in React DevTools)
- [ ] "Back to Upload" button navigates back to upload page
- [ ] Validation errors clear when user changes selection after submit attempt
- [ ] Company Stage is optional (no validation error if empty)

**Implementation Note**: Test all validation scenarios thoroughly, especially the In-Person + Estonia restriction logic, before proceeding to Phase 4.

---

## Phase 4: Refactor Chat Page

### Overview
Move the chat interface to a dedicated `/chat` route, remove all CV upload and preference UI, and implement guards that redirect to onboarding if data is missing. Enable full chat functionality by uncommenting MessageBubble rendering and removing the embedded preference panel.

### Changes Required:

#### 1. Create Dedicated Chat Page
**File**: `src/app/chat/page.tsx` (new file)
**Changes**: Create chat page with onboarding guards

```typescript
'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useOnboarding } from '@/contexts/OnboardingContext';
import ChatInterface from '@/components/chat/ChatInterface';

export default function ChatPage() {
  const router = useRouter();
  const { cvData, preferences, isOnboardingComplete } = useOnboarding();

  // Guard: Redirect to upload if onboarding not complete
  useEffect(() => {
    if (!isOnboardingComplete || !cvData || !preferences) {
      router.push('/onboarding/upload');
    }
  }, [isOnboardingComplete, cvData, preferences, router]);

  // Don't render until we verify onboarding is complete
  if (!isOnboardingComplete || !cvData || !preferences) {
    return null;
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      <div className="w-full max-w-2xl h-[85vh] border rounded-lg shadow-lg bg-white dark:bg-gray-800 flex flex-col overflow-hidden">
        {/* Header with edit navigation */}
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40 flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <span className="text-xs text-gray-600 dark:text-gray-300">
              CV: {cvData.skills?.length || 0} skills, {cvData.workExperience?.length || 0} experiences
            </span>
            <span className="text-xs text-gray-600 dark:text-gray-300">
              Preferences: {preferences.workArrangements.join(', ')} · {preferences.locations.join(', ')}
            </span>
          </div>
          <div className="flex gap-2 text-xs">
            <button
              onClick={() => router.push('/onboarding/upload')}
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              Edit CV
            </button>
            <span className="text-gray-400">|</span>
            <button
              onClick={() => router.push('/onboarding/preferences')}
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              Edit Preferences
            </button>
          </div>
        </div>

        {/* Chat interface */}
        <div className="flex flex-col flex-1 min-h-0">
          <ChatInterface userCVInfo={cvData} />
        </div>
      </div>
    </main>
  );
}
```

#### 2. Refactor ChatInterface Component
**File**: `src/components/chat/ChatInterface.tsx`
**Changes**: Remove embedded preference UI, enable message display

Remove the preference state and panel (lines 26-63), uncomment MessageBubble rendering (lines 64-68), and remove chat disable logic that checks preference state.

```typescript
'use client';
import React, { useState } from 'react';
import { useChat } from '@ai-sdk/react';
import MessageBubble from './MessageBubble';
import { Button } from '@/components/ui/button';
import { TextStreamChatTransport, generateId } from 'ai';
import { Textarea } from '@/components/ui/textarea';
import { Send, Paperclip, Loader2 } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { UserCVParsed } from '@/types/user-data';

export default function ChatInterface({ userCVInfo }: { userCVInfo: UserCVParsed }) {
  const { messages, sendMessage, status } = useChat({
    transport: new TextStreamChatTransport({ api: '/api/chat' }),
    messages: [
      {
        id: generateId(), role: 'system', parts: [
          {
            type: 'text',
            text: `You are an intelligent job search assistant. Analyze the CV which contains skills, work experiences.\nSearch the internet for current job opportunities that match the my qualifications and interests.\nCV:\n${JSON.stringify(userCVInfo)}`
          }
        ]
      }
    ]
  });

  const [compactHeader, setCompactHeader] = useState(false);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const top = e.currentTarget.scrollTop;
    // Shrink header when user scrolls past small threshold
    if (top > 16) {
      if (!compactHeader) setCompactHeader(true);
    } else if (compactHeader) {
      setCompactHeader(false);
    }
  };

  const onSendMessage = (message: string) => {
    sendMessage({ text: message });
  }

  const messagesWithOutSystemMessage = messages.filter(m => m.role !== 'system');

  return (
    <Card className="flex flex-col h-full w-full rounded-lg shadow-none border-none py-0">
      <CardHeader className={`border-b transition-all duration-200 ${compactHeader ? '!py-1' : '!py-4'} px-4 bg-white/90 dark:bg-gray-800/90 backdrop-blur`}>
        <CardTitle className={`font-semibold transition-all duration-200 ${compactHeader ? 'text-base' : 'text-lg'}`}>AI Career Coach</CardTitle>
      </CardHeader>
      <CardContent onScroll={handleScroll} className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
        {messagesWithOutSystemMessage.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 text-center space-y-2">
            <p className="text-sm">Welcome! I'm ready to help you find the best job opportunities.</p>
            <p className="text-xs text-gray-400">Ask me anything about job searching or let me suggest opportunities based on your profile.</p>
          </div>
        )}
        {messagesWithOutSystemMessage.map(m => (
          <MessageBubble key={m.id} message={m} />
        ))}
      </CardContent>
      <CardFooter className="p-4 border-t">
        <ChatInput onSendMessage={onSendMessage} status={status} />
      </CardFooter>
    </Card>
  );
}

function ChatInput({ onSendMessage, status }: { onSendMessage: (message: string) => void, status: string }) {
  const [inputValue, setInputValue] = useState('');
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    // Auto-grow: reset height then set to scrollHeight for smooth expansion
    const el = e.currentTarget;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() === '') return;
    onSendMessage(inputValue);
    setInputValue('');
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Submit on Cmd+Enter / Ctrl+Enter; add new line on plain Enter
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      onSubmit(e as unknown as React.FormEvent);
    }
  };

  const isSubmitting = status === 'submitted' || status === 'streaming';

  return (
    <form onSubmit={onSubmit} className="flex items-start w-full space-x-2">
      <Button variant="ghost" size="icon" disabled={isSubmitting} aria-disabled={isSubmitting} aria-label="Attach file">
        <Paperclip className="h-5 w-5" />
      </Button>
      <div className="flex-1 flex items-end">
        <Textarea
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Type your message..."
          className="flex-1 max-h-48 leading-relaxed overflow-y-auto"
          rows={isSubmitting ? 1 : 3}
          disabled={isSubmitting}
          aria-disabled={isSubmitting}
        />
      </div>
      <Button type="submit" size="icon" disabled={isSubmitting} aria-disabled={isSubmitting} aria-label="Send message">
        {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
      </Button>
    </form>
  )
}
```

#### 3. Remove Unused Imports and Code
**File**: `src/components/chat/ChatInterface.tsx`
**Changes**: Clean up unused imports

Remove these imports as they're no longer needed:
- `PreferenceStepWorkArrangement`
- `PreferenceStepLocation`
- `PreferenceStepCompanyStage`
- `PreferenceValidationMessages`
- `startPreferencesFlow`, `getPreferenceState`, `updatePreferenceStep` from conversation-handler
- `PreferenceProfile` from types (if not used elsewhere)

### Success Criteria:

#### Automated Verification:
- [ ] Page builds without TypeScript errors: `npm run build`
- [ ] Route `/chat` is accessible
- [ ] No unused imports in ChatInterface.tsx
- [ ] All imports resolve correctly

#### Manual Verification:
- [ ] Navigating directly to `/chat` without completing onboarding → redirects to `/onboarding/upload`
- [ ] After completing full onboarding flow → `/chat` page displays
- [ ] Chat header shows CV summary (skills count, experience count)
- [ ] Chat header shows preference summary (work arrangements, locations)
- [ ] "Edit CV" link navigates to `/onboarding/upload`
- [ ] "Edit Preferences" link navigates to `/onboarding/preferences`
- [ ] After editing and re-submitting, can return to `/chat` successfully
- [ ] Empty chat shows welcome message
- [ ] Chat input is enabled (no disabled state)
- [ ] Sending a message displays MessageBubble components
- [ ] Messages appear in correct order (user messages right-aligned, assistant left-aligned)
- [ ] Streaming responses work correctly
- [ ] Scroll behavior works (header compacts on scroll)
- [ ] No preference selection UI visible in chat interface

**Implementation Note**: Test the complete flow including editing CV and preferences from the chat page to ensure context state updates correctly.

---

## Phase 5: Cleanup and Root Redirect

### Overview
Complete the migration by removing the old single-page implementation, removing hardcoded demo CV data, and setting up the root page to redirect to onboarding. This phase ensures users always start at the correct entry point.

### Changes Required:

#### 1. Replace Root Page with Redirect
**File**: `src/app/(chat)/page.tsx`
**Changes**: Replace entire content with redirect to onboarding

```typescript
'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.push('/onboarding/upload');
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-900">
      <div className="text-center">
        <p className="text-gray-600 dark:text-gray-400">Redirecting...</p>
      </div>
    </main>
  );
}
```

#### 2. Update Route Catalog Documentation
**File**: `.github/instructions/routes.instructions.md`
**Changes**: Update catalog with new routes

Update the Route Catalog section (line 86+):

```markdown
| Path | Type | Purpose |
|------|------|---------|
| `src/app/(chat)/page.tsx` | Page | Root redirect to onboarding upload page. |
| `src/app/chat/page.tsx` | Page | Main chat interface; requires completed onboarding (CV + preferences). Guards redirect to upload if incomplete. |
| `src/app/onboarding/upload/page.tsx` | Page | CV upload step; stores parsed CV in OnboardingContext and navigates to preferences. |
| `src/app/onboarding/preferences/page.tsx` | Page | Preference collection step; validates work arrangements + locations required, then navigates to chat. |
| `src/app/onboarding/layout.tsx` | Layout | Shared layout for onboarding pages with consistent styling. |
| `src/app/api/chat/route.ts` | API (POST) | Chat endpoint invoking MCP agent; returns streaming assistant responses. |
| `src/app/api/upload/route.ts` | API (POST) | CV/PDF upload and parsing; validates file and returns structured UserCVParsed data. |
| `src/app/api/health/route.ts` | API (GET) | Health/status check (uptime/readiness). No business logic beyond simple report. |
```

#### 3. Update Component Catalog
**File**: `src/components/CATALOG.md`
**Changes**: Document changes to ChatInterface and add context information

Update relevant sections with new information about OnboardingContext integration and ChatInterface changes.

#### 4. Update Libs Catalog
**File**: `src/libs/CATALOG.md`
**Changes**: Document preference-store refactoring

Document the changes to preference-store.ts, preference-collector.ts, and their integration with React Context.

#### 5. Verify No References to Old Flow
**File**: Search across codebase
**Changes**: Ensure no remaining references to old single-page flow patterns

Search for:
- Hardcoded CV data (the large object from page.tsx:7-60)
- References to embedded preference UI in ChatInterface
- Any commented-out code related to old flow

### Success Criteria:

#### Automated Verification:
- [ ] Full build passes: `npm run build`
- [ ] No TypeScript errors
- [ ] No unused imports across all modified files
- [ ] Linting passes (if lint script exists)

#### Manual Verification:
- [ ] Navigate to root `/` → redirects to `/onboarding/upload`
- [ ] Complete full onboarding flow from scratch works end-to-end
- [ ] No hardcoded CV data visible anywhere
- [ ] No "undefined" or "null" errors in browser console
- [ ] All navigation links work correctly
- [ ] Page refresh at any step behaves correctly (redirects to upload)
- [ ] DevTools React Components tree shows clean component hierarchy
- [ ] OnboardingContext state updates correctly through entire flow
- [ ] Chat messages persist within a session (don't disappear when editing preferences and returning)
- [ ] Editing CV after reaching chat clears preferences and requires re-selection
- [ ] Dark mode works correctly on all pages
- [ ] Mobile responsive design works on all pages

#### Integration Testing Flow:
1. Start at `/` → redirected to `/onboarding/upload`
2. Upload CV → navigated to `/onboarding/preferences`
3. Submit preferences without selections → see validation errors
4. Fill only work arrangements → still see location error
5. Fill work arrangements + locations → submit succeeds → navigate to `/chat`
6. Send a chat message → see MessageBubble render
7. Click "Edit Preferences" → navigate to preferences page with pre-filled values
8. Change preferences → submit → return to `/chat`
9. Click "Edit CV" → navigate to upload page
10. Upload new CV → navigate to preferences (preferences cleared)
11. Re-submit preferences → return to `/chat`
12. Refresh browser at `/chat` → redirected to `/onboarding/upload` (state lost)

**Implementation Note**: This is the final phase. Thoroughly test all scenarios before considering the implementation complete. Pay special attention to state consistency when users navigate back and forth between pages.

---

## Performance Considerations

### State Management:
- OnboardingContext uses React Context API with minimal re-renders (only updates when CV or preferences change)
- Preference validation runs only on submit, not on every keystroke
- No unnecessary re-renders in child components (proper memo/callback patterns if needed later)

### Page Navigation:
- Client-side navigation using Next.js router (no full page reloads)
- Redirect checks happen in useEffect (after initial render to avoid hydration issues)
- Proper loading states prevent flash of unauthorized content

### File Upload:
- Existing FileUpload component already handles file validation and loading states
- Upload API endpoint already implements proper error handling and timeouts
- No changes needed to upload performance characteristics

---

## Migration Notes

### Breaking Changes:
- **State management changed from local useState to React Context**: Any external code accessing chat or CV state will break
- **Route structure changed**: Root `/` now redirects; chat moved to `/chat`
- **ChatInterface component API unchanged**: Still accepts `userCVInfo` prop, but preferences no longer managed internally

### Data Compatibility:
- **CV data structure unchanged**: `UserCVParsed` type remains the same
- **Preference structure unchanged**: `PreferenceProfile` type remains the same
- **API endpoints unchanged**: `/api/upload` and `/api/chat` have same contracts

### User Experience Changes:
- **Multi-step process**: Users now go through distinct steps instead of single page
- **No persistence across sessions**: Refresh = restart (as specified in requirements)
- **Ability to edit**: Users can now go back and change CV/preferences from chat page

---

## References

- Original research: `thoughts/2025-11-16-multi-step-flow-separation/research.md`
- Current single-page implementation: `src/app/(chat)/page.tsx:1-73`
- ChatInterface with embedded preferences: `src/components/chat/ChatInterface.tsx:1-135`
- Preference store infrastructure: `src/libs/preferences/preference-store.ts`
- Preference validation placeholder: `src/libs/preferences/preference-collector.ts:1`
- Type definitions: `src/types/user-data.ts:4-25`
- Upload API: `src/app/api/upload/route.ts:1-100`
- Chat API: `src/app/api/chat/route.ts:1-96`
- API route guidelines: `.github/instructions/routes.instructions.md`
