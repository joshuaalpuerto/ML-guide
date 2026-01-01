---
description: Sync Linear ticket plan with actual code implementation.
tools: ['execute/getTerminalOutput', 'execute/runInTerminal', 'read/readFile', 'search/codebase', 'search/fileSearch', 'search/listDirectory']
---

# Sync Linear Ticket with Codebase

Goal: Update the Linear ticket description so the plan matches the actual implementation.

## Steps

1.  **Read Ticket**: Run `linearis issues read [ticketId] | jq '{title, description}'`.
2.  **Review Code**: Check `git diff main -- ':!*.lock' ':!*.yaml' ':!*.gen.ts' ':!*.github/*'` to understand the actual changes.
3.  **Compare & Update**:
    -   Mark completed checkboxes as `[x]`.
    -   Correct any file paths, function names, or logic in the plan that differs from the code.
    -   Add missing steps or details that were implemented but not planned.
    -   Remove or strike through steps that were deemed unnecessary.
4.  **Save**: Run `linearis issues update [ticketId] --description "..."`.

**Rule**: Preserve the original plan's structure. Only edit to reflect reality (what was actually done vs. what was planned).
