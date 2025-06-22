## Relevant Files

- `package.json` - Project dependencies and scripts configuration.
- `tsconfig.json` - TypeScript configuration file.
- `src/app.ts` - Main Express.js application entry point with chatbot endpoints.
- `src/app.test.ts` - Unit tests for main application routes and functionality.
- `src/chat/conversation-handler.ts` - Manages conversational flow and state management.
- `src/chat/conversation-handler.test.ts` - Unit tests for conversation handler.
- `src/upload/cv-uploader.ts` - Handles CV file upload and validation.
- `src/upload/cv-uploader.test.ts` - Unit tests for CV upload functionality.
- `src/parsing/cv-parser.ts` - Extracts structured data from uploaded CV files.
- `src/parsing/cv-parser.test.ts` - Unit tests for CV parsing functionality.
- `src/preferences/preference-collector.ts` - Manages user preference gathering through conversation.
- `src/preferences/preference-collector.test.ts` - Unit tests for preference collection.
- `src/evaluation/company-evaluator.ts` - Orchestrates company evaluation using external APIs.
- `src/evaluation/company-evaluator.test.ts` - Unit tests for company evaluation logic.
- `src/apis/crunchbase-client.ts` - Client for Crunchbase API integration.
- `src/apis/crunchbase-client.test.ts` - Unit tests for Crunchbase API client.
- `src/apis/glassdoor-client.ts` - Client for Glassdoor API integration.
- `src/apis/glassdoor-client.test.ts` - Unit tests for Glassdoor API client.
- `src/apis/news-client.ts` - Client for news/updates API integration.
- `src/apis/news-client.test.ts` - Unit tests for news API client.
- `src/shortlist/generator.ts` - Generates and ranks the final shortlist of opportunities.
- `src/shortlist/generator.test.ts` - Unit tests for shortlist generation.
- `src/shortlist/formatter.ts` - Formats shortlist output with scores, pros/cons, and summaries.
- `src/shortlist/formatter.test.ts` - Unit tests for shortlist formatting.
- `src/config/settings.ts` - Configuration management for API keys and application settings.
- `src/utils/file-handler.ts` - Secure file handling utilities for CV uploads.
- `src/utils/file-handler.test.ts` - Unit tests for file handling utilities.
- `src/types/user-data.ts` - TypeScript interfaces for user CV data and preferences.
- `src/types/company-data.ts` - TypeScript interfaces for company evaluation results.
- `.env` - Environment variables for API keys and configuration.

### Notes

- Unit tests should typically be placed alongside the code files they are testing.
- Use `npm test` or `jest` to run tests. Running without arguments executes all tests.
- Consider using environment variables for API keys and sensitive configuration.
- Implement proper error handling for external API failures and rate limiting.
- Use TypeScript interfaces for type safety and better development experience.

## Tasks

- [ ] 1.0 Setup Project and Conversational UI
  - [x] 1.1 Initialize Node.js/TypeScript project with dependencies (Express, Jest, dotenv, multer)
  - [ ] 1.2 Create project structure with src/ folder and subfolders for chat, upload, parsing, evaluation, etc.
  - [ ] 1.3 Set up TypeScript configuration and build scripts
  - [ ] 1.4 Set up configuration management for API keys and settings using environment variables
  - [ ] 1.5 Implement basic Express chatbot endpoint that can receive and respond to messages
  - [ ] 1.6 Create conversation state management to track user progress through the flow
  - [ ] 1.7 Add basic error handling and logging infrastructure (Winston or similar)

- [ ] 2.0 Implement CV Upload and Parsing
  - [ ] 2.1 Create secure file upload endpoint using Multer that accepts PDF files
  - [ ] 2.2 Implement file validation (file type, size limits, security checks)
  - [ ] 2.3 Integrate PDF parsing library (e.g., pdf-parse, pdf2pic) to extract text
  - [ ] 2.4 Develop CV parsing logic to extract skills, experience, and job titles using NLP/regex
  - [ ] 2.5 Create TypeScript interfaces to structure extracted CV information
  - [ ] 2.6 Add error handling for corrupted or unreadable PDF files

- [ ] 3.0 Develop Preference Gathering Flow
  - [ ] 3.1 Design conversational prompts for each preference category
  - [ ] 3.2 Implement work arrangement preference collection (Remote/Hybrid/In-Person)
  - [ ] 3.3 Implement location preference collection (EEA/Estonia)
  - [ ] 3.4 Implement company stage preference collection (Well-funded/IPO-ready/Unicorn)
  - [ ] 3.5 Implement job role preference collection with validation
  - [ ] 3.6 Add preference validation and confirmation steps
  - [ ] 3.7 Store collected preferences in structured format

- [ ] 4.0 Integrate External APIs for Company Evaluation
  - [ ] 4.1 Create Crunchbase API client using Axios for company size and funding data
  - [ ] 4.2 Create Glassdoor API client using Axios for employee reviews and ratings
  - [ ] 4.3 Create news API client (e.g., NewsAPI) using Axios for recent company updates
  - [ ] 4.4 Implement rate limiting (using node-rate-limiter-flexible) and error handling for all API clients
  - [ ] 4.5 Create company evaluation orchestrator that combines data from all sources
  - [ ] 4.6 Implement caching mechanism (using node-cache or Redis) to avoid redundant API calls
  - [ ] 4.7 Add fallback mechanisms when API data is unavailable

- [ ] 5.0 Implement Shortlist Generation and Display
  - [ ] 5.1 Develop scoring algorithm that weights different company evaluation factors
  - [ ] 5.2 Implement job matching logic based on CV skills and user preferences
  - [ ] 5.3 Create ranking system to identify top 5 opportunities
  - [ ] 5.4 Implement shortlist formatter that generates potential scores (X/10)
  - [ ] 5.5 Add pros/cons generation based on company evaluation data
  - [ ] 5.6 Create company domain analysis and excitement factor descriptions
  - [ ] 5.7 Format final output for conversational display with clear structure
  - [ ] 5.8 Add user feedback collection (satisfaction rating and relevance questions) 