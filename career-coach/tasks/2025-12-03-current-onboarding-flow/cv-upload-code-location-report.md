# CV Upload Functionality - Code Location Report

**Generated:** December 3, 2025  
**Agent:** code-locator  
**Scope:** All files and components related to CV upload functionality

---

## Executive Summary

The CV upload functionality is implemented across **7 files** spanning UI components, API routes, type definitions, and placeholder modules. The implementation uses **pdf-parse** for PDF text extraction and **@joshuacalpuerto/mcp-agent** with LLM-based parsing to extract structured data from resume text.

---

## File Locations by Category

### 1. UI Components (Presentation Layer)

#### `src/components/upload/FileUpload.tsx`
- **Purpose:** Drag-and-drop CV upload component
- **Exports:** `FileUpload` (default export), `FileUploadProps` interface
- **Key Features:**
  - Drag-and-drop file handling with visual feedback
  - Client-side validation (PDF only, max 5MB)
  - Calls `/api/upload` endpoint via `useApiFetcher` hook
  - Emits callbacks: `onUploaded`, `onUploadInitiated`, `onUploadError`
  - Displays validation and API errors
- **Dependencies:**
  - `@/components/ui/button`, `@/components/ui/card` (shadcn-ui components)
  - `@/libs/hooks/useApiFetcher` (API request hook)
  - `@/types/user-data` (imports `UserCVParsed` type)
- **Used By:** 
  - `src/app/(chat)/page.tsx` (main chat page)

---

### 2. API Routes (Backend Layer)

#### `src/app/api/upload/route.ts`
- **Purpose:** Next.js API route handler for CV file upload and parsing
- **HTTP Method:** `POST`
- **Request:** `multipart/form-data` with `file` field (PDF only, max 5MB)
- **Response:** JSON with structure:
  ```json
  {
    "success": true,
    "message": "File uploaded & parsed",
    "profile": {
      "skills": ["skill1", "skill2", ...],
      "workExperience": [
        {
          "companyName": "...",
          "startDate": "YYYY-MM",
          "endDate": "YYYY-MM" | null,
          "summary": "..."
        }
      ],
      "education": ["entry1", "entry2", ...]
    }
  }
  ```
- **Key Implementation Details:**
  - Uses `pdf-parse` library (`PDFParse` class) to extract text from PDF buffer
  - Configures pdf.js worker path for text extraction
  - Uses `@joshuacalpuerto/mcp-agent` (Agent + LLMFireworks) for LLM-based parsing
  - Constructs prompt with PDF text and JSON schema constraints
  - Validates parsed output against `UserCVParsedSchema` (Zod)
  - Returns validation errors with HTTP 422 status if schema validation fails
- **Exports:** 
  - `POST` function (Next.js route handler)
  - `profileContextSchemaResponseFormat` (JSON schema for LLM response format)
- **Dependencies:**
  - `pdf-parse` package
  - `@joshuacalpuerto/mcp-agent` package
  - `@/types/user-data` (imports `UserCVParsedSchema`, `UserCVParsed`)

---

### 3. Type Definitions

#### `src/types/user-data.ts`
- **Purpose:** TypeScript interfaces and Zod schemas for user CV data and preferences
- **Exports:**
  - `UserCVParsedSchema` (Zod schema for validation)
  - `UserCVParsed` (inferred TypeScript type)
  - `PreferenceProfile` (preference data structure)
- **UserCVParsed Structure:**
  ```typescript
  {
    skills: string[];                    // Array of skill strings (no max in schema)
    workExperience: Array<{
      companyName: string;               // 1-120 chars
      startDate: string;                 // YYYY or YYYY-MM format (4-10 chars)
      endDate: string | null | undefined;// YYYY or YYYY-MM, null if current
      summary: string;                   // Responsibilities & achievements
    }>;                                  // Max 60 entries
    education: string[];                 // Array of education entry summaries
  }
  ```
- **Used By:**
  - `src/components/upload/FileUpload.tsx`
  - `src/components/chat/ChatInterface.tsx`
  - `src/app/api/upload/route.ts`
  - `src/app/(chat)/page.tsx`

---

### 4. Page Components (Integration Layer)

#### `src/app/(chat)/page.tsx`
- **Purpose:** Main chat interface page with CV upload gate
- **User Flow:**
  1. If no CV uploaded → Shows upload UI with `FileUpload` component
  2. After successful upload → Shows `ChatInterface` with parsed CV data
- **State Management:**
  - `userCVParsedProfile` state (React useState)
  - Initially contains hardcoded mock data (for development)
  - Updates when `FileUpload` component's `onUploaded` callback fires
- **CV Data Usage:**
  - Passes `userCVParsedProfile` to `ChatInterface` as `userCVInfo` prop
  - Displays parsed stats (skills count, work experience count, education count)
- **Dependencies:**
  - `@/components/upload/FileUpload`
  - `@/components/chat/ChatInterface`
  - `@/types/user-data` (imports `UserCVParsed`)

#### `src/components/chat/ChatInterface.tsx`
- **Purpose:** Chat interface that consumes parsed CV data
- **CV Data Usage:**
  - Receives `userCVInfo: UserCVParsed` as prop
  - Injects CV data into system message for AI context:
    ```
    You are an intelligent job search assistant. 
    Analyze the CV which contains skills, work experiences.
    Search the internet for current job opportunities...
    CV: ${JSON.stringify(userCVInfo)}
    ```
  - Uses Vercel AI SDK (`useChat` hook) for conversational AI
- **Dependencies:**
  - `@ai-sdk/react` (useChat hook)
  - `@/types/user-data` (imports `UserCVParsed`, `PreferenceProfile`)

---

### 5. Hooks & Utilities

#### `src/libs/hooks/useApiFetcher.ts`
- **Purpose:** Generic API request lifecycle hook with state management
- **Exports:**
  - `useApiFetcher<TResponse, TError>()` hook
  - `request(url, options)` function (fetch wrapper)
  - `ApiState<TResponse, TError>` interface
- **Features:**
  - Loading, success, error state management via reducer
  - Abort controller for request cancellation
  - Safe dispatch (checks component mount status)
  - Automatic response parsing based on content-type
  - Error handling for network failures and HTTP errors
- **Used By:**
  - `src/components/upload/FileUpload.tsx` (for calling `/api/upload`)
- **Note:** Generic hook, not CV-specific, but critical for upload flow

---

### 6. Placeholder / Stub Files (Not Implemented)

#### `src/libs/files/cv-uploader.ts`
- **Current Status:** Empty placeholder with comment: `// Placeholder for CV uploader logic`
- **Intended Purpose:** CV uploader validation + dispatch logic
- **Catalog Entry Notes:** "Stub CV uploader (validation + dispatch pending implementation)"
- **Maintenance Triggers:** Add size/type validation, new storage backend, accepted format change

#### `src/libs/files/file-handler.ts`
- **Current Status:** Empty placeholder with comment: `// Placeholder for file handler utilities`
- **Intended Purpose:** File handler utilities (naming, extraction)
- **Catalog Entry Notes:** "Stub file handler utilities (naming, extraction pending)"
- **Maintenance Triggers:** Add sanitization rules, new extraction method

#### `src/libs/parsing/cv-parser.ts`
- **Current Status:** Empty placeholder with comment: `// Placeholder for CV parser logic`
- **Intended Purpose:** CV parsing logic (text → structured data)
- **Catalog Entry Notes:** "Stub CV parsing logic (text → structured data pending implementation)"
- **Maintenance Triggers:** Add parsing heuristics, section extraction, error taxonomy change
- **Note:** Parsing logic currently implemented directly in `src/app/api/upload/route.ts` instead

---

## Dependencies & External Libraries

### PDF Processing
- **Package:** `pdf-parse` (v2.2.9)
- **Type Definitions:** `@types/pdf-parse` (v1.1.5)
- **Usage:** Extracts text content from PDF buffer
- **Location:** `src/app/api/upload/route.ts`
- **Worker Configuration:** Requires pdf.js worker path setup

### AI/LLM Integration
- **Package:** `@joshuacalpuerto/mcp-agent` (v1.1.1)
- **Classes Used:** `Agent`, `LLMFireworks`
- **Purpose:** LLM-based structured data extraction from CV text
- **Location:** `src/app/api/upload/route.ts`
- **Model:** Uses `process.env.OPENAI_MODEL` (fallback to "")
- **Configuration:** maxTokens: 1536, temperature: 0.2, stream: true

### Validation
- **Package:** `zod` (v3.25.67)
- **Usage:** Schema validation for parsed CV data
- **Location:** `src/types/user-data.ts` (schema definition), `src/app/api/upload/route.ts` (validation)

---

## Data Flow Diagram

```
User
  ↓ [drops PDF file]
FileUpload.tsx (Client)
  ↓ [validates: PDF only, max 5MB]
  ↓ [POST FormData to /api/upload]
/api/upload/route.ts (Server)
  ↓ [validates: content-type, file type, size]
  ↓ [reads PDF buffer]
PDFParse
  ↓ [extracts text content]
Agent + LLMFireworks
  ↓ [parses text → structured JSON]
UserCVParsedSchema (Zod)
  ↓ [validates structure]
  ↓ [returns {success, profile}]
FileUpload.tsx
  ↓ [calls onUploaded callback]
page.tsx
  ↓ [updates userCVParsedProfile state]
  ↓ [renders ChatInterface]
ChatInterface.tsx
  ↓ [injects CV data into system message]
Vercel AI SDK
  ↓ [sends to /api/chat with CV context]
```

---

## File Connection Map

### Direct Imports
- `FileUpload.tsx` imports from:
  - `@/types/user-data` (UserCVParsed)
  - `@/libs/hooks/useApiFetcher`
  - `@/components/ui/*` (button, card)

- `page.tsx` imports from:
  - `@/types/user-data` (UserCVParsed)
  - `@/components/upload/FileUpload`
  - `@/components/chat/ChatInterface`

- `/api/upload/route.ts` imports from:
  - `@/types/user-data` (UserCVParsedSchema, UserCVParsed)
  - `pdf-parse` (PDFParse)
  - `@joshuacalpuerto/mcp-agent` (Agent, LLMFireworks)

- `ChatInterface.tsx` imports from:
  - `@/types/user-data` (UserCVParsed, PreferenceProfile)
  - `@ai-sdk/react` (useChat)

### API Calls
- `FileUpload.tsx` → calls → `/api/upload` (POST)
- `ChatInterface.tsx` → calls → `/api/chat` (via Vercel AI SDK)

### Component Hierarchy
```
page.tsx
├─ FileUpload (if no CV)
└─ ChatInterface (if CV uploaded)
   └─ MessageBubble (chat messages)
```

---

## Catalog Documentation References

### Components Catalog (`src/components/CATALOG.md`)
- **Entry:** Upload section
- **Description:** "Drag & drop CV upload UI; emits file via callbacks"
- **Maintenance Triggers:** New accepted file types display, accessibility pattern change

### Libs Catalog (`src/libs/CATALOG.md`)
- **Files Section:** cv-uploader.ts, file-handler.ts
- **Parsing Section:** cv-parser.ts
- **Status:** All marked as stubs/placeholders pending implementation

---

## Configuration & Environment

### Environment Variables
- `OPENAI_MODEL` - Model name for LLM parsing (used in `/api/upload/route.ts`)
- Note: Managed via `.env.local` file

### Validation Constraints
**Client-side (FileUpload.tsx):**
- File type: `application/pdf` only
- Max size: 5MB (5 * 1024 * 1024 bytes)

**Server-side (/api/upload/route.ts):**
- Content-type: `multipart/form-data` required
- File type: `application/pdf` only
- Max size: 5MB
- Schema validation via Zod (see UserCVParsedSchema)

---

## Related Documentation

### PRD References (`artifacts/prd-ai-career-coach.md`)
- **Requirement 1:** CV Upload - system must allow `.pdf` format
- **Requirement 2:** CV Parsing - extract skills, experience, job titles
- **User Story:** "As a job seeker, I want to upload my CV (in PDF format) so that the app can automatically understand my skills, experience, and qualifications"

### Task References (`artifacts/tasks-prd-ai-career-coach.md`)
- **Section 2.0:** "Implement CV Upload and Parsing"
- **Status:** Tasks 2.1-2.8 marked as completed ✅
- **Files Mentioned:**
  - `src/app/api/upload/route.ts` - API route for CV file upload
  - `src/components/upload/FileUpload.tsx` - CV file upload component
  - `src/lib/upload/cv-uploader.ts` - Handles CV file upload and validation
  - `src/lib/parsing/cv-parser.ts` - Extracts structured data from uploaded CV files
  - `src/types/user-data.ts` - TypeScript interfaces for user CV data

---

## Summary of Implementation Status

| Component | Status | Location |
|-----------|--------|----------|
| Upload UI Component | ✅ Implemented | `src/components/upload/FileUpload.tsx` |
| Upload API Endpoint | ✅ Implemented | `src/app/api/upload/route.ts` |
| PDF Text Extraction | ✅ Implemented | Using `pdf-parse` in upload route |
| LLM-based Parsing | ✅ Implemented | Using `@joshuacalpuerto/mcp-agent` in upload route |
| Type Definitions | ✅ Implemented | `src/types/user-data.ts` |
| Integration (Page) | ✅ Implemented | `src/app/(chat)/page.tsx` |
| CV Uploader Lib | ⏸️ Placeholder | `src/libs/files/cv-uploader.ts` |
| File Handler Lib | ⏸️ Placeholder | `src/libs/files/file-handler.ts` |
| CV Parser Lib | ⏸️ Placeholder | `src/libs/parsing/cv-parser.ts` |

---

## Notes

1. **Architecture Decision:** CV parsing logic is implemented directly in the API route (`/api/upload/route.ts`) rather than in separate library modules. The placeholder files in `src/libs/` suggest a planned refactoring.

2. **Mock Data:** `src/app/(chat)/page.tsx` contains hardcoded mock CV data in the initial state (for development/testing purposes).

3. **LLM Response Format:** The API route defines `profileContextSchemaResponseFormat` with a strict JSON schema that mirrors the Zod schema structure, ensuring LLM outputs conform to expected structure.

4. **Error Handling:** Multi-layered validation:
   - Client: File type + size validation before upload
   - Server: Content-type + file validation before parsing
   - Schema: Zod validation after LLM parsing

5. **Worker Configuration:** PDF parsing requires explicit worker path configuration due to Next.js bundling constraints.

---

**End of Report**
