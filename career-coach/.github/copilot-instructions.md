# Copilot Instructions for `career-coach`

## Project Overview
- **Type:** Next.js 15 (App Router, TypeScript, Tailwind CSS)
- **Purpose:** Conversational AI career coach that analyzes user CVs, gathers preferences, evaluates companies via external APIs, and generates a ranked shortlist of job opportunities.

## Architecture & Key Patterns
- **App Router:** All routing and API endpoints are file-based under `src/app/` (e.g., `src/app/api/chat/route.ts`).
- **Component Structure:** UI components are in `src/components/` and built with **shadcn-ui**. Follow React + TypeScript best practices.
- **Libs:** Business logic, API clients, and utilities are in `src/libs/` (e.g., `chat/conversation-handler.ts`, `upload/cv-uploader.ts`).
- **AI SDK:** The project uses the **Vercel AI SDK** for conversational AI. See `career-coach/prompts/ai-sdk-documentation.md` for more details.
- **Types:** Shared TypeScript interfaces in `src/types/` (e.g., `user-data.ts`, `company-data.ts`).
- **Styling:** Tailwind CSS is used throughout, configured with `shadcn-ui`. See `postcss.config.mjs` and `tailwind.config.js`.
- **Config:** API keys and settings are managed via `.env.local` and `src/libs/config/settings.ts`.

## Data Flow
- User interacts with chat UI (`ChatInterface.tsx`), uploads CV (`FileUpload.tsx`), and sets preferences.
- API routes (`src/app/api/*/route.ts`) handle chat, file upload, and health checks.
- Uploaded CVs are parsed (`cv-uploader.ts`, `cv-parser.ts`), then user preferences are collected (`preference-collector.ts`).
- Company data is fetched via API clients (`crunchbase-client.ts`, `glassdoor-client.ts`, `news-client.ts`).
- Shortlist is generated and formatted (`generator.ts`, `formatter.ts`), then displayed (`ShortlistDisplay.tsx`).

## Developer Workflows
- **Dev server:** `npm run dev` (or `yarn dev`, `pnpm dev`, `bun dev`)
- **Build:** `npm run build`
- **Lint:** `npm run lint`
- **Tests:** Use `npm test` or `jest` (test files in `__tests__/`)
- **Environment:** Set API keys in `.env.local` (not checked in)

## Conventions & Patterns
- Use TypeScript interfaces for all structured data (see `src/types/`).
- All external API access is via `src/libs/apis/` clients.
- Error handling and rate limiting are required for all API integrations.
- Use local state for UI, and keep business logic in `libs/`.
- Use Tailwind utility classes for all styling.
- Prefer functional React components and hooks.
- Use file-based routing and API endpoints (App Router).

## Integration Points
- **Crunchbase, Glassdoor, NewsAPI:** API clients in `src/libs/apis/`.
- **PDF Parsing:** Implemented in `cv-uploader.ts` and `cv-parser.ts` (use `pdf-parse` or similar).
- **Shortlist logic:** `generator.ts` and `formatter.ts`.

## Examples
- See `src/components/chat/ChatInterface.tsx` for chat UI pattern.
- See `src/libs/chat/conversation-handler.ts` for state management.
- See `src/libs/apis/crunchbase-client.ts` for API integration pattern.

---

**When in doubt, follow the structure and patterns in the `src/` directory.**

For questions, check the PRD in `tasks/tasks-prd-ai-career-coach.md`.
