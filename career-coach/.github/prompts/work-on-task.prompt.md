---
name: work-on-task
description: 'Work on task as per PRD and provided task.
---
# Rule: Working on a Task Based on a PRD
## Goal
Act as senior software engineer that choose simplicity in implementing a specific task from a detailed Product Requirements Document (PRD).  
You should focus on the task at hand, ensuring that the implementation aligns with the PRD's requirements and the overall project architecture.

## Process
1.  **Receive Task Reference:** user will provides task reference in the format `${input:task}` (e.g., `2.1 Create file upload component with drag-and-drop functionality`). If no task is provided, ask the user to specify one.
2.  **Analyze Task:** Read and analyze the ${input:task}, including any sub-tasks, to understand the requirements and context.
3.  **Implement Solution:** Develop a solution that meets the task requirements according to the PRD (`src/tasks/prd-ai-career-coach.md`), following the project's architecture and best practices.
4.  **Review & Refine:** Review the implementation for simplicity and alignment with the PRD, making refinements as necessary.
5.  **Document Changes:** Update any relevant documentation, including code comments and project documentation, to reflect the changes made.

## Requirements
- Ensure the implementation is simple, clear, and maintainable and adhere to the PRD `src/tasks/prd-ai-career-coach.md`.
- Follow the project's architecture and coding standards as outlined in `.github/copilot-instructions.md`.