# Product Requirements Document: AI Career Coach

## 1. Introduction/Overview

The AI Career Coach is a conversational assistant designed to revolutionize the job search experience. Instead of endlessly scrolling through generic job boards, users can upload their CV, define their ideal role, and receive a curated shortlist of the most promising opportunities. The assistant evaluates companies on metrics like funding, growth, and market presence to identify high-potential matches, saving the user time and surfacing opportunities they might otherwise miss.

## 2. Goals

*   **Reduce Search Time:** Eliminate manual research by consolidating company and job information into one clear summary.
*   **Discover Hidden Gems:** Surface job opportunities at high-potential companies (e.g., unicorns, well-funded startups) that align with the user's career goals.
*   **Provide Deep Analysis:** Offer a comprehensive evaluation of each company, including its market domain, funding history, and growth potential, so users can make informed decisions.
*   **Ensure High Relevance:** Deliver a highly accurate list of job opportunities by parsing the user's CV and matching it against their stated preferences.

## 3. User Stories

*   **As a job seeker, I want to** upload my CV (in PDF format) **so that** the app can automatically understand my skills, experience, and qualifications.
*   **As a job seeker, I want to** specify my job preferences through a conversation **so that** I can define my ideal work arrangement, location, company type, and role.
*   **As a job seeker, I want to** receive a data-driven evaluation of potential employers **so that** I can confidently focus on stable companies with high growth potential.
*   **As a job seeker, I want to** get a curated shortlist of the top 5 job opportunities **so that** I can focus my energy on the most relevant applications.
*   **As a job seeker, I want to** see a detailed summary for each opportunity—including a potential score, pros/cons, and domain overview—**so that** I can quickly understand why a company is a strong match.

## 4. Functional Requirements

1.  **CV Upload:** The system must allow users to upload a CV file in `.pdf` format.
2.  **CV Parsing:** The system must parse the uploaded CV to extract key information, including but not limited to:
    *   Skills (e.g., Python, React, Project Management).
    *   Years of Experience.
    *   Previous Job Titles and companies.
3.  **Conversational Preferences:** The system must gather user preferences via a chatbot interface. Preferences include:
    *   **Work Arrangement:** Remote, Hybrid, or In-Person.
    *   **Location:** European Economic Area (for remote/hybrid) or Estonia (for in-person).
    *   **Company Stage:** Well-funded, likely to IPO, or Unicorn status.
    *   **Job Role:** e.g., Full Stack Engineer, AI Engineer.
4.  **Company Evaluation:** The system must use external tools and APIs to gather data on companies. The evaluation must check for:
    *   Company size and growth trends (e.g., via Crunchbase).
    *   Funding history and market presence.
    *   Employee reviews (e.g., via Glassdoor).
    *   Recent news or updates indicating innovation or stability.
5.  **Shortlist Generation:** The system must generate a ranked shortlist of the top 5 most promising job opportunities.
6.  **Shortlist Output:** For each opportunity on the shortlist, the system must present:
    *   A **Potential Score** (e.g., 8/10).
    *   A list of **Pros and Cons**.
    *   A **Brief Summary** of why the company and role are a good match.
    *   An overview of the **Company's Domain** and why it's an exciting area to work in.

## 5. Non-Goals (Out of Scope)

*   The application **will not** handle the job application process. Its purpose is to shortlist opportunities.
*   The application **will not** provide direct contact information for recruiters or hiring managers.

## 6. Design Considerations

*   The primary interface will be a conversational chatbot. The tone should be professional, encouraging, and helpful.
*   The final shortlist should be presented in a clear, well-structured format within the chat, making it easy for the user to read and compare the opportunities.

## 7. Technical Considerations

*   Requires integration with a Large Language Model (LLM) for the conversational UI and analysis.
*   Must implement a secure file-handling mechanism for CV uploads.
*   Requires integration with external data APIs (e.g., Crunchbase, Glassdoor, News APIs). API keys and usage limits must be managed.
*   A robust CV parsing library or service is needed to accurately extract structured data from PDFs.

## 8. Success Metrics

*   **Completion Rate:** Percentage of users who successfully complete the entire flow, from CV upload to receiving a shortlist.
*   **User Satisfaction:** A simple 1-5 star rating presented at the end of the conversation.
*   **Match Relevance:** A follow-up question asking the user, "How many of these jobs would you consider applying for?"

## 9. Open Questions

*   Which specific APIs will be used for company data, and what are their costs and rate limits?
*   What is the fallback plan if data for a specific company cannot be found?
*   How will the "Potential Score" be calculated? What is the weighting for each data point (funding, reviews, growth, etc.)? 