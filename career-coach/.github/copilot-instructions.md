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


## Conventions & Patterns
- Use TypeScript interfaces for all structured data (see `src/types/`).
- All external API access is via `src/libs/apis/` clients.
- Error handling and rate limiting are required for all API integrations.
- Use local state for UI, and keep business logic in `libs/`.
- Use Tailwind utility classes for all styling.
- Prefer functional React components and hooks.
- Use file-based routing and API endpoints (App Router).

For questions about the requirements, check the PRD in `tasks/prd-ai-career-coach.md`.
