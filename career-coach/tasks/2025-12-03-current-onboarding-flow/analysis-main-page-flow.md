# Analysis: Main Page Single-Flow Implementation

## Overview
The main page (`src/app/(chat)/page.tsx`) implements a linear, single-page flow where users first upload their CV, then interact with a chat interface that embeds preference collection. The flow is controlled by a single state variable (`userCVParsedProfile`) that toggles between the upload screen and the chat interface.

## Entry Points
- `src/app/(chat)/page.tsx:7` - Default export `Home()` component serves as the main entry point
- `src/app/api/upload/route.ts:24` - POST endpoint handles CV file upload and parsing
- `src/app/api/chat/route.ts:16` - POST endpoint handles chat message streaming

---

## Core Implementation

### 1. Page Component State Management (`src/app/(chat)/page.tsx`)

#### State Declaration (Lines 8-112)
```tsx
const [userCVParsedProfile, setUserCVParsedProfile] = useState<UserCVParsed | null>({
  // Hardcoded sample data with skills, workExperience, education arrays
});
```

**How it works:**
- Single React state variable `userCVParsedProfile` of type `UserCVParsed | null`
- Currently initialized with hardcoded mock data (lines 8-112)
- Mock data includes 60+ skills, 4 work experience entries, and 1 education entry
- This state controls the entire UI flow through conditional rendering

#### Conditional Rendering Logic (Lines 115-148)

**Upload Screen** (Lines 116-129):
```tsx
{!userCVParsedProfile ? (
  <div className="flex flex-col items-center justify-center h-full gap-6 p-6">
    <FileUpload
      onUploaded={(info) => {
        if (info.profile) setUserCVParsedProfile(info.profile);
      }}
    />
  </div>
) : (
  // Chat interface
)}
```

**How conditional rendering works:**
- If `userCVParsedProfile` is `null`: Shows upload screen with `FileUpload` component
- If `userCVParsedProfile` has data: Shows chat interface with parsed CV summary
- The `onUploaded` callback receives parsed profile and updates state via `setUserCVParsedProfile`
- State update triggers re-render, switching from upload to chat view

**Chat Screen** (Lines 131-145):
```tsx
<div className="flex flex-col h-full w-full">
  <div className="px-4 py-2 text-xs bg-gray-50 ...">
    <span>Parsed {userCVParsedProfile.skills?.length || 0} skills, ...</span>
  </div>
  <div className="flex flex-col flex-1 min-h-0">
    <ChatInterface userCVInfo={userCVParsedProfile} />
  </div>
</div>
```

**How the chat screen works:**
- Displays summary bar showing counts of skills, work experience, and education entries
- Passes `userCVParsedProfile` as `userCVInfo` prop to `ChatInterface`
- Uses `min-h-0` CSS trick to enable proper scrolling in nested flex containers

---

### 2. CV Upload Flow (`src/components/upload/FileUpload.tsx`)

#### Component Props Interface (Lines 8-12)
```tsx
interface FileUploadProps {
  onUploaded: (result: { filename: string; size: number; profile?: UserCVParsed }) => void;
  onUploadInitiated?: (file: File) => void;
  onUploadError?: (errorMessage: string) => void;
}
```

#### File Validation (Lines 22-31)
```tsx
const handleFiles = async (fileList: FileList | null) => {
  if (file.type !== 'application/pdf') {
    setValidationError('Please upload a PDF file.');
    return;
  }
  if (file.size > 5 * 1024 * 1024) {
    setValidationError('File too large (max 5MB).');
    return;
  }
```

**How validation works:**
- Checks file type is `application/pdf`
- Checks file size is under 5MB (5 * 1024 * 1024 bytes)
- Sets local `validationError` state on failure
- Validation occurs before API call

#### API Communication (Lines 33-44)
```tsx
const form = new FormData();
form.append('file', file);
onUploadInitiated?.(file);
const result = await makeRequest('/api/upload', { method: 'POST', body: form });
if (result) {
  if (!result.success) {
    onUploadError?.(result.message || 'Upload failed');
    return;
  }
  onUploaded({ filename: file.name, size: file.size, profile: result.profile });
}
```

**How API communication works:**
- Creates `FormData` with file attached
- Calls optional `onUploadInitiated` callback before API request
- Uses `useApiFetcher` hook's `makeRequest` function to POST to `/api/upload`
- On success with `result.success === true`: Calls `onUploaded` with filename, size, and parsed `profile`
- On failure: Calls optional `onUploadError` callback
- The `profile` returned from API is type `UserCVParsed`

#### State Management (Lines 17-20)
```tsx
const [dragActive, setDragActive] = useState(false);
const [validationError, setValidationError] = useState<string | null>(null);
const [{ loading, error: apiError, response }, makeRequest] = useApiFetcher<any, any>();
```

**How state is managed:**
- `dragActive`: Controls drag-and-drop UI styling
- `validationError`: Local validation errors (file type, size)
- `useApiFetcher` returns: `loading` (boolean), `apiError` (API errors), `response` (API response), `makeRequest` (function)
- Loading state disables upload button during API call (line 88)

---

### 3. API Upload Endpoint (`src/app/api/upload/route.ts`)

#### Request Validation (Lines 28-45)
```tsx
export async function POST(req: Request) {
  const contentType = req.headers.get('content-type') || '';
  if (!contentType.includes('multipart/form-data')) {
    return NextResponse.json({ success: false, message: 'Invalid content type' }, { status: 400 });
  }
  const formData = await req.formData();
  const file = formData.get('file');
  if (!(file instanceof File)) {
    return NextResponse.json({ success: false, message: 'File missing' }, { status: 400 });
  }
  // Additional validation for PDF type and size...
```

**How request validation works:**
- Checks `Content-Type` header includes `multipart/form-data`
- Extracts file from `FormData` using `formData.get('file')`
- Validates file is instance of `File`
- Re-validates PDF type and 5MB size constraint server-side

#### PDF Parsing (Lines 47-51)
```tsx
const arrayBuffer = await file.arrayBuffer();
const buffer = Buffer.from(arrayBuffer);
const parser = new PDFParse({ data: buffer });
const fullText = (await parser.getText())?.text?.replace(/\s+$/g, '').trim();
```

**How PDF parsing works:**
- Converts `File` to `ArrayBuffer` using `file.arrayBuffer()`
- Creates Node.js `Buffer` from ArrayBuffer
- Instantiates `PDFParse` with buffer data
- Calls `parser.getText()` to extract text content
- Cleans extracted text by removing trailing whitespace

#### LLM-Based Extraction (Lines 54-67)
```tsx
const prompt = `You are a CV parsing assistant. Extract structured data from the provided resume text into strictly valid JSON schema.\n\nResume Text:\n"""\n${fullText}\n"""`;

const agent = await Agent.initialize({
  llm,
  name: 'cv_parser',
  description: 'Parses CV PDF text into structured profile context.',
  serverConfigs: [],
});

const llmResponse = await agent.generateStr(prompt, { 
  responseFormat: profileContextSchemaResponseFormat as any, 
  stream: true 
});
```

**How LLM extraction works:**
- LLM instance (`llm`) initialized outside handler at line 21 for reuse across requests
- LLM is `LLMFireworks` with model from env var `OPENAI_MODEL`, maxTokens: 1536, temperature: 0.2
- Creates prompt embedding full PDF text
- Initializes MCP Agent with no external tool servers (`serverConfigs: []`)
- Calls `agent.generateStr()` with structured response format enforced
- Response format defined at lines 81-124 as JSON schema with strict validation

#### Response Schema (Lines 81-124)
```tsx
export const profileContextSchemaResponseFormat = {
  type: 'json_schema',
  json_schema: {
    name: 'parsed_profile',
    strict: true,
    schema: {
      properties: {
        skills: { type: 'array', maxItems: 200, items: { type: 'string' } },
        workExperience: {
          type: 'array',
          items: {
            properties: {
              companyName: { type: 'string' },
              startDate: { type: 'string' },
              endDate: { type: 'string', nullable: true },
              summary: { type: 'string' }
            }
          }
        },
        education: { type: 'array', items: { type: 'string' } }
      }
    }
  }
}
```

**How schema validation works:**
- Defines structured output format for LLM response
- `skills`: Array of strings, max 200 items
- `workExperience`: Array of objects with companyName, startDate, endDate (nullable), summary
- `education`: Array of strings
- Strict mode enforces exact schema compliance

#### Validation and Response (Lines 69-77)
```tsx
const jsonMatch = llmResponse.match(/\{[\s\S]*\}/);
const parsed = JSON.parse(jsonMatch?.[0] || '{}');
const validation = UserCVParsedSchema.safeParse(parsed);
if (!validation.success) {
  return NextResponse.json({ success: false, message: 'Validation failed', issues: validation.error.issues }, { status: 422 });
}
const profile: UserCVParsed = validation.data;
return NextResponse.json({ success: true, message: 'File uploaded & parsed', profile });
```

**How validation works:**
- Extracts JSON object from LLM response using regex
- Parses JSON string to object
- Validates against `UserCVParsedSchema` (Zod schema from `src/types/user-data.ts`)
- On validation failure: Returns 422 status with validation issues
- On success: Returns parsed `profile` object

---

### 4. Chat Interface with Embedded Preferences (`src/components/chat/ChatInterface.tsx`)

#### Component Props and State (Lines 18-40)
```tsx
export default function ChatInterface({ userCVInfo }: { userCVInfo: UserCVParsed }) {
  const { messages, sendMessage, status } = useChat({
    transport: new TextStreamChatTransport({ api: '/api/chat' }),
    messages: [
      {
        id: generateId(), 
        role: 'system', 
        parts: [{
          type: 'text',
          text: `You are an intelligent job search assistant. Analyze the CV which contains skills, work experiences.\nSearch the internet for current job opportunities that match the my qualifications and interests.\nCV:\n${JSON.stringify(userCVInfo)}`
        }]
      }
    ]
  });

  const [compactHeader, setCompactHeader] = useState(false);
  const [preference, setPreference] = useState<PreferenceProfile>({
    workArrangements: [],
    locations: [],
    companyStages: [],
    interests: '',
    valid: false
  });
```

**How state initialization works:**
- Receives `userCVInfo` prop (type `UserCVParsed`) from parent page component
- Uses Vercel AI SDK's `useChat` hook with `TextStreamChatTransport` pointing to `/api/chat`
- Initializes with system message embedding serialized CV data via `JSON.stringify(userCVInfo)`
- `messages`: Array of chat messages
- `sendMessage`: Function to send new messages
- `status`: Current chat state ('idle', 'submitted', 'streaming')
- Local `preference` state tracks user preference selections
- Local `compactHeader` state controls header size on scroll

#### Scroll-Based Header Compaction (Lines 48-57)
```tsx
const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
  const top = e.currentTarget.scrollTop;
  if (top > 16) {
    if (!compactHeader) setCompactHeader(true);
  } else if (compactHeader) {
    setCompactHeader(false);
  }
};
```

**How scroll handling works:**
- Attached to `CardContent`'s `onScroll` event (line 69)
- When scroll position exceeds 16px: Sets `compactHeader` to `true`
- When scrolled back to top: Sets `compactHeader` to `false`
- Header padding changes from `py-4` to `py-1` (line 68)
- Title font size changes from `text-lg` to `text-base` (line 69)

#### Preference UI Embedding (Lines 70-100)
```tsx
<CardContent onScroll={handleScroll} className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
  {!preference.valid && (
    <div className="p-3 border rounded bg-white dark:bg-gray-900 space-y-6">
      <div className="space-y-2">
        <h3 className="text-sm font-semibold">Work Arrangement</h3>
        <PreferenceStepWorkArrangement
          values={preference?.workArrangements || []}
          onChange={(vals) => { setPreference(prev => ({ ...prev, workArrangements: vals })); }}
        />
      </div>
      <div className="space-y-2">
        <h3 className="text-sm font-semibold">Location</h3>
        <PreferenceStepLocation
          values={preference?.locations || []}
          inPersonOnly={preference?.workArrangements?.length === 1 && preference.workArrangements[0] === 'In-Person'}
          onChange={(vals) => { setPreference(prev => ({ ...prev, locations: vals })); }}
        />
      </div>
      <div className="space-y-2">
        <h3 className="text-sm font-semibold">Company Stage (Optional)</h3>
        <PreferenceStepCompanyStage
          values={preference?.companyStages || []}
          onChange={(vals) => { setPreference(prev => ({ ...prev, companyStages: vals })); }}
        />
      </div>
    </div>
  )}
</CardContent>
```

**How preference embedding works:**
- Preferences shown conditionally when `preference.valid === false` (line 71)
- Three preference components rendered in sequence:
  1. `PreferenceStepWorkArrangement` (line 75)
  2. `PreferenceStepLocation` (line 81) - receives `inPersonOnly` prop based on work arrangement selection
  3. `PreferenceStepCompanyStage` (line 89) - marked as optional
- Each component receives `values` from local preference state
- Each `onChange` callback updates local state via `setPreference` with spread operator
- All three components render simultaneously (not a stepped wizard)
- Helper text at line 96 indicates chat is disabled during preference selection

#### Chat Input Disabling Logic (Lines 117-125, 140-145)
```tsx
function ChatInput({ onSendMessage, status }: { ... }) {
  const isSubmitting = status === 'submitted' || status === 'streaming'
  const prefState = getPreferenceState();
  const chatDisabled = prefState.active; // FR-001A

  return (
    <form onSubmit={onSubmit} className="flex items-start w-full space-x-2">
      <Button variant="ghost" size="icon" disabled={isSubmitting || chatDisabled} ...>
      <Textarea ... disabled={isSubmitting || chatDisabled} .../>
      <Button type="submit" ... disabled={isSubmitting || chatDisabled} ...>
    </form>
  )
}
```

**How chat disabling works:**
- Calls `getPreferenceState()` from `conversation-handler.ts` (line 143)
- Sets `chatDisabled` to `true` when preference flow is active
- Disables all chat input controls (attach button, textarea, send button) when `chatDisabled || isSubmitting`
- Shows screen reader hint when disabled (line 149-151)
- NOTE: `getPreferenceState().active` returns `preferenceFlowActive` variable from conversation handler

---

### 5. Preference State Management (`src/libs/chat/conversation-handler.ts`)

#### Module-Level State (Lines 15-17)
```tsx
let preferenceFlowActive = false;
let currentStepIndex = 0;
const steps: PreferenceStepKey[] = ['workArrangements', 'locations', 'companyStages'];
```

**How module-level state works:**
- Module maintains three variables outside function scope
- `preferenceFlowActive`: Boolean flag controlling preference flow state
- `currentStepIndex`: Numeric index for current step (not currently used in UI)
- `steps`: Array defining step order
- These variables persist across component renders and API calls

#### State Initialization (Lines 19-25)
```tsx
export function startPreferencesFlow() {
  if (!preferenceFlowActive) {
    initDraft();
    preferenceFlowActive = true;
    currentStepIndex = 0;
    emitStarted();
  }
}
```

**How initialization works:**
- Only initializes if not already active
- Calls `initDraft()` from `preference-store.ts` to create draft object
- Sets `preferenceFlowActive` to `true`
- Resets `currentStepIndex` to 0
- Emits analytics event via `emitStarted()`
- NOTE: This function is exported but not called anywhere in the current implementation

#### State Getter (Lines 27-38)
```tsx
export function getPreferenceState(): PreferenceState {
  const draft = getDraft();
  const validation = draft ? validateAndNormalizeDraft(draft) : { errors: {}, valid: false, normalized: {} } as any;
  return {
    active: preferenceFlowActive,
    currentStepIndex,
    steps,
    draft,
    errors: validation.errors,
    completed: isFlowCompleted(validation)
  };
}
```

**How state retrieval works:**
- Called from `ChatInput` component (line 143 of ChatInterface.tsx)
- Retrieves draft from `preference-store.ts` via `getDraft()`
- Validates draft using `validateAndNormalizeDraft()` from `preference-normalizer.ts`
- Returns `PreferenceState` object containing:
  - `active`: Current value of `preferenceFlowActive` module variable
  - `currentStepIndex`: Current step index
  - `steps`: Array of step keys
  - `draft`: Current draft object or null
  - `errors`: Validation errors keyed by field
  - `completed`: Result of `isFlowCompleted()` check

#### Step Update Logic (Lines 46-56)
```tsx
export function updatePreferenceStep(step: PreferenceStepKey, values: string[]) {
  const draft = getDraft() || initDraft();
  if (step === 'workArrangements') {
    const prunedLocations = enforceConditionalLocationRule(values, draft.locations);
    updateDraft({ workArrangements: values, locations: prunedLocations });
  } else if (step === 'locations') {
    updateDraft({ locations: values });
  } else if (step === 'companyStages') {
    updateDraft({ companyStages: values });
  }
}
```

**How step updates work:**
- Receives step key and new values array
- Gets or initializes draft
- Special handling for `workArrangements`: Calls `enforceConditionalLocationRule()` which removes non-applicable locations when switching to "In-Person" only
- Updates draft store via `updateDraft()` with new values
- NOTE: This function is exported but not called anywhere in the current implementation

#### Step Advancement (Lines 58-76)
```tsx
export function advancePreferenceStep() {
  const draft = getDraft();
  if (!draft) return;
  const validation = validateAndNormalizeDraft(draft);
  const currentStep = steps[currentStepIndex];
  if (!validation.errors[currentStep]) {
    emitStepCompleted(currentStep);
    currentStepIndex += 1;
  }
  if (currentStepIndex >= steps.length) {
    const profileSummary = {
      arrangements: draft.workArrangements.length,
      locations: draft.locations.length,
      companyStages: draft.companyStages.length,
      interests: draft.interests.length,
    };
    emitConfirmed(profileSummary);
  }
}
```

**How advancement works:**
- Validates current draft
- Checks if current step has no errors
- If valid: Emits step completion event and increments `currentStepIndex`
- When all steps completed: Emits confirmed event with summary counts
- NOTE: This function is exported but not called anywhere in the current implementation

---

### 6. Preference Components

#### Work Arrangement Component (`src/components/preferences/PreferenceStepWorkArrangement.tsx`)

```tsx
export const PreferenceStepWorkArrangement: React.FC<Props> = ({ values, onChange, errors }) => {
  return (
    <div className="space-y-2">
      <MultiSelect 
        label="Work Arrangement" 
        options={[...WORK_ARRANGEMENT_OPTIONS]} 
        selected={values} 
        onChange={onChange} 
      />
      {errors && errors.length > 0 && (
        <div className="text-xs text-red-600" role="alert">{errors.join(', ')}</div>
      )}
    </div>
  );
};
```

**How the component works:**
- Receives `values` (current selections), `onChange` (callback), and optional `errors`
- Renders `MultiSelect` component with work arrangement options from constants
- Options loaded from `WORK_ARRANGEMENT_OPTIONS` constant
- Displays validation errors below the select if present
- `onChange` called directly by `MultiSelect` with new values array

---

## Data Flow Summary

### CV Upload → Chat Flow

```
1. User drops/selects PDF file
   └─> FileUpload component (lines 22-31)
       └─> Client-side validation (PDF, 5MB limit)

2. File passes validation
   └─> useApiFetcher.makeRequest() (line 36)
       └─> POST /api/upload with FormData

3. API receives file
   └─> src/app/api/upload/route.ts:24
       └─> Server-side validation (lines 28-45)
       └─> PDF text extraction (lines 47-51)
       └─> LLM-based parsing (lines 54-67)
       └─> Schema validation (lines 69-74)
       └─> Returns { success: true, profile: UserCVParsed }

4. FileUpload receives response
   └─> Calls onUploaded callback (line 42)
       └─> Page component's setUserCVParsedProfile() (page.tsx:120)
           └─> State update triggers re-render

5. Re-render with userCVParsedProfile !== null
   └─> Conditional renders chat interface (page.tsx:131-145)
       └─> ChatInterface receives userCVInfo prop
           └─> Embedded in system message (ChatInterface.tsx:24-30)
```

### Preferences → Chat Flow

```
1. ChatInterface initializes with preference.valid = false
   └─> Lines 35-40 in ChatInterface.tsx

2. Preference panel renders (not valid)
   └─> Lines 71-98 show all three preference components simultaneously
       └─> PreferenceStepWorkArrangement
       └─> PreferenceStepLocation (with inPersonOnly conditional)
       └─> PreferenceStepCompanyStage

3. User selects values in any component
   └─> MultiSelect calls onChange callback
       └─> setPreference updates local state (lines 78, 86, 93)
           └─> Immutable update with spread operator: { ...prev, field: vals }

4. Chat remains disabled
   └─> ChatInput reads getPreferenceState().active (line 143)
       └─> NOTE: preferenceFlowActive never set to true in current implementation
       └─> chatDisabled = false (preferences not actually blocking chat)
       └─> Chat input should be enabled despite preference UI showing

5. No automatic flow completion
   └─> preference.valid remains false (never updated)
   └─> Preference panel never hides
   └─> No integration between local preference state and conversation-handler module
```

### Chat Message Flow

```
1. User types message and submits
   └─> ChatInput.onSubmit (ChatInterface.tsx:133)
       └─> Calls onSendMessage (line 60)
           └─> useChat.sendMessage({ text: message }) (line 61)

2. Vercel AI SDK sends request
   └─> POST /api/chat with messages array
       └─> Includes system message with CV data (line 24-30)

3. API receives messages
   └─> src/app/api/chat/route.ts:16
       └─> Converts AI SDK format to model messages (lines 31-37)
       └─> Extracts latest user message (line 38)
       └─> Creates SimpleMemory from message history (line 39)

4. Orchestrator processes request
   └─> Initializes researcher agent with search_web MCP server (lines 21-29)
       └─> Creates Orchestrator with LLM, agents, history (lines 41-45)
       └─> Generates streaming response (line 95)

5. Response streams back to client
   └─> ReadableStream with workflow events (lines 47-92)
       └─> Formats events as text chunks (lines 49-79)
       └─> useChat hook updates messages state
           └─> UI re-renders with new messages
```

---

## Key Patterns

### Single State Toggle Pattern
- **Location**: `src/app/(chat)/page.tsx:8`
- **Pattern**: Single nullable state variable controls entire flow
- **Implementation**: `userCVParsedProfile` being `null` vs non-null determines UI
- **Transition**: One-way transition from upload → chat (no back navigation)

### Hardcoded Mock Data Pattern
- **Location**: `src/app/(chat)/page.tsx:8-112`
- **Pattern**: State initialized with sample data instead of `null`
- **Impact**: Upload screen bypassed, chat interface shows immediately
- **Note**: Contradicts conditional rendering logic at line 116

### Prop Drilling Pattern
- **Location**: `src/app/(chat)/page.tsx:120` → `ChatInterface.tsx:18`
- **Pattern**: CV data passed down through props
- **Flow**: Page state → ChatInterface prop → useChat system message
- **Data**: Serialized as JSON string in system message (ChatInterface.tsx:29)

### Embedded System Message Pattern
- **Location**: `src/components/chat/ChatInterface.tsx:20-31`
- **Pattern**: CV data embedded in initial system message
- **Format**: JSON stringified CV object in message content
- **Purpose**: Provides context to LLM for all chat interactions

### Module-Level State Pattern
- **Location**: `src/libs/chat/conversation-handler.ts:15-17`
- **Pattern**: State persisted in module scope outside React lifecycle
- **Variables**: `preferenceFlowActive`, `currentStepIndex`, `steps`
- **Access**: Via exported getter/setter functions

### Disconnected State Pattern
- **Location**: `ChatInterface.tsx:35-40` vs `conversation-handler.ts`
- **Pattern**: Two separate state systems for same feature
- **Issue**: Local component state (`preference`) not synchronized with module state
- **Impact**: Preference flow functions (`startPreferencesFlow`, `updatePreferenceStep`, `advancePreferenceStep`) not integrated with UI

### Simultaneous Preference Display Pattern
- **Location**: `src/components/chat/ChatInterface.tsx:71-98`
- **Pattern**: All preference options shown at once, not as stepped wizard
- **Layout**: Vertical stack with Work Arrangement → Location → Company Stage
- **Validation**: No enforcement preventing incomplete preferences

### Conditional Location Rule Pattern
- **Location**: `ChatInterface.tsx:84` and `conversation-handler.ts:49`
- **Pattern**: Location options depend on work arrangement selection
- **Logic**: When `workArrangements === ['In-Person']`, pass `inPersonOnly={true}` prop
- **Enforcement**: `enforceConditionalLocationRule()` prunes incompatible locations

### Custom Hook API Fetcher Pattern
- **Location**: `src/libs/hooks/useApiFetcher.ts`
- **Pattern**: Reusable hook for API requests with lifecycle state
- **Returns**: `[state, makeRequest]` tuple
- **State**: `{ response, loading, success, error }`
- **Features**: Automatic abort on unmount, safe dispatch after unmount

### Stream Event Formatting Pattern
- **Location**: `src/app/api/chat/route.ts:49-79`
- **Pattern**: Convert MCP workflow events to text chunks
- **Events**: WORKFLOW_START, TASK_START, TASK_END, STEP_START, STEP_END, WORKFLOW_END
- **Format**: Human-readable markdown formatted messages
- **Transport**: Server-sent events via ReadableStream

### LLM Structured Output Pattern
- **Location**: `src/app/api/upload/route.ts:64-66`
- **Pattern**: Enforce JSON schema on LLM response
- **Schema**: `profileContextSchemaResponseFormat` (lines 81-124)
- **Validation**: Dual validation (LLM response format + Zod schema)
- **Extraction**: Regex extraction of JSON from response (line 69)

---

## State Flow Diagram

```
┌─────────────────────┐
│ Page Component      │
│  (page.tsx)         │
│                     │
│  userCVParsedProfile│◄─────┐
│  (hardcoded data)   │      │
└──────────┬──────────┘      │
           │                 │
           │ conditional     │
           │ render          │
           │                 │
           ▼                 │
  ┌────────────────┐         │
  │ Upload Screen  │         │ onUploaded
  │  (hidden)      │         │ callback
  │                │         │
  │  FileUpload ───┼─────────┘
  └────────────────┘
           │
           │ user drops file
           │
           ▼
  ┌────────────────┐
  │ API Upload     │
  │  (route.ts)    │
  │                │
  │  PDF Parse     │
  │  LLM Extract   │
  │  Validate      │
  └────────┬───────┘
           │
           │ returns UserCVParsed
           │
           ▼
  ┌────────────────────────┐
  │ Chat Interface         │
  │  (ChatInterface.tsx)   │
  │                        │
  │  ┌──────────────────┐  │
  │  │ Local State:     │  │
  │  │  preference      │  │
  │  │  compactHeader   │  │
  │  └──────────────────┘  │
  │                        │
  │  ┌──────────────────┐  │
  │  │ Preference Panel │  │
  │  │  (always shown)  │  │
  │  └──────────────────┘  │
  │                        │
  │  ┌──────────────────┐  │
  │  │ Chat Messages    │  │
  │  │  (commented out) │  │
  │  └──────────────────┘  │
  │                        │
  │  ┌──────────────────┐  │
  │  │ Chat Input       │  │
  │  └──────────────────┘  │
  └────────────────────────┘
           │
           │ sendMessage
           │
           ▼
  ┌────────────────┐
  │ API Chat       │
  │  (route.ts)    │
  │                │
  │  Orchestrator  │
  │  Researcher    │
  │  MCP Search    │
  └────────────────┘

┌──────────────────────────┐
│ Conversation Handler     │
│  (Module State)          │
│                          │
│  preferenceFlowActive    │
│    (never set to true)   │
│                          │
│  currentStepIndex        │
│    (not used)            │
│                          │
│  Functions:              │
│   - startPreferencesFlow │
│     (not called)         │
│   - getPreferenceState   │
│     (called by ChatInput)│
│   - updatePreferenceStep │
│     (not called)         │
│   - advancePreferenceStep│
│     (not called)         │
└──────────────────────────┘
```

---

## Integration Points

### FileUpload → Page Component
- **Connection**: `onUploaded` callback prop
- **Data**: `{ filename: string, size: number, profile?: UserCVParsed }`
- **Trigger**: Successful API response with parsed profile
- **Effect**: Updates page state, triggers re-render to show chat

### Page Component → ChatInterface
- **Connection**: `userCVInfo` prop
- **Data**: `UserCVParsed` object
- **Timing**: Passed when `userCVParsedProfile` is not null
- **Effect**: Initializes chat with CV context

### ChatInterface → useChat Hook
- **Connection**: `messages` prop initialization
- **Data**: System message with embedded CV JSON
- **Format**: `JSON.stringify(userCVInfo)`
- **Effect**: All chat requests include CV context

### ChatInterface → API Chat Endpoint
- **Connection**: Vercel AI SDK `transport` configuration
- **Endpoint**: `/api/chat`
- **Protocol**: HTTP POST with streaming response
- **Data**: Messages array including system message with CV

### ChatInput → Conversation Handler
- **Connection**: `getPreferenceState()` function call
- **Purpose**: Check if chat should be disabled
- **Current Behavior**: Returns `active: false` (preferences not blocking)
- **Expected Behavior**: Should return `active: true` when preferences not complete

### Preference Components → ChatInterface State
- **Connection**: `onChange` callback props
- **Data**: Array of selected string values
- **Update**: Direct state update via `setPreference` with spread operator
- **No Connection**: To conversation-handler module functions

### FileUpload → useApiFetcher Hook
- **Connection**: Hook usage for API communication
- **Method**: `makeRequest('/api/upload', { method: 'POST', body: FormData })`
- **State**: `loading`, `error`, `response` provided by hook
- **Effect**: Disables UI during upload, shows errors

---

## Current Implementation Gaps

### 1. Preference Flow Not Activated
- **Location**: `conversation-handler.ts:19-25`
- **Function**: `startPreferencesFlow()` is exported but never called
- **Impact**: `preferenceFlowActive` remains `false`
- **Result**: Chat input never actually disabled by preference state

### 2. Preference State Disconnection
- **Local State**: `ChatInterface.tsx:35-40` maintains `preference` object
- **Module State**: `conversation-handler.ts:15-17` maintains separate state
- **Gap**: No synchronization between the two
- **Impact**: Module functions don't reflect actual user selections

### 3. Preference Validation Not Enforced
- **Location**: `ChatInterface.tsx:71`
- **Condition**: `!preference.valid` always true (valid never set)
- **Impact**: Preference panel never hides
- **Gap**: No logic to set `preference.valid = true`

### 4. Step Advancement Not Used
- **Location**: `conversation-handler.ts:58-76`
- **Function**: `advancePreferenceStep()` not called
- **Impact**: `currentStepIndex` never increments
- **Gap**: No UI integration for step progression

### 5. Preference Updates Not Propagated
- **Location**: `conversation-handler.ts:46-56`
- **Function**: `updatePreferenceStep()` not called
- **Impact**: Module state never updated with user selections
- **Gap**: onChange callbacks only update local component state

### 6. Chat Messages Not Displayed
- **Location**: `ChatInterface.tsx:102-108`
- **Code**: Message rendering commented out
- **Impact**: No visible chat history
- **Gap**: Core chat functionality disabled

### 7. Hardcoded CV Data
- **Location**: `page.tsx:8-112`
- **Issue**: State initialized with mock data instead of `null`
- **Impact**: Upload screen never shown
- **Gap**: Upload flow cannot be tested

### 8. No Preference Completion Flow
- **Gap**: No mechanism to mark preferences complete
- **Impact**: Cannot transition from preference collection to chat interaction
- **Missing**: Button or automatic validation to set `preference.valid = true`

### 9. No Preference → Chat Context Integration
- **Gap**: Selected preferences not passed to chat API
- **Impact**: Chat cannot personalize responses based on preferences
- **Missing**: Preferences should be included in system message or request body

### 10. No Back Navigation
- **Pattern**: One-way flow from upload → chat
- **Gap**: No way to return to upload screen
- **Gap**: No way to edit CV after upload
- **Impact**: Users cannot correct upload mistakes

---

This analysis documents the current implementation as it exists, including the gaps between different state management systems and the incomplete integration of the preference collection flow with the chat interface.
