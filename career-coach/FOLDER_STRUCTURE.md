# Career Coach Code Map

## Legend
- Components: UI React pieces (presentation + interaction)
- Libs: Business logic, integration clients, parsing, evaluation
- Types: Shared TypeScript data contracts
- API Routes: Next.js App Router server endpoints

## Code Map
- `src/app/globals.css` - Global CSS styles (Tailwind layers, resets, tokens) applied app-wide.
- `src/app/layout.tsx` - Root layout wrapper; sets HTML scaffold, font imports, providers.
- `src/app/favicon.ico` - Favicon asset for browser tab/app identity.
- `src/app/(chat)/page.tsx` - Chat page rendering conversation UI and coordinating CV + preference state.
- `src/app/api/chat/route.ts` - Chat POST endpoint invoking conversation handler and returning assistant responses.
- `src/app/api/upload/route.ts` - CV/PDF upload endpoint handling validation and passing file to parsing.
- `src/app/api/health/route.ts` - Simple health/status endpoint (uptime/readiness check).
- `src/app/api/cv/parse/` - Placeholder directory for future CV parsing API expansion (e.g., structured extraction route).

### Components (Chat)
- `src/components/chat/ChatInterface.tsx` - Container for messages, input, and preference step injection.
- `src/components/chat/MessageBubble.tsx` - Styled message bubble for user vs assistant roles.

### Components (Upload)
- `src/components/upload/FileUpload.tsx` - Drag-and-drop CV uploader with progress & error feedback.

### Components (Shortlist)
- `src/components/shortlist/ShortlistDisplay.tsx` - Renders ranked company shortlist with scores & summaries.

### Components (Preferences)
- `src/components/preferences/PreferenceStepCompanyStage.tsx` - Multi-select for company maturity (e.g., Unicorn, IPO-ready).
- `src/components/preferences/PreferenceStepLocation.tsx` - Location selection with conditional Estonia/EEA restriction logic.
- `src/components/preferences/PreferenceStepWorkArrangement.tsx` - Work arrangement (Remote/Hybrid/In-Person) multi-select enforcing required rule.
- `src/components/preferences/PreferenceValidationMessages.tsx` - Centralized renderer for inline validation feedback.

### Components (UI Primitives)
- `src/components/ui/avatar.tsx` - Reusable avatar (user, assistant, logos) with size variants.
- `src/components/ui/button.tsx` - Tailwind + variant-driven button component.
- `src/components/ui/card.tsx` - Basic layout/card container for grouping related content.
- `src/components/ui/input.tsx` - Styled text input with forwarded ref & accessibility.
- `src/components/ui/MultiSelect.tsx` - Keyboard-accessible multi-select dropdown used in preference steps.
- `src/components/ui/textarea.tsx` - Styled textarea for free-form multi-line input (e.g., interests).

### Components (Misc)
- `src/components/Sample.tsx` - Sample/demo component (placeholder / confirm usage).

### Libs (General Utilities)
- `src/libs/utils.ts` - Shared helper functions (formatting, guards, parsing utilities).

### Libs (AI Model Abstraction)
- `src/libs/ai-model/` - Layer for LLM/model invocation: prompt assembly and response normalization.

### Libs (API Clients)
- `src/libs/apis/crunchbase-client.ts` - Crunchbase API wrapper (funding, size, market signals).
- `src/libs/apis/glassdoor-client.ts` - Glassdoor-like API wrapper (ratings, reviews, culture metrics).
- `src/libs/apis/news-client.ts` - External news/articles API wrapper (recent updates, sentiment).

### Libs (Conversation)
- `src/libs/chat/conversation-handler.ts` - State machine for multi-turn flow combining CV + preferences + responses.

### Libs (Configuration)
- `src/libs/config/settings.ts` - Aggregates environment variables and default application settings.

### Libs (Evaluation / Company Profiling)
- `src/libs/evaluation/company-evaluator.ts` - Orchestrates data collection & scoring from all API clients.

### Libs (Files / Upload)
- `src/libs/files/cv-uploader.ts` - Server-side upload acceptance: validation, sanitation, parse triggering.
- `src/libs/files/file-handler.ts` - Low-level file utilities (temp storage, MIME validation, cleanup).

### Libs (Hooks)
- `src/libs/hooks/useApiFetcher.ts` - React hook abstracting fetch lifecycle (loading, error, data, retries).

### Libs (Parsing)
- `src/libs/parsing/cv-parser.ts` - Extracts structured fields (skills, roles, durations) from raw CV text.

### Libs (Preferences Flow)
- `src/libs/preferences/analytics.ts` - Tracks interaction events for analysis/funnels.
- `src/libs/preferences/constants.ts` - Static enumerations (work arrangements, locations, company stages).
- `src/libs/preferences/errors.ts` - Domain-specific error objects/message constructors.
- `src/libs/preferences/events.ts` - Typed event map emitted during preference gathering transitions.
- `src/libs/preferences/index.ts` - Barrel exporting preference submodules for cleaner imports.
- `src/libs/preferences/preference-collector.ts` - Hybrid conversational/UI driver that sequences preference questions & captures answers.
- `src/libs/preferences/preference-normalizer.ts` - Cleans/dedupes raw user inputs (trims, enforces limits, casing normalization).
- `src/libs/preferences/preference-store.ts` - In-memory store (or context wrapper) for current preference snapshot.
- `src/libs/preferences/README.md` - Architecture overview for the preference flow subsystem.

### Libs (Shortlist Generation)
- `src/libs/shortlist/formatter.ts` - Converts raw evaluation + scores into user-facing summaries (pros/cons, excitement factor).
- `src/libs/shortlist/generator.ts` - Ranking and scoring algorithm producing ordered shortlist candidates.

### Types
- `src/types/company-data.ts` - Type definitions for normalized company evaluation objects.
- `src/types/user-data.ts` - Type definitions for CV-derived user profile & preference schema.

### High-Level Grouping
- `src/app/api/` - Serverless API route handlers (chat, upload, health, future CV parsing).
- `src/components/` - UI components grouped by feature domain (chat, upload, shortlist, preferences, primitives).
- `src/libs/` - Core business logic modules (APIs, parsing, evaluation, preferences, shortlist, hooks, config).
- `src/types/` - Shared cross-cutting data contracts.

### Inventory Snapshot
Current tree (2025-10-26): 27 directories, 46 files.

Placeholder / stub directories:
- `src/app/api/cv/parse/` - Placeholder (no route yet).
- `src/libs/ai-model/` - Placeholder (future model invocation layer; currently empty).

### Namespace Clarification
- Legacy placeholder `src/lib/` referenced previously is deprecated; active namespace is `src/libs/` for all logic modules.

## Suggested Future Enhancements
- Add `src/app/api/cv/parse/route.ts` for structured CV parse requests.
- Introduce caching layer (e.g., Redis) inside `company-evaluator` for repeated lookups.
- Centralize error boundary UI component for chat + shortlist views.
- Expand `ai-model` with pluggable model strategy pattern.

## Usage for LLM Context
Provide only the relevant subset of this map to reduce prompt token usage. Pair file purpose with current task (e.g., "Need to modify company scoring -> shortlist/generator.ts + evaluation/company-evaluator.ts").

---
Generated: 2025-10-26
