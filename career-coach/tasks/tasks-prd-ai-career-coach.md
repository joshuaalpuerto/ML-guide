## Relevant Files

- `package.json` - Project dependencies and scripts configuration.
- `tsconfig.json` - TypeScript configuration file.
- `next.config.js` - Next.js configuration file.
- `tailwind.config.js` - Tailwind CSS configuration.
- `src/app/layout.tsx` - Root layout component for the application.
- `src/app/page.tsx` - Main chat interface page component.
- `src/app/api/chat/route.ts` - API route for chat functionality.
- `src/app/api/upload/route.ts` - API route for CV file upload.
- `src/app/api/health/route.ts` - Health check API route.
- `src/components/chat/ChatInterface.tsx` - Main chat UI component.
- `src/components/chat/MessageBubble.tsx` - Individual message display component.
- `src/components/upload/FileUpload.tsx` - CV file upload component.
- `src/components/shortlist/ShortlistDisplay.tsx` - Job opportunities display component.
- `src/lib/chat/conversation-handler.ts` - Manages conversational flow and state management.
- `src/lib/upload/cv-uploader.ts` - Handles CV file upload and validation.
- `src/lib/parsing/cv-parser.ts` - Extracts structured data from uploaded CV files.
- `src/lib/preferences/preference-collector.ts` - Manages user preference gathering through conversation.
- `src/lib/evaluation/company-evaluator.ts` - Orchestrates company evaluation using external APIs.
- `src/lib/apis/crunchbase-client.ts` - Client for Crunchbase API integration.
- `src/lib/apis/glassdoor-client.ts` - Client for Glassdoor API integration.
- `src/lib/apis/news-client.ts` - Client for news/updates API integration.
- `src/lib/shortlist/generator.ts` - Generates and ranks the final shortlist of opportunities.
- `src/lib/shortlist/formatter.ts` - Formats shortlist output with scores, pros/cons, and summaries.
- `src/lib/config/settings.ts` - Configuration management for API keys and application settings.
- `src/lib/utils/file-handler.ts` - Secure file handling utilities for CV uploads.
- `src/types/user-data.ts` - TypeScript interfaces for user CV data and preferences.
- `src/types/company-data.ts` - TypeScript interfaces for company evaluation results.
- `__tests__/` - Test files directory.
- `.env.local` - Environment variables for API keys and configuration.

### Notes

- Next.js App Router is used for file-based routing and API routes.
- Components follow React best practices with TypeScript.
- Use `npm test` or `jest` to run tests. Running without arguments executes all tests.
- Consider using environment variables for API keys and sensitive configuration.
- Implement proper error handling for external API failures and rate limiting.
- Use TypeScript interfaces for type safety and better development experience.
- Tailwind CSS for styling and responsive design.

## Tasks

- [x] 1.0 Setup Project and Conversational UI
  - [x] 1.1 Initialize Next.js project with TypeScript and required dependencies
  - [x] 1.2 Create Next.js project structure with app router, components, and lib folders
  - [x] 1.3 Set up Tailwind CSS for styling and responsive design
  - [x] 1.4 Configure TypeScript and Next.js build settings
  - [x] 1.5 Set up configuration management for API keys and settings using environment variables
  - [x] 1.6 Create basic chat interface UI components with React
  - [x] 1.7 Implement API routes for chat, upload, and health endpoints
  - [x] 1.8 Create conversation state management to track user progress through the flow
  - [x] 1.9 Add basic error handling and logging infrastructure

- [ ] 2.0 Implement CV Upload and Parsing
  - [x] 2.1 Create file upload component with drag-and-drop functionality
  - [ ] 2.2 Implement secure file upload API route that accepts PDF files
  - [ ] 2.3 Add file validation (file type, size limits, security checks) on both client and server
  - [ ] 2.4 Integrate PDF parsing library (e.g., pdf-parse) to extract text content
  - [ ] 2.5 Develop CV parsing logic to extract skills, experience, and job titles using NLP/regex
  - [ ] 2.6 Create TypeScript interfaces to structure extracted CV information
  - [ ] 2.7 Add error handling for corrupted or unreadable PDF files
  - [ ] 2.8 Implement upload progress indicator and success/error feedback in UI

- [ ] 3.0 Develop Preference Gathering Flow
  - [ ] 3.1 Create conversational UI components for preference collection
  - [ ] 3.2 Design conversational prompts for each preference category
  - [ ] 3.3 Implement work arrangement preference collection (Remote/Hybrid/In-Person)
  - [ ] 3.4 Implement location preference collection (EEA/Estonia)
  - [ ] 3.5 Implement company stage preference collection (Well-funded/IPO-ready/Unicorn)
  - [ ] 3.6 Implement job role preference collection with validation
  - [ ] 3.7 Add preference validation and confirmation steps in the UI
  - [ ] 3.8 Store collected preferences in structured format with local state management

- [ ] 4.0 Integrate External APIs for Company Evaluation
  - [ ] 4.1 Create server-side API routes for external data fetching
  - [ ] 4.2 Create Crunchbase API client using fetch for company size and funding data
  - [ ] 4.3 Create Glassdoor API client using fetch for employee reviews and ratings
  - [ ] 4.4 Create news API client (e.g., NewsAPI) using fetch for recent company updates
  - [ ] 4.5 Implement rate limiting and error handling for all API clients
  - [ ] 4.6 Create company evaluation orchestrator that combines data from all sources
  - [ ] 4.7 Implement caching mechanism (using Next.js cache or Redis) to avoid redundant API calls
  - [ ] 4.8 Add fallback mechanisms when API data is unavailable

- [ ] 5.0 Implement Shortlist Generation and Display
  - [ ] 5.1 Create responsive shortlist display components with modern UI
  - [ ] 5.2 Develop scoring algorithm that weights different company evaluation factors
  - [ ] 5.3 Implement job matching logic based on CV skills and user preferences
  - [ ] 5.4 Create ranking system to identify top 5 opportunities
  - [ ] 5.5 Implement shortlist formatter that generates potential scores (X/10)
  - [ ] 5.6 Add pros/cons generation based on company evaluation data
  - [ ] 5.7 Create company domain analysis and excitement factor descriptions
  - [ ] 5.8 Design and implement shortlist cards with company details, scores, and reasoning
  - [ ] 5.9 Add interactive elements (expand/collapse details, save opportunities)
  - [ ] 5.10 Add user feedback collection (satisfaction rating and relevance questions)
  - [ ] 5.11 Implement export functionality (PDF, email) for shortlist results 