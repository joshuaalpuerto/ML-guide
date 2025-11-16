---
date: 2025-11-16T00:00:00Z
researcher: Joshua Calpuerto
git_commit: main
branch: main
repository: ML-guide
topic: "Current Single-Page Implementation: CV Upload, Preferences, and Chat Interface"
tags: [research, codebase, routing, upload, preferences, chat, state-management]
status: complete
last_updated: 2025-11-16
last_updated_by: Joshua Calpuerto
---

# Research: Current Single-Page Implementation: CV Upload, Preferences, and Chat Interface

**Date**: 2025-11-16T00:00:00Z  
**Researcher**: Joshua Calpuerto  
**Git Commit**: main  
**Branch**: main  
**Repository**: ML-guide

## Research Question

How is the current single-page flow (CV upload, preference input, and chat interface) implemented in the career-coach application, so it can be separated into a multi-step process?

## Summary

The career-coach application currently implements a **single-page flow** where CV upload, user preferences, and chat interface are all rendered on one page at `src/app/(chat)/page.tsx`. The flow operates in phases:

1. **Phase 1: CV Upload** - User must upload a PDF CV before proceeding
2. **Phase 2: Preferences + Chat** - After CV upload, user sees preferences panel embedded within the chat interface
3. **Phase 3: Chat Only** - Once preferences are valid, chat interface becomes fully enabled

The application uses **Next.js 15 App Router** with file-based routing. State management relies primarily on local `useState` with prop drilling. Placeholder directories exist for a future multi-step onboarding flow (`/onboarding/upload`, `/onboarding/preferences`, `/onboarding/review`) but contain no page files yet.

## Detailed Findings

### 1. Current Routing Structure

**Main Page:** `src/app/(chat)/page.tsx`
- **Route Group:** `(chat)` - Organizational grouping that doesn't affect URL path
- **URL:** `/` (root)
- **Layout:** `src/app/layout.tsx` provides root HTML structure with fonts and dark mode support

**Placeholder Onboarding Routes:**
Empty directories exist for future multi-step flow:
- `src/app/onboarding/upload/` - No `page.tsx` file
- `src/app/onboarding/preferences/` - No `page.tsx` file  
- `src/app/onboarding/review/` - No `page.tsx` file

**API Routes:**
- `src/app/api/upload/route.ts` - PDF CV upload and AI parsing endpoint
- `src/app/api/chat/route.ts` - Chat conversation with MCP Agent orchestration
- `src/app/api/health/route.ts` - Health check endpoint

**Routing Pattern:**
- File-based routing with App Router
- Pages use `page.tsx` files
- API routes use `route.ts` files with exported HTTP method functions (GET, POST, etc.)
- Route groups like `(chat)` provide organization without URL impact

### 2. Single-Page Implementation

**File:** `src/app/(chat)/page.tsx` (Lines 1-73)

**Architecture:**
The page implements a conditional rendering strategy based on CV upload state:

```typescript
const [userCVParsedProfile, setUserCVParsedProfile] = useState<UserCVParsed | null>({
  // Hardcoded demo data for development (lines 7-60)
});

return (
  <main>
    <div className="w-full max-w-2xl h-[75vh]">
      {!userCVParsedProfile ? (
        // Phase 1: Upload UI (lines 20-32)
        <FileUpload onUploaded={(info) => {
          if (info.profile) setUserCVParsedProfile(info.profile);
        }} />
      ) : (
        // Phase 2-3: Chat with preferences (lines 34-50)
        <ChatInterface userCVInfo={userCVParsedProfile} />
      )}
    </div>
  </main>
);
```

**State Management:**
- Single state variable `userCVParsedProfile` controls entire flow
- Initially `null` triggers upload UI
- Once populated, switches to chat interface
- CV data passed down as prop to `ChatInterface`

**Layout Characteristics:**
- Fixed viewport height (`h-[75vh]`)
- Centered layout with max width constraint
- Border, shadow, and rounded corners styling
- Single container for all phases

### 3. CV Upload Flow

**Component:** `src/components/upload/FileUpload.tsx` (Lines 1-106)

**Upload Process:**
1. **File Selection/Drop** (lines 17-56)
   - Drag-and-drop zone with visual feedback
   - File input for click-to-select
   - Validation: PDF only, max 5MB
   
2. **API Request** (lines 38-48)
   - Uses `useApiFetcher` hook
   - POST to `/api/upload` with FormData
   - Loading state during upload
   
3. **Callback Chain:**
   ```typescript
   onUploadInitiated?.(file) → 
   makeRequest('/api/upload', ...) → 
   onUploaded({ filename, size, profile })
   ```

**Backend Processing:** `src/app/api/upload/route.ts` (Lines 1-100)

1. **Request Validation** (lines 22-35)
   - Checks `multipart/form-data` content type
   - Validates PDF mime type
   - Enforces 5MB size limit

2. **PDF Text Extraction** (lines 37-41)
   - Uses `pdf-parse` library
   - Converts Buffer to text
   - Configured with worker path (lines 8-13)

3. **AI Parsing** (lines 43-56)
   - **LLM:** Fireworks AI with max 1536 tokens, temperature 0.2
   - **Agent:** `cv_parser` agent from `mcp-agent` package
   - **Prompt:** Extracts skills, work experience, education
   - **Format:** Enforces JSON schema with strict validation

4. **Response Schema** (lines 62-100)
   ```typescript
   {
     skills: string[] (max 200)
     workExperience: Array<{
       companyName: string
       startDate: string
       endDate: string | null
       summary: string
     }> (max 60 entries)
     education: string[]
   }
   ```

5. **Validation** (lines 55-60)
   - Zod schema validation via `UserCVParsedSchema`
   - Returns `{ success: true, message, profile }`
   - Error handling for validation failures

**Type Definition:** `src/types/user-data.ts` (Lines 4-17)
```typescript
export const UserCVParsedSchema = z.object({
  skills: z.array(z.string()),
  workExperience: z.array(z.object({
    companyName: z.string().min(1).max(120),
    startDate: z.string().min(4).max(10),
    endDate: z.string().min(4).max(10).nullable().optional(),
    summary: z.string()
  })).max(60),
  education: z.array(z.string()),
});

export type UserCVParsed = z.infer<typeof UserCVParsedSchema>;
```

**Data Flow:**
```
User → FileUpload → FormData → useApiFetcher 
  → POST /api/upload → pdf-parse → LLM Agent 
  → JSON Schema → Zod Validation → UserCVParsed 
  → onUploaded callback → setUserCVParsedProfile 
  → page.tsx re-renders with ChatInterface
```

### 4. Preference Collection Flow

**Integration Point:** `src/components/chat/ChatInterface.tsx` (Lines 30-63)

Preferences are **embedded within the ChatInterface** component, not as a separate page:

```typescript
// Preference state (line 26)
const [preference, setPreference] = useState<PreferenceProfile>({
  workArrangements: [],
  locations: [],
  companyStages: [],
  interests: '',
  valid: false
});

// Rendered before messages (lines 30-63)
{!preference.valid && (
  <div className="p-3 border rounded bg-white dark:bg-gray-900 space-y-6">
    <PreferenceStepWorkArrangement values={...} onChange={...} />
    <PreferenceStepLocation values={...} onChange={...} />
    <PreferenceStepCompanyStage values={...} onChange={...} />
    <div>Chat is temporarily disabled while you select preferences.</div>
  </div>
)}
```

**Preference Components:**

1. **PreferenceStepWorkArrangement** (`src/components/preferences/PreferenceStepWorkArrangement.tsx`)
   - Uses `MultiSelect` component
   - Options: Remote, Hybrid, In-Person (from `WORK_ARRANGEMENT_OPTIONS`)
   - Validates at least one selection required

2. **PreferenceStepLocation** (`src/components/preferences/PreferenceStepLocation.tsx`)
   - Uses `MultiSelect` component
   - Options: EEA, Estonia (from `LOCATION_OPTIONS`)
   - Conditional logic: If `inPersonOnly` (user selects only "In-Person"), restricts to Estonia only
   - Validates at least one selection required

3. **PreferenceStepCompanyStage** (`src/components/preferences/PreferenceStepCompanyStage.tsx`)
   - Uses `MultiSelect` component
   - Options: Well-funded, Likely to IPO, Unicorn (from `COMPANY_STAGE_OPTIONS`)
   - Optional field (no validation required)

**Preference Management Logic:** `src/libs/preferences/`

The application has a preference management system, but it's **not connected** to the current UI implementation:

- `preference-store.ts` - In-memory store with draft/profile states (not used in ChatInterface)
- `preference-normalizer.ts` - Data normalization logic (not used)
- `preference-collector.ts` - Validation and error handling (not used)
- `constants.ts` - Defines `WORK_ARRANGEMENT_OPTIONS`, `LOCATION_OPTIONS`, `COMPANY_STAGE_OPTIONS`
- `errors.ts` - Error code constants (not used in current implementation)

**Current State:** Components use local `useState` instead of the preference store.

**Type Definition:** `src/types/user-data.ts` (Lines 19-25)
```typescript
export interface PreferenceProfile {
  workArrangements: string[];
  locations: string[];
  companyStages: string[];
  interests: string;
  valid: boolean;
}
```

**Conversation Handler:** `src/libs/chat/conversation-handler.ts` (Lines 1-151)

Contains preference flow logic but **not actively used** in current implementation:
- Step progression functions
- State getter: `getPreferenceState()` (called in ChatInterface line 98 to disable chat)
- Flow control: `startPreferencesFlow()`, `updatePreferenceStep()`
- Draft and profile management

**Chat Disable Logic:**
```typescript
const prefState = getPreferenceState();
const chatDisabled = prefState.active; // Disables input during preference collection
```

**Note:** The `preference.valid` flag in local state currently never becomes `true` because there's no validation logic connecting the UI components to the validation system.

### 5. Chat Interface Integration

**Component:** `src/components/chat/ChatInterface.tsx` (Lines 1-135)

**Architecture:**
- Uses Vercel AI SDK's `useChat` hook
- Connects to `/api/chat` via `TextStreamChatTransport`
- Manages messages, status, and streaming responses

**System Message Setup** (Lines 16-24):
```typescript
messages: [
  {
    id: generateId(), 
    role: 'system', 
    parts: [{
      type: 'text',
      text: `You are an intelligent job search assistant. 
             Analyze the CV which contains skills, work experiences.
             Search the internet for current job opportunities...
             CV:\n${JSON.stringify(userCVInfo)}`
    }]
  }
]
```

**CV Data Integration:**
- Receives `userCVInfo` prop from parent page
- CV data serialized as JSON in system message
- Sent with every chat request to provide context

**UI Structure:**
- `CardHeader` - Title with scroll-based compaction (lines 37-39)
- `CardContent` - Scrollable message area with preference panel (lines 40-70)
- `CardFooter` - Chat input with send button (lines 71-73)

**Message Display:**
Currently commented out (lines 64-68), but exists in codebase:
```typescript
// {messagesWithOutSystemMessage.map(m => (
//   <MessageBubble key={m.id} message={m} />
// ))}
```

**MessageBubble Component:** `src/components/chat/MessageBubble.tsx` (Lines 1-138)
- Role-based message layout (user vs assistant)
- Avatar display with initials
- Markdown rendering with custom components
- Code syntax highlighting support
- Styling for links, lists, etc.

**Chat Input Component** (Lines 75-135):
- `Textarea` with auto-grow behavior
- Submit on Cmd/Ctrl+Enter
- Loading state with spinner
- Disabled when `chatDisabled` is true (preference flow active)
- Attach file button (currently non-functional)

**Chat API:** `src/app/api/chat/route.ts` (Lines 1-96)

**Architecture:**
Uses **MCP Agent** orchestration instead of standard AI SDK patterns:

1. **Message Processing** (lines 21-38)
   - Receives messages from client
   - Converts to LangChain format using `convertAISDKMessagesToLangChain`
   - Extracts text content for history

2. **Agent Configuration** (lines 42-46)
   - **Agent:** `researcher` 
   - **LLM:** Fireworks AI (configurable via `FIREWORKS_LLM_MODEL_NAME`)
   - **MCP Server:** Exa web search via Smithery
   - **Streaming:** Enabled with workflow event tracking

3. **Orchestration** (lines 48-64)
   - Sends prompt: "Find current job opportunities matching the candidate profile"
   - Streams workflow lifecycle events (WORKFLOW_START, TASK_START, TASK_END, etc.)
   - Returns Server-Sent Events (SSE) response

4. **Workflow Events:**
   ```
   WORKFLOW_START → WORKFLOW_TASK_START → WORKFLOW_STEP_START 
   → WORKFLOW_STEP_END → WORKFLOW_TASK_END → WORKFLOW_END
   ```

**Note:** The chat API is designed to use CV data from system message but doesn't yet implement job matching logic.

### 6. State Management Architecture

**Pattern:** Local component state with prop drilling

**Page Level** (`src/app/(chat)/page.tsx`):
- `userCVParsedProfile: UserCVParsed | null` (lines 7-60)
- Controls entire flow (null = upload, populated = chat)
- Initialized with hardcoded demo data for development

**ChatInterface Level** (`src/components/chat/ChatInterface.tsx`):
- `preference: PreferenceProfile` (lines 26-32)
- `compactHeader: boolean` (line 25)
- Messages managed by `useChat` hook

**FileUpload Level** (`src/components/upload/FileUpload.tsx`):
- `dragActive: boolean` (line 15)
- `validationError: string | null` (line 16)
- API state via `useApiFetcher` hook

**Custom Hook:** `src/libs/hooks/useApiFetcher.ts` (Lines 1-104)
- Generic HTTP client with lifecycle management
- Uses `useReducer` for request state (loading, success, error, response)
- Implements safe dispatch (checks `isMounted` before dispatching)
- AbortController support for cleanup on unmount

**SDK-Managed State:**
- Vercel AI SDK's `useChat` manages messages, status, streaming
- Returns `{ messages, sendMessage, status }` tuple

**Unused Module State:**
- `src/libs/preferences/preference-store.ts` - In-memory store with draft/profile states
- Currently disconnected from UI components
- Uses closure variables for state (not React state)

**Data Flow:**
```
FileUpload (callbacks) 
  → page.tsx (useState) 
  → ChatInterface (props) 
  → System Message (JSON serialization)
  → /api/chat (request body)

Preferences (local state in ChatInterface)
  → NOT connected to preference-store.ts
  → NOT validated or stored
```

**Characteristics:**
- **Ephemeral:** No persistence (state lost on refresh)
- **Isolated:** Each component manages own state
- **Simple:** No global state management library
- **Disconnected:** Preference UI state separate from preference management logic

### 7. Integration Points & Dependencies

**Component Dependencies:**
```
page.tsx
  ├── FileUpload
  │   └── useApiFetcher
  │       └── /api/upload
  └── ChatInterface
      ├── useChat (Vercel AI SDK)
      │   └── /api/chat
      ├── PreferenceStepWorkArrangement
      ├── PreferenceStepLocation
      ├── PreferenceStepCompanyStage
      └── MessageBubble
```

**API Dependencies:**
- `/api/upload` → `pdf-parse`, `mcp-agent`, Fireworks LLM
- `/api/chat` → `mcp-agent`, Smithery Exa MCP, Fireworks LLM

**Type Dependencies:**
- `UserCVParsed` from `src/types/user-data.ts`
- `PreferenceProfile` from `src/types/user-data.ts`

**External Libraries:**
- `@ai-sdk/react` - useChat hook for chat functionality
- `ai` - TextStreamChatTransport, message conversion utilities
- `mcp-agent` - AI agent orchestration framework
- `pdf-parse` - PDF text extraction
- `zod` - Schema validation
- `lucide-react` - Icons
- `shadcn-ui` - UI component library (Button, Card, Input, Textarea, etc.)

### 8. Current Gaps in Implementation

Based on the research, several components exist but are not fully integrated:

1. **Preference Store Not Used** - `src/libs/preferences/preference-store.ts` exists but ChatInterface uses local state
2. **Validation Logic Disconnected** - `preference-collector.ts` and `preference-normalizer.ts` not integrated
3. **Placeholder Files Empty:**
   - `src/libs/parsing/cv-parser.ts` (parsing logic in API route instead)
   - `src/libs/files/cv-uploader.ts` (upload logic in component instead)
   - `src/libs/files/file-handler.ts` (no centralized file handling)
4. **Onboarding Routes Planned But Empty:**
   - `src/app/onboarding/upload/` directory exists, no page file
   - `src/app/onboarding/preferences/` directory exists, no page file
   - `src/app/onboarding/review/` directory exists, no page file
5. **Message Display Commented Out** - MessageBubble component exists but not rendered (ChatInterface.tsx:64-68)
6. **No Persistence** - All state is ephemeral (no localStorage, database, or session storage)
7. **Hardcoded CV Data** - Demo data in page.tsx initial state for development (lines 7-60)

## Code References

- `src/app/(chat)/page.tsx:1-73` - Main single-page implementation with conditional rendering
- `src/app/(chat)/page.tsx:7-60` - Hardcoded demo CV data in initial state
- `src/app/(chat)/page.tsx:20-32` - CV upload phase UI
- `src/app/(chat)/page.tsx:34-50` - Chat interface phase with CV data display
- `src/components/upload/FileUpload.tsx:1-106` - Complete CV upload component
- `src/components/chat/ChatInterface.tsx:1-135` - Chat interface with embedded preferences
- `src/components/chat/ChatInterface.tsx:26-32` - Preference state definition
- `src/components/chat/ChatInterface.tsx:30-63` - Preference panel rendering
- `src/components/chat/ChatInterface.tsx:98` - Chat disable logic using getPreferenceState()
- `src/components/preferences/PreferenceStepWorkArrangement.tsx:1-16` - Work arrangement multi-select
- `src/components/preferences/PreferenceStepLocation.tsx:1-18` - Location multi-select with conditional options
- `src/components/preferences/PreferenceStepCompanyStage.tsx:1-14` - Company stage multi-select (optional)
- `src/app/api/upload/route.ts:1-100` - CV upload, parsing, and validation endpoint
- `src/app/api/upload/route.ts:37-41` - PDF text extraction with pdf-parse
- `src/app/api/upload/route.ts:43-56` - AI parsing with MCP Agent
- `src/app/api/upload/route.ts:62-100` - JSON schema for structured CV data
- `src/app/api/chat/route.ts:1-96` - Chat endpoint with MCP Agent orchestration
- `src/app/api/chat/route.ts:21-38` - Message conversion to LangChain format
- `src/app/api/chat/route.ts:42-64` - Researcher agent initialization and workflow streaming
- `src/types/user-data.ts:4-17` - UserCVParsed Zod schema and type
- `src/types/user-data.ts:19-25` - PreferenceProfile type definition
- `src/libs/hooks/useApiFetcher.ts:1-104` - Generic API request hook with lifecycle management
- `src/libs/chat/conversation-handler.ts:1-151` - Preference flow logic (not actively used)
- `src/libs/preferences/` - Complete preference management system (disconnected from UI)
- `src/app/layout.tsx:1-27` - Root layout with fonts and dark mode

## Architecture Documentation

### Current Single-Page Flow

```
┌─────────────────────────────────────────────────────────────┐
│                     src/app/(chat)/page.tsx                  │
│                          Route: /                             │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  State: userCVParsedProfile (UserCVParsed | null)            │
│                                                               │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Phase 1: CV Upload (if userCVParsedProfile === null) │  │
│  │                                                         │  │
│  │  <FileUpload onUploaded={setUserCVParsedProfile} />   │  │
│  │                                                         │  │
│  │  • Drag & drop or select PDF                           │  │
│  │  • Validate (PDF, 5MB max)                             │  │
│  │  • POST /api/upload                                     │  │
│  │  • Parse with LLM → UserCVParsed                       │  │
│  │  • Update state → trigger Phase 2                      │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                               │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Phase 2-3: Chat + Preferences (if userCVParsedProfile)│  │
│  │                                                         │  │
│  │  <ChatInterface userCVInfo={userCVParsedProfile} />   │  │
│  │                                                         │  │
│  │  Phase 2: Preference Collection                        │  │
│  │  ┌───────────────────────────────────────────────┐    │  │
│  │  │ • PreferenceStepWorkArrangement               │    │  │
│  │  │ • PreferenceStepLocation                      │    │  │
│  │  │ • PreferenceStepCompanyStage (optional)       │    │  │
│  │  │ • Chat input DISABLED                          │    │  │
│  │  │ • preference.valid = false                     │    │  │
│  │  └───────────────────────────────────────────────┘    │  │
│  │                                                         │  │
│  │  Phase 3: Chat Enabled (when preference.valid=true)   │  │
│  │  ┌───────────────────────────────────────────────┐    │  │
│  │  │ • MessageBubble list (currently commented out)│    │  │
│  │  │ • Chat input ENABLED                           │    │  │
│  │  │ • System message includes CV JSON             │    │  │
│  │  │ • POST /api/chat with useChat hook            │    │  │
│  │  └───────────────────────────────────────────────┘    │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow Architecture

```
┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│ User Action  │ ────→   │   Frontend   │ ────→   │   Backend    │
└──────────────┘         └──────────────┘         └──────────────┘
       │                        │                         │
       │ Select PDF             │                         │
       ↓                        │                         │
  FileUpload                    │                         │
       │                        │                         │
       │ Validate               │                         │
       │ (PDF, 5MB)             │                         │
       ↓                        │                         │
  FormData                      │                         │
       │                        │                         │
       │ useApiFetcher          │                         │
       │ POST /api/upload ──────┼─────────────────────→   │
       │                        │                    /api/upload
       │                        │                         │
       │                        │                    Extract PDF text
       │                        │                    (pdf-parse)
       │                        │                         │
       │                        │                    LLM Parse
       │                        │                    (cv_parser agent)
       │                        │                         │
       │                        │                    Validate
       │                        │                    (Zod schema)
       │                        │                         │
       │   ←───────────────────────── UserCVParsed ──────┤
       │                        │                         
       ↓                        │
  setUserCVParsedProfile        │
       │                        │
       │ Re-render              │
       ↓                        │
  ChatInterface                 │
  (CV as prop)                  │
       │                        │
       │ System message         │
       │ with CV JSON           │
       ↓                        │
  useChat hook                  │
       │                        │
       │ sendMessage      ──────┼─────────────────────→   
       │ POST /api/chat         │                    /api/chat
       │                        │                         │
       │                        │                    MCP Agent
       │                        │                    (researcher)
       │                        │                         │
       │   ←───────────── SSE Stream (workflow events) ───┤
       │                        │
       ↓                        │
  Display messages              │
```

### Component Hierarchy

```
page.tsx (/)
├── State: userCVParsedProfile
├── Conditional: !userCVParsedProfile
│   └── FileUpload
│       ├── State: dragActive, validationError
│       ├── Hook: useApiFetcher
│       ├── UI: Card + drag zone
│       └── Callbacks: onUploaded, onUploadInitiated, onUploadError
└── Conditional: userCVParsedProfile
    └── ChatInterface
        ├── Props: userCVInfo={userCVParsedProfile}
        ├── State: preference, compactHeader
        ├── Hook: useChat
        ├── Conditional: !preference.valid
        │   └── Preference Panel
        │       ├── PreferenceStepWorkArrangement
        │       │   └── MultiSelect (Remote, Hybrid, In-Person)
        │       ├── PreferenceStepLocation
        │       │   └── MultiSelect (EEA, Estonia)
        │       └── PreferenceStepCompanyStage
        │           └── MultiSelect (Well-funded, Likely to IPO, Unicorn)
        ├── Conditional: preference.valid (currently never true)
        │   └── MessageBubble list (commented out)
        └── ChatInput
            ├── State: inputValue
            ├── Conditional: chatDisabled (from getPreferenceState())
            ├── Textarea (auto-grow)
            └── Button (Send)
```

### Routing Structure

```
src/app/
├── layout.tsx                      [Root layout, fonts, dark mode]
├── globals.css                     [Tailwind styles, themes]
├── (chat)/                         [Route group, doesn't affect URL]
│   └── page.tsx                    [Route: /, main single-page flow]
├── onboarding/                     [Placeholder directories]
│   ├── upload/                     [Empty, no page.tsx]
│   ├── preferences/                [Empty, no page.tsx]
│   └── review/                     [Empty, no page.tsx]
└── api/
    ├── health/
    │   └── route.ts                [GET /api/health]
    ├── upload/
    │   └── route.ts                [POST /api/upload, CV parsing]
    └── chat/
        └── route.ts                [POST /api/chat, MCP Agent]
```

## Historical Context (from thoughts/)

No existing research documents found in `thoughts/` directory for this specific topic.

## Related Research

None at this time. This is the first comprehensive documentation of the single-page flow implementation.

## Key Takeaways for Multi-Step Separation

### What Needs to Be Separated:

1. **Step 1: CV Upload Page** (`/onboarding/upload`)
   - Move `FileUpload` component to dedicated page
   - Store parsed CV data (needs persistence strategy)
   - Navigate to preferences on success

2. **Step 2: Preferences Page** (`/onboarding/preferences`)
   - Move preference components to dedicated page
   - Connect to `preference-store.ts` logic (currently unused)
   - Implement validation using `preference-collector.ts`
   - Store preferences (needs persistence strategy)
   - Navigate to chat on completion

3. **Step 3: Chat Page** (`/` or `/chat`)
   - Keep `ChatInterface` component
   - Load CV data and preferences from storage
   - Remove embedded preference panel
   - Enable full chat functionality

### Technical Considerations:

1. **Persistence Required:**
   - Currently no data persists between pages
   - Need to implement: localStorage, sessionStorage, or server-side session
   - Must persist both CV data and preferences

2. **Navigation:**
   - Need to implement page navigation (Next.js router)
   - Consider redirect logic (if no CV, redirect to upload)
   - Consider progress indicator

3. **State Management:**
   - Current local state won't work across pages
   - Options: URL params, localStorage, React Context, or server state
   - Should integrate existing `preference-store.ts` logic

4. **Validation:**
   - Need to validate at each step before allowing navigation
   - Integrate existing validation logic from `preference-collector.ts`
   - Show validation errors appropriately

5. **User Experience:**
   - Consider allowing users to go back and edit
   - Show progress through steps
   - Handle page refresh gracefully

### Components Already Exist:

✅ `FileUpload` - Ready to move to upload page  
✅ `PreferenceStep*` components - Ready to move to preferences page  
✅ `ChatInterface` - Ready to use as final step  
✅ `preference-store.ts` - Exists but needs integration  
✅ `preference-collector.ts` - Validation logic ready to use  
✅ `preference-normalizer.ts` - Data normalization ready to use  

### What's Missing:

❌ Page files for `/onboarding/upload`, `/onboarding/preferences`, `/onboarding/review`  
❌ Persistence mechanism for CV and preference data  
❌ Navigation logic between steps  
❌ Integration of preference store with UI components  
❌ Validation trigger on step completion  
❌ Progress indicator UI  
❌ Redirect logic for incomplete flows  

---

**Documentation End**
