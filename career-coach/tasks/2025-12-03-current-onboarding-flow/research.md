---
date: 2025-12-03T07:45:28+0000
researcher: GitHub Copilot
git_commit: b45c64d5c10d85df059c5e0c12f6c89ee6611af7
branch: main
repository: ML-guide
topic: "Current Implementation: CV Upload, Preference Input, and Chat Interface Integration"
tags: [research, codebase, onboarding, cv-upload, preferences, chat-interface]
status: complete
last_updated: 2025-12-03
last_updated_by: GitHub Copilot
---

# Research: Current Implementation: CV Upload, Preference Input, and Chat Interface Integration

**Date**: 2025-12-03T07:45:28+0000
**Researcher**: GitHub Copilot
**Git Commit**: b45c64d5c10d85df059c5e0c12f6c89ee6611af7
**Branch**: main
**Repository**: ML-guide

## Research Question

How are CV upload, preference input, and chat interface currently implemented and integrated? The user wants to understand the current single-page implementation to inform separating these into a multi-step onboarding process.

## Summary

The current implementation combines CV upload, preference input, and chat interface into a **single-page flow** at `src/app/(chat)/page.tsx`. The flow uses a simple state toggle (`userCVParsedProfile`) to switch between two screens:

1. **Upload Screen** (when `userCVParsedProfile` is null): Shows the `FileUpload` component
2. **Chat Screen** (when `userCVParsedProfile` is populated): Shows the `ChatInterface` component which embeds the preference collection UI

The preference collection is embedded within the chat interface but is currently **not fully connected** - the preference flow initialization code exists but is never triggered. The chat messages display is commented out, suggesting the implementation is incomplete.

An empty **onboarding directory structure** already exists at `src/app/onboarding/` with subdirectories for `chat/`, `cv-upload/`, `preferences/`, `review/`, and `upload/`, but all are empty placeholders.

## Detailed Findings

### 1. Main Page Component (`src/app/(chat)/page.tsx`)

**Location**: `src/app/(chat)/page.tsx` (126 lines)

**Current Implementation**:
- Uses a single React `useState` to store parsed CV data (`userCVParsedProfile`)
- Contains **hardcoded CV data** as the initial state (lines 6-119), bypassing the upload flow
- Conditional rendering based on whether `userCVParsedProfile` is null:
  - **Null**: Displays upload UI with `FileUpload` component
  - **Non-null**: Displays chat UI with `ChatInterface` component

**Data Flow**:
```
FileUpload (user drops PDF)
  → onUploaded callback
  → setUserCVParsedProfile(info.profile)
  → Re-render shows ChatInterface with CV data
```

**Key Code Structure** (lines 6-126):
- Lines 6-119: Hardcoded `UserCVParsed` object with skills and work experience
- Lines 121-126: Main component with conditional rendering
- Lines 122-137: Upload screen UI (title, description, FileUpload component)
- Lines 139-150: Chat screen UI (displays parsed data summary, ChatInterface component)

### 2. CV Upload Component (`src/components/upload/FileUpload.tsx`)

**Location**: `src/components/upload/FileUpload.tsx` (98 lines)

**Current Implementation**:
- Drag-and-drop file upload UI with PDF validation
- Client-side validation: PDF type only, max 5MB
- Uses `useApiFetcher` hook to POST to `/api/upload`
- Invokes callbacks: `onUploadInitiated`, `onUploaded`, `onUploadError`

**Validation Rules** (lines 24-32):
- File type must be `application/pdf`
- File size must be ≤ 5MB

**API Integration** (lines 34-45):
- POST to `/api/upload` with FormData
- Receives response with: `{ success: boolean, message?: string, profile?: UserCVParsed }`
- Passes `profile` to `onUploaded` callback

### 3. CV Upload API (`src/app/api/upload/route.ts`)

**Location**: `src/app/api/upload/route.ts`

**Current Implementation**:
- Accepts multipart form data with PDF file
- Uses `pdf-parse` library to extract text from PDF
- Uses LLM (Fireworks AI) via `@joshuacalpuerto/mcp-agent` to parse text into structured JSON
- Validates parsed data against Zod schema (`UserCVParsedSchema`)

**Processing Flow**:
1. Extract file from FormData
2. Validate file type (PDF) and size (≤5MB)
3. Convert PDF to text using `pdf-parse`
4. Send text to LLM with structured schema prompt
5. Parse LLM response as JSON
6. Validate with Zod schema
7. Return `{ success: true, profile: parsedData }`

**Error Handling**:
- Returns `{ success: false, message: errorDescription }` on failure
- Handles: invalid file type, file too large, parsing errors, validation errors

### 4. Chat Interface Component (`src/components/chat/ChatInterface.tsx`)

**Location**: `src/components/chat/ChatInterface.tsx` (166 lines)

**Current Implementation**:
- Receives `userCVInfo` prop of type `UserCVParsed`
- Uses Vercel AI SDK's `useChat` hook for chat functionality
- **Embeds preference collection UI** within the chat interface (lines 67-99)
- Uses local state for preferences (`useState<PreferenceProfile>`)
- Chat messages display is **commented out** (lines 100-105)

**Preference UI Embedding** (lines 67-99):
- Shows preference collection when `!preference.valid`
- Three preference step components:
  - `PreferenceStepWorkArrangement` (work arrangement)
  - `PreferenceStepLocation` (location)
  - `PreferenceStepCompanyStage` (company stage)
- Updates local state on each preference change
- Displays disabled message while preferences incomplete

**State Management Issue**:
- Uses local `preference` state (lines 36-42)
- Imports conversation handler functions but **never calls them**:
  - `startPreferencesFlow` - imported but not invoked
  - `getPreferenceState` - used in ChatInput to disable chat
  - `updatePreferenceStep` - imported but not invoked

**Chat Setup** (lines 18-32):
- Initializes `useChat` with system message containing CV data
- System message: "You are an intelligent job search assistant..."
- Sends CV as JSON in system message
- Uses `TextStreamChatTransport` to `/api/chat` endpoint

### 5. Preference Components

**Location**: `src/components/preferences/` directory

**Three Step Components**:

1. **`PreferenceStepWorkArrangement.tsx`**
   - Multi-select for work arrangements
   - Options: Remote, Hybrid, In-Person
   - Uses shared `MultiSelect` component

2. **`PreferenceStepLocation.tsx`**
   - Multi-select for locations
   - Options: European Economic Area (EEA), Estonia
   - Conditional logic: if `inPersonOnly` prop is true, restricts to Estonia only
   - Dynamic behavior based on work arrangement selection

3. **`PreferenceStepCompanyStage.tsx`**
   - Multi-select for company stages
   - Options: Well-funded, Likely to IPO, Unicorn
   - Marked as optional in UI

**Shared Component**:
- **`MultiSelect.tsx`** (`src/components/ui/MultiSelect.tsx`)
  - Reusable multi-select dropdown component
  - Used by all three preference step components

### 6. Preference Business Logic

**Location**: `src/libs/preferences/` directory (7 files)

**Core Files**:

1. **`preference-store.ts`**
   - Module-level state management (not React state)
   - Stores: `workArrangements`, `locations`, `companyStages`, `interests`
   - Functions: `setWorkArrangements`, `setLocations`, etc.
   - Exports: `getPreferenceStore()` to retrieve current values

2. **`preference-normalizer.ts`**
   - Normalizes and validates preference values
   - Functions: `normalizeWorkArrangement`, `normalizeLocation`, `normalizeCompanyStage`
   - Ensures values match expected enums

3. **`constants.ts`**
   - Defines valid options for each preference type
   - Exports: `WORK_ARRANGEMENTS`, `LOCATIONS`, `COMPANY_STAGES`

4. **`errors.ts`**
   - Custom error classes for preference validation
   - `PreferenceValidationError`, `PreferenceRequiredError`

5. **`events.ts`**
   - Event emitter for preference changes
   - Allows components to listen for preference updates
   - Functions: `onPreferenceChange`, `emitPreferenceChange`

6. **`analytics.ts`**
   - Preference collection analytics tracking
   - Functions: `trackPreferenceStep`, `trackPreferenceComplete`

7. **`index.ts`**
   - Barrel export for preference module
   - Exports all public functions and types

**Stub File**:
- **`preference-collector.ts`** - Empty/stub implementation

### 7. Conversation Handler

**Location**: `src/libs/chat/conversation-handler.ts`

**Current Implementation**:
- Module-level state for preference flow management
- Three exported functions:
  1. `startPreferencesFlow()` - Initializes preference collection flow
  2. `getPreferenceState()` - Returns current preference state
  3. `updatePreferenceStep(step, data)` - Updates preference data for a step

**State Structure**:
```typescript
{
  active: boolean,
  currentStep: string | null,
  data: {
    workArrangements: string[],
    locations: string[],
    companyStages: string[],
    interests: string
  }
}
```

**Integration Issue**:
- Functions are imported in `ChatInterface.tsx` but **never called**
- Preference flow is never activated (active remains false)
- Local React state is used instead of this module state

### 8. Chat API Endpoint

**Location**: `src/app/api/chat/route.ts`

**Current Implementation**:
- POST endpoint for chat messages
- Uses `@joshuacalpuerto/mcp-agent` for AI orchestration
- Streams responses back to client using Vercel AI SDK
- Expects messages in request body

**MCP Agent Integration**:
- Uses Model Context Protocol (MCP) for AI tool orchestration
- Configures tools for company evaluation, web search, etc.
- Returns streaming text response

### 9. Type Definitions

**Location**: `src/types/user-data.ts`

**Key Types**:

1. **`UserCVParsed`**:
   ```typescript
   {
     skills: string[]
     workExperience: WorkExperience[]
     education: string[]
   }
   ```

2. **`WorkExperience`**:
   ```typescript
   {
     companyName: string
     startDate: string
     endDate: string
     summary: string
   }
   ```

3. **`PreferenceProfile`**:
   ```typescript
   {
     workArrangements: string[]
     locations: string[]
     companyStages: string[]
     interests: string
     valid: boolean
   }
   ```

**Schema Validation**:
- Zod schemas defined for runtime validation
- `UserCVParsedSchema` used in upload API

### 10. Onboarding Directory Structure

**Location**: `src/app/onboarding/`

**Current State**: Empty placeholder structure with 5 subdirectories:

1. `chat/` - Empty
2. `cv-upload/` - Empty
3. `preferences/` - Empty
4. `review/` - Empty
5. `upload/` - Empty

**Observations**:
- Directory structure exists but contains no implementation
- No `page.tsx` files in any subdirectory
- No `layout.tsx` for routing setup
- Appears to be scaffolding for future multi-step onboarding flow

## Code References

- `src/app/(chat)/page.tsx:1-126` - Main page with single-page flow
- `src/app/(chat)/page.tsx:6-119` - Hardcoded CV data
- `src/app/(chat)/page.tsx:121` - Conditional rendering logic
- `src/components/upload/FileUpload.tsx:1-98` - CV upload component
- `src/components/upload/FileUpload.tsx:24-32` - File validation
- `src/app/api/upload/route.ts` - CV upload and parsing API
- `src/components/chat/ChatInterface.tsx:1-166` - Chat interface component
- `src/components/chat/ChatInterface.tsx:18-32` - useChat hook setup
- `src/components/chat/ChatInterface.tsx:36-42` - Preference local state
- `src/components/chat/ChatInterface.tsx:67-99` - Embedded preference UI
- `src/components/chat/ChatInterface.tsx:100-105` - Commented out message display
- `src/components/preferences/PreferenceStepWorkArrangement.tsx` - Work arrangement selector
- `src/components/preferences/PreferenceStepLocation.tsx` - Location selector
- `src/components/preferences/PreferenceStepCompanyStage.tsx` - Company stage selector
- `src/components/ui/MultiSelect.tsx` - Shared multi-select component
- `src/libs/preferences/preference-store.ts` - Module-level preference state
- `src/libs/preferences/preference-normalizer.ts` - Preference validation
- `src/libs/preferences/constants.ts` - Valid preference options
- `src/libs/chat/conversation-handler.ts` - Preference flow management (unused)
- `src/app/api/chat/route.ts` - Chat API with MCP agent
- `src/types/user-data.ts` - Type definitions

## Architecture Documentation

### Current Single-Page Flow Architecture

```
┌─────────────────────────────────────────────────────────────┐
│ src/app/(chat)/page.tsx                                     │
│                                                              │
│ State: userCVParsedProfile (UserCVParsed | null)           │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Conditional Render:                                   │  │
│  │                                                        │  │
│  │ IF userCVParsedProfile === null:                     │  │
│  │   ┌─────────────────────────────────────────┐       │  │
│  │   │ Upload Screen                            │       │  │
│  │   │ - Title & Description                    │       │  │
│  │   │ - FileUpload Component                   │       │  │
│  │   │   └─> onUploaded(info)                  │       │  │
│  │   │        setUserCVParsedProfile(profile)  │       │  │
│  │   └─────────────────────────────────────────┘       │  │
│  │                                                        │  │
│  │ ELSE:                                                 │  │
│  │   ┌─────────────────────────────────────────┐       │  │
│  │   │ Chat Screen                              │       │  │
│  │   │ - CV Data Summary Bar                    │       │  │
│  │   │ - ChatInterface Component                │       │  │
│  │   │   (receives userCVInfo prop)            │       │  │
│  │   │                                          │       │  │
│  │   │   Inside ChatInterface:                 │       │  │
│  │   │   ┌───────────────────────────┐        │       │  │
│  │   │   │ Preference Collection UI  │        │       │  │
│  │   │   │ (embedded, not connected) │        │       │  │
│  │   │   └───────────────────────────┘        │       │  │
│  │   │   ┌───────────────────────────┐        │       │  │
│  │   │   │ Chat Messages (commented) │        │       │  │
│  │   │   └───────────────────────────┘        │       │  │
│  │   │   ┌───────────────────────────┐        │       │  │
│  │   │   │ Chat Input                │        │       │  │
│  │   │   └───────────────────────────┘        │       │  │
│  │   └─────────────────────────────────────────┘       │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### CV Upload Flow

```
User drops PDF file
  ↓
FileUpload.tsx (client validation)
  ↓
POST /api/upload (with FormData)
  ↓
route.ts: Extract PDF text
  ↓
route.ts: LLM parse text → JSON
  ↓
route.ts: Zod validation
  ↓
Return: { success: true, profile: UserCVParsed }
  ↓
FileUpload: onUploaded(info)
  ↓
page.tsx: setUserCVParsedProfile(info.profile)
  ↓
Re-render: Shows ChatInterface
```

### State Management Layers

The codebase has **three separate state systems** that are not fully integrated:

1. **Page Component State** (React useState)
   - Location: `src/app/(chat)/page.tsx`
   - Stores: `userCVParsedProfile`
   - Used for: CV upload → chat screen transition

2. **ChatInterface Local State** (React useState)
   - Location: `src/components/chat/ChatInterface.tsx`
   - Stores: `preference` (PreferenceProfile)
   - Used for: Preference UI component updates

3. **Conversation Handler Module State** (Module-level)
   - Location: `src/libs/chat/conversation-handler.ts`
   - Stores: `{ active, currentStep, data }`
   - **Not currently connected** to UI

### Preference Collection Flow (Current Implementation)

```
ChatInterface mounts
  ↓
Shows preference UI (preference.valid === false)
  ↓
User selects work arrangement
  ↓
PreferenceStepWorkArrangement onChange
  ↓
Update local state: setPreference({ ...prev, workArrangements: vals })
  ↓
User selects location
  ↓
PreferenceStepLocation onChange
  ↓
Update local state: setPreference({ ...prev, locations: vals })
  ↓
User selects company stage (optional)
  ↓
PreferenceStepCompanyStage onChange
  ↓
Update local state: setPreference({ ...prev, companyStages: vals })
  ↓
[NO VALIDATION OR COMPLETION LOGIC IMPLEMENTED]
  ↓
Chat remains disabled (preference.valid never becomes true)
```

### Chat Flow

```
ChatInterface: useChat() hook initialized
  ↓
System message includes CV data as JSON
  ↓
User types message in ChatInput
  ↓
sendMessage({ text: message })
  ↓
POST /api/chat with messages array
  ↓
MCP agent orchestrates AI response
  ↓
Stream response back to client
  ↓
useChat hook updates messages array
  ↓
[MESSAGE DISPLAY COMMENTED OUT - Not visible]
```

## Implementation Gaps

Based on the code analysis, the following gaps exist in the current implementation:

1. **Preference Flow Not Activated**: `startPreferencesFlow()` is imported but never called
2. **Disconnected State**: ChatInterface uses local state; conversation-handler module state is unused
3. **No Preference Validation**: `preference.valid` never becomes true; no completion logic
4. **Chat Messages Hidden**: Message display code is commented out (lines 100-105)
5. **Hardcoded CV Data**: Main page bypasses upload with hardcoded profile data
6. **No Interests Input**: PreferenceProfile includes `interests` field but no UI component exists to set it
7. **No Review Step**: PRD mentions review step, but not implemented
8. **No Shortlist Display**: ShortlistDisplay component exists but never rendered
9. **Empty Onboarding Structure**: Directory exists but contains no implementation
10. **No Multi-Step Routing**: No Next.js routing setup for multi-step flow

## Historical Context (from artifacts/)

The Product Requirements Document (`artifacts/prd-ai-career-coach.md`) defines the intended flow:

**User Story (from PRD, lines 16-18)**:
- Upload CV (PDF format)
- Specify preferences through conversation
- Receive curated shortlist of top 5 job opportunities

**Functional Requirements (from PRD, lines 22-47)**:
- **FR-1**: CV Upload (PDF format)
- **FR-2**: CV Parsing (extract skills, experience, job titles)
- **FR-3**: Job Preferences Selection via chatbot and structured UI
  - Work Arrangement: Remote, Hybrid, In-Person (multi-select)
  - Location: EEA, Estonia (multi-select, conditional on In-Person)
  - Company Stage: Well-funded, Likely to IPO, Unicorn (multi-select, optional)
  - Interests: Free-text, comma-separated
- **FR-4**: Company Evaluation (external APIs)
- **FR-5**: Shortlist Generation (top 5)
- **FR-6**: Shortlist Output (score, pros/cons, summary, domain overview)

**Current vs. Intended Implementation**:
- ✅ CV Upload component implemented
- ✅ CV Parsing API implemented
- ⚠️ Preference UI components exist but not fully functional
- ❌ Interests input not implemented
- ❌ Company evaluation partially implemented (code exists but not triggered)
- ❌ Shortlist generation and display not connected to UI
- ❌ Multi-step flow not implemented (still single page)

## Related Research

No prior research documents found in the repository.

## Open Questions

None - this research documents the current state of the codebase as requested. The user's intent is to separate the single-page flow into a multi-step process using the empty onboarding directory structure.
