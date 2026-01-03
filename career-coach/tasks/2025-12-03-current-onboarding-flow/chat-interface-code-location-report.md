# Chat Interface Code Location Report

Generated: December 3, 2025

## Overview
This document maps all files and components related to the chat interface functionality in the career-coach codebase. The chat system is built using the Vercel AI SDK (`@ai-sdk/react`) and Next.js 15 App Router, with custom MCP agent orchestration for AI-powered interactions.

---

## File Locations for Chat Interface

### 1. UI Components (Client-Side)

#### `src/components/chat/ChatInterface.tsx`
**Location**: `/Users/joshuacalpuerto/projects/ML-guide/career-coach/src/components/chat/ChatInterface.tsx`
**Type**: React Client Component (195 lines)
**Purpose**: Main chat interface container component

**Key Features**:
- Uses Vercel AI SDK's `useChat` hook from `@ai-sdk/react`
- Integrates `TextStreamChatTransport` for streaming responses
- Manages chat state (messages, status)
- Embeds preference selection UI (work arrangements, location, company stage)
- Implements scrollable chat container with dynamic header (shrinks on scroll)
- Contains `ChatInput` sub-component for message composition
- Disables chat input during preference collection flow

**Dependencies**:
- `@ai-sdk/react` - useChat hook
- `ai` - TextStreamChatTransport, generateId
- `MessageBubble` component
- Preference step components (PreferenceStepWorkArrangement, PreferenceStepLocation, PreferenceStepCompanyStage)
- `@/libs/chat/conversation-handler` - startPreferencesFlow, getPreferenceState, updatePreferenceStep
- `@/types/user-data` - UserCVParsed, PreferenceProfile types
- shadcn-ui components (Button, Card, Textarea)
- lucide-react icons (Send, Paperclip, Loader2)

**Props**:
- `userCVInfo: UserCVParsed` - Parsed CV data passed from parent

**State Management**:
- `compactHeader: boolean` - Controls header size based on scroll position
- `preference: PreferenceProfile` - Stores user preference selections (workArrangements, locations, companyStages, interests, valid)
- AI SDK manages: `messages`, `sendMessage`, `status` via useChat hook

**Connection Points**:
- API endpoint: `/api/chat`
- Imports `MessageBubble` for rendering individual messages
- Imports conversation handler functions for preference flow state

---

#### `src/components/chat/MessageBubble.tsx`
**Location**: `/Users/joshuacalpuerto/projects/ML-guide/career-coach/src/components/chat/MessageBubble.tsx`
**Type**: React Component (107 lines)
**Purpose**: Individual message renderer with markdown support

**Key Features**:
- Renders messages with role-based styling (user vs AI)
- Uses `react-markdown` for rich text formatting
- Custom markdown component renderers for code blocks, links, lists, etc.
- Avatar display for user and AI
- Responsive layout with max-width constraints (75%)

**Dependencies**:
- `ai` - UIMessage type
- `clsx` - Conditional class names
- `@/components/ui/avatar` - Avatar components
- `react-markdown` - Markdown parsing and rendering

**Props**:
- `message: UIMessage` - Message object from AI SDK

**Rendering Logic**:
- Maps through message parts (supports multi-part messages)
- Only renders `text` type parts
- Applies different styles for user (blue background) vs AI (gray background)
- Custom code block styling with syntax highlighting container

---

### 2. Page Component (Entry Point)

#### `src/app/(chat)/page.tsx`
**Location**: `/Users/joshuacalpuerto/projects/ML-guide/career-coach/src/app/(chat)/page.tsx`
**Type**: Client Component / Page Route (139 lines)
**Purpose**: Main chat page with CV upload flow

**Key Features**:
- Two-phase UI: CV upload → Chat interface
- Contains mock/default UserCVParsed data (pre-populated for testing)
- Conditional rendering based on `userCVParsedProfile` state
- Displays parsed CV metadata (skills count, work experience count, education count)
- Responsive layout with fixed height container (75vh)

**State Management**:
- `userCVParsedProfile: UserCVParsed | null` - Stores uploaded CV data

**Components Used**:
- `FileUpload` - Handles CV file upload
- `ChatInterface` - Main chat UI (shown after CV upload)

**Route Group**: 
- Wrapped in `(chat)` route group (parallel route pattern)
- Accessible at root path `/`

**Connection Points**:
- Passes parsed CV data to ChatInterface component
- Integrates with FileUpload component's onUploaded callback

---

### 3. API Endpoints (Server-Side)

#### `src/app/api/chat/route.ts`
**Location**: `/Users/joshuacalpuerto/projects/ML-guide/career-coach/src/app/api/chat/route.ts`
**Type**: Next.js Route Handler (114 lines)
**Purpose**: Chat API endpoint with MCP agent orchestration

**Key Features**:
- POST endpoint for processing chat messages
- Uses `@joshuacalpuerto/mcp-agent` for AI orchestration
- Integrates Fireworks LLM (`LLMFireworks`)
- Implements streaming response via ReadableStream
- Sets up researcher agent with web search capabilities (Smithery/Exa MCP)
- Converts Vercel AI SDK messages to MCP agent format
- Uses SimpleMemory for conversation history

**Configuration**:
- `maxDuration = 30` - 30-second timeout for streaming responses
- LLM model from `process.env.OPENAI_MODEL`
- Temperature: 0.1 (low randomness)
- Max tokens: 2048

**Dependencies**:
- `ai` - convertToModelMessages, ModelMessage types
- `@joshuacalpuerto/mcp-agent` - Agent, LLMFireworks, Orchestrator, SimpleMemory, workflow events

**Request/Response Flow**:
1. Receives `{ messages }` from client
2. Converts to model messages format
3. Initializes researcher agent with search_web MCP server
4. Creates orchestrator with agents and conversation history
5. Streams workflow events (step start/end, task start/end, errors)
6. Returns text/event-stream with Vercel AI SDK header

**Helper Functions**:
- `getSmitheryUrl()` - Constructs Smithery MCP server URL with API key and profile

**Response Headers**:
- `x-vercel-ai-ui-message-stream: v1` - Vercel AI SDK streaming protocol
- `Content-Type: text/event-stream; charset=utf-8`
- `Cache-Control: no-cache, no-transform`
- `Connection: keep-alive`

---

### 4. Business Logic (Conversation Handling)

#### `src/libs/chat/conversation-handler.ts`
**Location**: `/Users/joshuacalpuerto/projects/ML-guide/career-coach/src/libs/chat/conversation-handler.ts`
**Type**: TypeScript Module (77 lines)
**Purpose**: Manages preference collection flow within chat context

**Key Features**:
- Controls preference flow state (active/inactive)
- Manages multi-step preference collection (workArrangements → locations → companyStages)
- Integrates with preference store and normalizer
- Emits analytics events for preference flow lifecycle

**Exported Functions**:
1. `startPreferencesFlow()` - Initializes preference collection
2. `getPreferenceState(): PreferenceState` - Returns current flow state
3. `updatePreferenceStep(step, values)` - Updates specific preference field
4. `advancePreferenceStep()` - Moves to next step after validation

**Types**:
- `PreferenceStepKey` - 'workArrangements' | 'locations' | 'companyStages'
- `PreferenceState` - Complete state object with active status, current step, draft, errors, completed flag

**State Variables** (module-level):
- `preferenceFlowActive: boolean` - Whether preference flow is running
- `currentStepIndex: number` - Current step in the flow
- `steps: PreferenceStepKey[]` - Step sequence array

**Dependencies**:
- `@/libs/preferences/preference-store` - initDraft, updateDraft, getDraft
- `@/libs/preferences/preference-normalizer` - validateAndNormalizeDraft, enforceConditionalLocationRule
- `@/libs/preferences/analytics` - emitStarted, emitStepCompleted, emitConfirmed

**Connection Points**:
- Imported by `ChatInterface` component to control chat availability
- Works with preference store for data persistence
- Enforces conditional rules (e.g., location auto-removal for in-person only)

---

### 5. Type Definitions

#### `src/types/user-data.ts`
**Location**: `/Users/joshuacalpuerto/projects/ML-guide/career-coach/src/types/user-data.ts`
**Type**: TypeScript Type Definitions (28 lines)
**Purpose**: User-related data structures

**Chat-Related Types**:
1. **`UserCVParsed`** (via Zod schema)
   - `skills: string[]` - List of skills extracted from CV
   - `workExperience: Array<{companyName, startDate, endDate, summary}>` - Work history (max 60 entries)
   - `education: string[]` - Education summaries

2. **`PreferenceProfile`**
   - `workArrangements: string[]` - Work arrangement preferences
   - `locations: string[]` - Location preferences
   - `companyStages: string[]` - Company stage preferences
   - `interests: string` - User interests (text)
   - `valid: boolean` - Validation status flag

**Usage**:
- `UserCVParsed` passed to ChatInterface as prop
- `PreferenceProfile` managed in ChatInterface state
- Used for type safety across chat components

---

#### AI SDK Types (from `ai` package)
**Location**: External package - `ai` npm module
**Types Used**:
- `UIMessage` - Message structure for UI rendering (imported in MessageBubble)
- `ModelMessage` - Internal AI SDK message format (used in route.ts)
- `TextStreamChatTransport` - Streaming transport class (used in ChatInterface)

**Additional Functions**:
- `generateId()` - Creates unique message IDs (used in ChatInterface for system message)
- `convertToModelMessages()` - Converts UI messages to model format (used in route.ts)

---

### 6. Configuration & Dependencies

#### `package.json`
**Location**: `/Users/joshuacalpuerto/projects/ML-guide/career-coach/package.json`
**Chat-Related Dependencies**:
- `"@ai-sdk/google": "1.2.19"` - Google AI SDK provider
- `"@ai-sdk/openai": "^2.0.38"` - OpenAI AI SDK provider
- `"@ai-sdk/react": "^2.0.56"` - React hooks for AI SDK (useChat)
- `"ai": "^5.0.56"` - Core Vercel AI SDK
- `"@joshuacalpuerto/mcp-agent": "^1.1.1"` - MCP agent orchestration
- `"react-markdown": "^10.1.0"` - Markdown rendering in MessageBubble

**Related UI Dependencies**:
- `"lucide-react": "0.525.0"` - Icons (Send, Paperclip, Loader2)
- `"@radix-ui/react-avatar": "^1.1.10"` - Avatar component base

---

### 7. Documentation & Prompts

#### `prompts/ai-sdk-documentation.md`
**Location**: `/Users/joshuacalpuerto/projects/ML-guide/career-coach/prompts/ai-sdk-documentation.md`
**Type**: Documentation (31,673 lines)
**Purpose**: Comprehensive AI SDK usage guide
**Content**: RAG Agent guide, embeddings, chunking, chat patterns, examples

#### `prompts/mcp-agent.md`
**Location**: `/Users/joshuacalpuerto/projects/ML-guide/career-coach/prompts/mcp-agent.md`
**Type**: Documentation
**Purpose**: MCP agent integration patterns
**Key Sections**:
- Agent initialization and configuration
- Memory management (SimpleMemory)
- Orchestrator setup
- Message format conversion
- Streaming response handling

---

## Component Connection Map

```
┌─────────────────────────────────────────────────────┐
│ Entry Point: src/app/(chat)/page.tsx               │
│ - Manages CV upload → chat transition              │
│ - Renders FileUpload or ChatInterface              │
└─────────────────┬───────────────────────────────────┘
                  │
                  ↓
┌─────────────────────────────────────────────────────┐
│ Main UI: src/components/chat/ChatInterface.tsx     │
│ - useChat hook from @ai-sdk/react                  │
│ - Manages preference flow UI                       │
│ - Handles message sending                          │
│ - Connects to /api/chat endpoint                   │
└─────────┬───────────────────────┬───────────────────┘
          │                       │
          ↓                       ↓
┌─────────────────────┐  ┌──────────────────────────┐
│ MessageBubble.tsx   │  │ conversation-handler.ts  │
│ - Renders messages  │  │ - Preference flow state  │
│ - Markdown support  │  │ - Step management        │
│ - User/AI styling   │  │ - Validation logic       │
└─────────────────────┘  └──────────────────────────┘
          ↑
          │
┌─────────┴───────────────────────────────────────────┐
│ API: src/app/api/chat/route.ts                      │
│ - POST handler                                      │
│ - MCP Agent orchestration                           │
│ - Researcher agent (web search)                     │
│ - Streaming response                                │
└─────────────────────────────────────────────────────┘
          ↓
┌─────────────────────────────────────────────────────┐
│ External Services                                   │
│ - Fireworks LLM                                     │
│ - Smithery MCP Server (Exa search)                  │
└─────────────────────────────────────────────────────┘
```

---

## Data Flow

### Message Send Flow
1. User types in ChatInput (within ChatInterface)
2. `onSendMessage` called with text
3. `sendMessage({ text })` from useChat hook
4. POST request to `/api/chat` with messages array
5. Server converts messages to MCP format
6. Orchestrator generates response via researcher agent
7. Workflow events streamed back as text/event-stream
8. useChat hook updates messages state
9. MessageBubble components render new messages

### Preference Flow Integration
1. ChatInterface renders preference selection UI
2. User selects preferences (work arrangement, location, company stage)
3. `updatePreferenceStep` updates preference state
4. `getPreferenceState` checks if flow is active
5. Chat input disabled while `preferenceFlowActive === true`
6. Once valid, chat enables and preferences available for context

---

## Environment Variables Used

From `route.ts`:
- `process.env.OPENAI_MODEL` - LLM model identifier
- `process.env.SMITHERY_KEY` - Smithery API key for MCP server
- `process.env.SMITHERY_PROFILE` - Smithery profile identifier

---

## Key Architectural Patterns

1. **AI SDK Integration**: Uses Vercel AI SDK's useChat hook with custom TextStreamChatTransport
2. **MCP Agent Orchestration**: Backend uses @joshuacalpuerto/mcp-agent for complex AI workflows
3. **Streaming Responses**: Server-Sent Events (SSE) for real-time message streaming
4. **Component Composition**: ChatInterface contains MessageBubble and ChatInput sub-components
5. **State Management**: React state for UI, conversation-handler for preference flow, AI SDK for messages
6. **Type Safety**: Comprehensive TypeScript types for messages, user data, and preferences
7. **Markdown Support**: Rich text rendering with custom component overrides for styling
8. **Conditional UI**: Chat input disables during preference collection flow

---

## Related Directories

### Preference Components
**Location**: `src/components/preferences/`
- `PreferenceStepWorkArrangement.tsx`
- `PreferenceStepLocation.tsx`
- `PreferenceStepCompanyStage.tsx`
- `PreferenceValidationMessages.tsx`

These are embedded in ChatInterface for preference collection.

### Preference Libraries
**Location**: `src/libs/preferences/`
- `preference-store.ts` - Draft storage
- `preference-normalizer.ts` - Validation and conditional rules
- `analytics.ts` - Event tracking
- `constants.ts`, `errors.ts`, `events.ts`, `index.ts`
- `README.md` - Preference system documentation

### UI Components (shadcn-ui)
**Location**: `src/components/ui/`
- `avatar.tsx` - Used in MessageBubble
- `button.tsx` - Used in ChatInterface (send button, attach button)
- `card.tsx` - Chat container structure
- `input.tsx` - Not directly used in current chat
- `textarea.tsx` - Used in ChatInput for message composition

---

## API Endpoints Directory
**Location**: `src/app/api/`
- `chat/route.ts` - Main chat endpoint ✓
- `upload/route.ts` - CV file upload
- `health/route.ts` - Health check

---

## Testing & Development Notes

### Current State
- Mock CV data present in page.tsx for development
- Preference flow integrated but chat disabled during selection
- Streaming responses configured with 30s timeout
- No test files found for chat components

### Future Considerations
- Message persistence not implemented (in-memory only via useChat)
- No conversation history storage beyond session
- Preference data not persisted to backend
- No error boundary components for chat failures

---

## Summary Statistics

**Total Chat-Related Files**: 9 core files
- UI Components: 2 files (ChatInterface, MessageBubble)
- Page Components: 1 file (page.tsx)
- API Routes: 1 file (route.ts)
- Business Logic: 1 file (conversation-handler.ts)
- Types: 1 file (user-data.ts)
- Configuration: 1 file (package.json)
- Documentation: 2 files (ai-sdk-documentation.md, mcp-agent.md)

**Lines of Code**:
- ChatInterface.tsx: ~195 lines
- MessageBubble.tsx: ~107 lines
- page.tsx: ~139 lines
- route.ts: ~114 lines
- conversation-handler.ts: ~77 lines
- user-data.ts: ~28 lines

**Total Core Chat Code**: ~660 lines (excluding documentation)

---

## End of Report
This document provides a complete map of the chat interface functionality as it exists in the codebase. All file locations are absolute paths, and all connections between components are documented.
